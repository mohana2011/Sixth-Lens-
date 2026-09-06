import { query } from './db';
import { publicUrl } from './r2';

export const GALLERY_PAGE_SIZE = 40;

export type GalleryPageResult = {
  notFound?: boolean;
  expired?: boolean;
  requiresPin?: boolean;
  gallery?: {
    slug: string;
    title: string;
    studio_name: string;
    created_at: string;
    download_enabled: boolean;
    requires_pin: boolean;
  };
  photos?: { id: string; web: string; thumb: string; width: number; height: number }[];
  total?: number;
  offset?: number;
  pageSize?: number;
};

export type GalleryMetaRow = {
  id: string;
  slug: string;
  title: string;
  cover_photo_id: string | null;
  pin_hash: string | null;
  expires_at: string | null;
  download_enabled: boolean;
  photographer_id: string;
  created_at: string;
  studio_name: string;
};

export async function fetchGalleryMeta(slug: string): Promise<GalleryMetaRow | null> {
  const { rows } = await query<GalleryMetaRow>(
    `select g.*, ph.studio_name from galleries g
     join photographers ph on ph.id = g.photographer_id
     where g.slug = $1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function fetchGalleryPhotoPage(galleryId: string, offset: number, limit = GALLERY_PAGE_SIZE) {
  const [{ rows: photoRows }, { rows: countRows }] = await Promise.all([
    query(
      `select id, r2_key_web, r2_key_thumb, width, height
       from photos where gallery_id = $1
       order by sort_order asc, created_at asc
       limit $2 offset $3`,
      [galleryId, limit, offset]
    ),
    query('select count(*)::int as n from photos where gallery_id = $1', [galleryId]),
  ]);

  return {
    photos: photoRows.map((p) => ({
      id: p.id,
      web: publicUrl(p.r2_key_web),
      thumb: publicUrl(p.r2_key_thumb),
      width: p.width,
      height: p.height,
    })),
    total: countRows[0]?.n ?? 0,
  };
}
