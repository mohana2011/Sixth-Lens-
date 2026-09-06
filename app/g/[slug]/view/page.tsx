import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchGalleryMeta, fetchGalleryPhotoPage } from '@/lib/galleryData';
import { hasGalleryAccess } from '@/lib/galleryAccess';
import GalleryView from '@/components/gallery/GalleryView';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function GalleryViewPage({ params }: { params: { slug: string } }) {
  const gallery = await fetchGalleryMeta(params.slug);
  if (!gallery) notFound();

  if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
    redirect(`/g/${params.slug}`);
  }

  const authorized = await hasGalleryAccess(gallery);
  if (!authorized) redirect(`/g/${params.slug}`);

  const { photos, total } = await fetchGalleryPhotoPage(gallery.id, 0);

  return (
    <GalleryView
      slug={gallery.slug}
      galleryId={gallery.id}
      title={gallery.title}
      studioName={gallery.studio_name}
      downloadEnabled={gallery.download_enabled}
      initialPhotos={photos}
      total={total}
    />
  );
}
