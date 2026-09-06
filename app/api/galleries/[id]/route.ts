import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getAdminId } from '@/lib/session';
import { publicUrl } from '@/lib/r2';

export const runtime = 'nodejs';

async function loadOwnedGallery(id: string, photographerId: string) {
  const { rows } = await query(
    'select * from galleries where id = $1 and photographer_id = $2',
    [id, photographerId]
  );
  return rows[0] ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gallery = await loadOwnedGallery(params.id, photographerId);
  if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows: photos } = await query(
    'select * from photos where gallery_id = $1 order by sort_order asc, created_at asc',
    [gallery.id]
  );

  return NextResponse.json({
    gallery: {
      ...gallery,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/g/${gallery.slug}`,
    },
    photos: photos.map((p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      sort_order: p.sort_order,
      thumb: publicUrl(p.r2_key_thumb),
      web: publicUrl(p.r2_key_web),
      is_cover: p.id === gallery.cover_photo_id,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gallery = await loadOwnedGallery(params.id, photographerId);
  if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Reorder photos: [{ id, sort_order }]
  if (Array.isArray(body.photoOrder)) {
    for (const item of body.photoOrder) {
      if (typeof item.id !== 'string' || typeof item.sort_order !== 'number') continue;
      await query(
        'update photos set sort_order = $1 where id = $2 and gallery_id = $3',
        [item.sort_order, item.id, gallery.id]
      );
    }
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (typeof body.title === 'string' && body.title.trim()) {
    sets.push(`title = $${i++}`);
    values.push(body.title.trim());
  }
  if (body.coverPhotoId === null || typeof body.coverPhotoId === 'string') {
    sets.push(`cover_photo_id = $${i++}`);
    values.push(body.coverPhotoId);
  }
  if (typeof body.downloadEnabled === 'boolean') {
    sets.push(`download_enabled = $${i++}`);
    values.push(body.downloadEnabled);
  }
  if (body.expiresAt === null || typeof body.expiresAt === 'string') {
    sets.push(`expires_at = $${i++}`);
    values.push(body.expiresAt);
  }
  if (typeof body.pin === 'string') {
    const hash = body.pin.trim() ? await bcrypt.hash(body.pin.trim(), 10) : null;
    sets.push(`pin_hash = $${i++}`);
    values.push(hash);
  }

  if (sets.length > 0) {
    values.push(gallery.id);
    await query(`update galleries set ${sets.join(', ')} where id = $${i}`, values);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gallery = await loadOwnedGallery(params.id, photographerId);
  if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await query('delete from galleries where id = $1', [gallery.id]);
  // Note: this does not delete the underlying R2 objects. Run a cleanup job
  // against orphaned originals/{id}, web/{id}, thumb/{id} prefixes if needed.
  return NextResponse.json({ ok: true });
}
