import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { publicUrl } from '@/lib/r2';
import { hasGalleryAccess } from '@/lib/galleryAccess';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { fetchGalleryMeta, fetchGalleryPhotoPage } from '@/lib/galleryData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { ok } = rateLimit(`g:${clientIp(req)}`, 120, 60_000);
  if (!ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const gallery = await fetchGalleryMeta(params.slug);
  if (!gallery) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });

  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This gallery link has expired.' }, { status: 410 });
  }

  const authorized = await hasGalleryAccess(gallery);
  if (!authorized) {
    return NextResponse.json({ error: 'PIN required.', requiresPin: true }, { status: 401 });
  }

  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? 0) || 0);
  const viewerId = req.nextUrl.searchParams.get('viewerId') || null;

  if (offset === 0) {
    await query('insert into gallery_views (gallery_id, viewer_id) values ($1, $2)', [gallery.id, viewerId]);
  }

  const { photos, total } = await fetchGalleryPhotoPage(gallery.id, offset);

  let cover = null;
  if (gallery.cover_photo_id) {
    const { rows: coverRows } = await query('select r2_key_web, width, height from photos where id = $1', [
      gallery.cover_photo_id,
    ]);
    if (coverRows[0]) {
      cover = { web: publicUrl(coverRows[0].r2_key_web), width: coverRows[0].width, height: coverRows[0].height };
    }
  }

  return NextResponse.json({
    gallery: {
      slug: gallery.slug,
      title: gallery.title,
      studio_name: gallery.studio_name,
      created_at: gallery.created_at,
      download_enabled: gallery.download_enabled,
      requires_pin: !!gallery.pin_hash,
      cover,
    },
    photos,
    total,
    offset,
    pageSize: 40,
  });
}
