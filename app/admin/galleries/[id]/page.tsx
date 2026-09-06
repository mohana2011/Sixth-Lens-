import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/session';
import { query } from '@/lib/db';
import { publicUrl } from '@/lib/r2';
import AdminNav from '@/components/admin/AdminNav';
import GalleryManager from '@/components/admin/GalleryManager';

export const dynamic = 'force-dynamic';

export default async function GalleryDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();

  const { rows } = await query('select * from galleries where id = $1 and photographer_id = $2', [
    params.id,
    admin.id,
  ]);
  const gallery = rows[0];
  if (!gallery) notFound();

  const { rows: photoRows } = await query(
    'select * from photos where gallery_id = $1 order by sort_order asc, created_at asc',
    [gallery.id]
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return (
    <main className="min-h-dvh bg-paper">
      <AdminNav studioName={admin.studio_name} />
      <div className="mx-auto max-w-6xl px-4 py-10 safe-x sm:px-6">
        <h1 className="mb-8 font-serif text-2xl text-ink">{gallery.title}</h1>
        <GalleryManager
          galleryId={gallery.id}
          shareUrl={`${siteUrl}/g/${gallery.slug}`}
          downloadEnabled={gallery.download_enabled}
          initialCoverPhotoId={gallery.cover_photo_id}
          initialPhotos={photoRows.map((p) => ({
            id: p.id,
            width: p.width,
            height: p.height,
            sort_order: p.sort_order,
            thumb: publicUrl(p.r2_key_thumb),
            web: publicUrl(p.r2_key_web),
          }))}
        />
      </div>
    </main>
  );
}
