import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
import { query } from '@/lib/db';
import { getObject } from '@/lib/r2';
import { hasGalleryAccess } from '@/lib/galleryAccess';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import type { Gallery } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { ok } = rateLimit(`zip:${clientIp(req)}`, 5, 10 * 60_000);
  if (!ok) return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });

  const { rows } = await query<Gallery>('select * from galleries where slug = $1', [params.slug]);
  const gallery = rows[0];
  if (!gallery) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });
  if (!gallery.download_enabled) {
    return NextResponse.json({ error: 'Downloads are disabled for this gallery.' }, { status: 403 });
  }
  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This gallery link has expired.' }, { status: 410 });
  }

  const authorized = await hasGalleryAccess(gallery);
  if (!authorized) return NextResponse.json({ error: 'PIN required.' }, { status: 401 });

  const { rows: photos } = await query(
    'select id, r2_key_original from photos where gallery_id = $1 order by sort_order asc',
    [gallery.id]
  );
  if (photos.length === 0) {
    return NextResponse.json({ error: 'No photos in this gallery.' }, { status: 404 });
  }

  const viewerId = req.nextUrl.searchParams.get('viewerId') || null;
  await query('insert into downloads (gallery_id, photo_id, viewer_id) values ($1, null, $2)', [
    gallery.id,
    viewerId,
  ]);

  // store: true — originals are already-compressed JPEGs, so re-compressing
  // wastes CPU for no size benefit. This also lets archiver stream through
  // each object with minimal buffering instead of holding whole files.
  const archive = archiver('zip', { store: true });
  const passthrough = new PassThrough();
  archive.on('warning', (err) => console.warn('archiver warning', err));
  archive.on('error', (err) => passthrough.destroy(err));
  archive.pipe(passthrough);

  (async () => {
    try {
      for (const p of photos) {
        const obj = await getObject(p.r2_key_original);
        const ext = p.r2_key_original.split('.').pop() || 'jpg';
        // obj.Body's declared type is a cross-platform union (web ReadableStream |
        // Node Readable | Blob); under the Node runtime (set above) it's always a
        // Node Readable at runtime, which is what archiver.append expects.
        archive.append(obj.Body as unknown as Readable, { name: `${p.id}.${ext}` });
      }
      await archive.finalize();
    } catch (err) {
      passthrough.destroy(err as Error);
    }
  })();

  const webStream = Readable.toWeb(passthrough) as unknown as ReadableStream;
  const safeTitle = gallery.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'gallery';

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeTitle}.zip"`,
    },
  });
}
