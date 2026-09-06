import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hasGalleryAccess } from '@/lib/galleryAccess';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const galleryId = req.nextUrl.searchParams.get('gallery_id');
  const viewerId = req.nextUrl.searchParams.get('viewer_id');
  if (!galleryId || !viewerId) {
    return NextResponse.json({ error: 'gallery_id and viewer_id are required.' }, { status: 400 });
  }

  const { rows: galleryRows } = await query<{ slug: string; pin_hash: string | null }>(
    'select slug, pin_hash from galleries where id = $1',
    [galleryId]
  );
  const gallery = galleryRows[0];
  if (!gallery) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });

  const authorized = await hasGalleryAccess(gallery);
  if (!authorized) return NextResponse.json({ error: 'PIN required.' }, { status: 401 });

  const { rows } = await query('select photo_id from favorites where gallery_id = $1 and viewer_id = $2', [
    galleryId,
    viewerId,
  ]);
  return NextResponse.json({ photoIds: rows.map((r) => r.photo_id) });
}

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(`fav:${clientIp(req)}`, 120, 60_000);
  if (!ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const { gallery_id, photo_id, viewer_id } = await req.json().catch(() => ({}));
  if (
    typeof gallery_id !== 'string' ||
    typeof photo_id !== 'string' ||
    typeof viewer_id !== 'string' ||
    !viewer_id.trim()
  ) {
    return NextResponse.json({ error: 'gallery_id, photo_id and viewer_id are required.' }, { status: 400 });
  }

  const { rows: galleryRows } = await query<{ slug: string; pin_hash: string | null }>(
    'select slug, pin_hash from galleries where id = $1',
    [gallery_id]
  );
  const gallery = galleryRows[0];
  if (!gallery) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });

  const authorized = await hasGalleryAccess(gallery);
  if (!authorized) return NextResponse.json({ error: 'PIN required.' }, { status: 401 });

  const { rows: existing } = await query(
    'select id from favorites where gallery_id = $1 and viewer_id = $2 and photo_id = $3',
    [gallery_id, viewer_id, photo_id]
  );

  if (existing[0]) {
    await query('delete from favorites where id = $1', [existing[0].id]);
    return NextResponse.json({ favorited: false });
  }

  await query(
    `insert into favorites (gallery_id, viewer_id, photo_id) values ($1, $2, $3)
     on conflict (gallery_id, viewer_id, photo_id) do nothing`,
    [gallery_id, viewer_id, photo_id]
  );
  return NextResponse.json({ favorited: true });
}
