import { query } from './db';
import { publicUrl } from './r2';

export async function getGalleryForCover(slug: string) {
  const { rows } = await query(
    `select g.slug, g.title, g.created_at, g.pin_hash, g.expires_at, ph.studio_name,
            p.r2_key_web as cover_web, p.width as cover_width, p.height as cover_height
     from galleries g
     join photographers ph on ph.id = g.photographer_id
     left join photos p on p.id = g.cover_photo_id
     where g.slug = $1`,
    [slug]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    slug: row.slug,
    title: row.title,
    studioName: row.studio_name,
    createdAt: row.created_at as string,
    requiresPin: !!row.pin_hash,
    pinHash: row.pin_hash as string | null,
    expired: row.expires_at ? new Date(row.expires_at) < new Date() : false,
    cover: row.cover_web
      ? { web: publicUrl(row.cover_web), width: row.cover_width as number, height: row.cover_height as number }
      : null,
  };
}
