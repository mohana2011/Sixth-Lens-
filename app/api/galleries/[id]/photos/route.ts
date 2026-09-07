import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
// The global `File` isn't reliably defined in every Node runtime that can run
// this route (it's version- and platform-dependent), so import it explicitly
// from node:buffer instead of relying on `instanceof File` against a global.
import { File } from 'buffer';
import { query } from '@/lib/db';
import { getAdminId } from '@/lib/session';
import { putObject, r2Keys, publicUrl } from '@/lib/r2';

export const runtime = 'nodejs';
// Large originals; give sharp + the R2 upload plenty of headroom.
export const maxDuration = 120;

const WEB_LONG_EDGE = 2000;
const THUMB_LONG_EDGE = 400;

function extFromFilename(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return (match?.[1] || 'jpg').toLowerCase();
}

function contentTypeFromExt(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: galleryRows } = await query('select id from galleries where id = $1 and photographer_id = $2', [
    params.id,
    photographerId,
  ]);
  const gallery = galleryRows[0];
  if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const ext = extFromFilename(file.name);
  const photoId = randomUUID();

  let webBuffer: Buffer;
  let thumbBuffer: Buffer;
  let width: number;
  let height: number;

  try {
    // Lazy-imported so this native module is only loaded when a route
    // actually runs, not whenever the app is built/bundled.
    const sharp = (await import('sharp')).default;
    const image = sharp(originalBuffer, { failOn: 'none' }).rotate(); // auto-orient via EXIF
    const metadata = await image.metadata();
    width = metadata.width ?? 0;
    height = metadata.height ?? 0;

    webBuffer = await image
      .clone()
      .resize({ width: WEB_LONG_EDGE, height: WEB_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    thumbBuffer = await image
      .clone()
      .resize({ width: THUMB_LONG_EDGE, height: THUMB_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not process image. Unsupported or corrupt file.' },
      { status: 422 }
    );
  }

  const keyOriginal = r2Keys.original(gallery.id, photoId, ext);
  const keyWeb = r2Keys.web(gallery.id, photoId);
  const keyThumb = r2Keys.thumb(gallery.id, photoId);

  await Promise.all([
    putObject(keyOriginal, originalBuffer, contentTypeFromExt(ext)),
    putObject(keyWeb, webBuffer, 'image/jpeg'),
    putObject(keyThumb, thumbBuffer, 'image/jpeg'),
  ]);

  const { rows } = await query(
    `with next as (
       select coalesce(max(sort_order), -1) + 1 as n from photos where gallery_id = $1
     )
     insert into photos (id, gallery_id, r2_key_original, r2_key_web, r2_key_thumb, width, height, sort_order)
     select $2, $1, $3, $4, $5, $6, $7, next.n from next
     returning *`,
    [gallery.id, photoId, keyOriginal, keyWeb, keyThumb, width, height]
  );

  // First photo uploaded to a gallery becomes the cover by default.
  await query(
    `update galleries set cover_photo_id = $1
     where id = $2 and cover_photo_id is null`,
    [photoId, gallery.id]
  );

  const photo = rows[0];
  return NextResponse.json(
    {
      photo: {
        id: photo.id,
        width: photo.width,
        height: photo.height,
        sort_order: photo.sort_order,
        thumb: publicUrl(photo.r2_key_thumb),
        web: publicUrl(photo.r2_key_web),
      },
    },
    { status: 201 }
  );
}
