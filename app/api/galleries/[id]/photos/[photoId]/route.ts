import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminId } from '@/lib/session';
import { deleteObject } from '@/lib/r2';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await query(
    `select p.* from photos p
     join galleries g on g.id = p.gallery_id
     where p.id = $1 and p.gallery_id = $2 and g.photographer_id = $3`,
    [params.photoId, params.id, photographerId]
  );
  const photo = rows[0];
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await query('delete from photos where id = $1', [photo.id]);
  await Promise.allSettled([
    deleteObject(photo.r2_key_original),
    deleteObject(photo.r2_key_web),
    deleteObject(photo.r2_key_thumb),
  ]);

  return NextResponse.json({ ok: true });
}
