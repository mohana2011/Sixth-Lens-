import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { presignedDownloadUrl } from '@/lib/r2';
import { hasGalleryAccess } from '@/lib/galleryAccess';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { photoId: string } }) {
  const { ok } = rateLimit(`dl:${clientIp(req)}`, 60, 60_000);
  if (!ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const { rows } = await query(
    `select p.id, p.r2_key_original, g.id as gallery_id, g.slug, g.pin_hash, g.download_enabled, g.expires_at
     from photos p join galleries g on g.id = p.gallery_id
     where p.id = $1`,
    [params.photoId]
  );
  const row = rows[0];
  if (!row) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
  if (!row.download_enabled) {
    return NextResponse.json({ error: 'Downloads are disabled for this gallery.' }, { status: 403 });
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This gallery link has expired.' }, { status: 410 });
  }

  const authorized = await hasGalleryAccess({ slug: row.slug, pin_hash: row.pin_hash });
  if (!authorized) return NextResponse.json({ error: 'PIN required.' }, { status: 401 });

  const viewerId = req.nextUrl.searchParams.get('viewerId') || null;
  await query('insert into downloads (gallery_id, photo_id, viewer_id) values ($1, $2, $3)', [
    row.gallery_id,
    row.id,
    viewerId,
  ]);

  const ext = row.r2_key_original.split('.').pop() || 'jpg';
  const url = await presignedDownloadUrl(row.r2_key_original, `${row.id}.${ext}`, 900);

  return NextResponse.json({ url, expiresIn: 900 });
}
