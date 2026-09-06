'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicPhoto } from '@/lib/types';
import { useViewerId } from '@/lib/useViewerId';
import TopBar from './TopBar';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';

export default function GalleryView({
  slug,
  galleryId,
  title,
  studioName,
  downloadEnabled,
  initialPhotos,
  total,
}: {
  slug: string;
  galleryId: string;
  title: string;
  studioName: string;
  downloadEnabled: boolean;
  initialPhotos: PublicPhoto[];
  total: number;
}) {
  const viewerId = useViewerId();
  const [photos, setPhotos] = useState<PublicPhoto[]>(initialPhotos);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!viewerId) return;
    fetch(`/api/favorites?gallery_id=${galleryId}&viewer_id=${viewerId}`)
      .then((r) => (r.ok ? r.json() : { photoIds: [] }))
      .then((data) => setFavoriteIds(new Set<string>(data.photoIds ?? [])))
      .catch(() => {});
  }, [viewerId, galleryId]);

  const hasMore = photos.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/g/${slug}?offset=${photos.length}${viewerId ? `&viewerId=${viewerId}` : ''}`
      );
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) => [...prev, ...data.photos]);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, slug, photos.length, viewerId]);

  const toggleFavorite = useCallback(
    (photoId: string) => {
      if (!viewerId) return;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(photoId)) next.delete(photoId);
        else next.add(photoId);
        return next;
      });
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery_id: galleryId, photo_id: photoId, viewer_id: viewerId }),
      }).catch(() => {
        // roll back optimistic update on network failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (next.has(photoId)) next.delete(photoId);
          else next.add(photoId);
          return next;
        });
      });
    },
    [viewerId, galleryId]
  );

  const displayedPhotos = useMemo(
    () => (favoritesOnly ? photos.filter((p) => favoriteIds.has(p.id)) : photos),
    [photos, favoritesOnly, favoriteIds]
  );

  async function downloadPhoto(photoId: string) {
    const res = await fetch(`/api/download/${photoId}${viewerId ? `?viewerId=${viewerId}` : ''}`);
    if (!res.ok) return;
    const { url } = await res.json();
    window.location.href = url;
  }

  function downloadAll() {
    window.location.href = `/api/g/${slug}/download-all${viewerId ? `?viewerId=${viewerId}` : ''}`;
  }

  async function share() {
    const url = `${window.location.origin}/g/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  function startSlideshow() {
    if (displayedPhotos.length === 0) return;
    setSlideshow(true);
    setLightboxIndex(0);
  }

  return (
    <main className="min-h-dvh bg-paper">
      <TopBar
        title={title}
        studioName={studioName}
        downloadEnabled={downloadEnabled}
        favoritesOnly={favoritesOnly}
        onToggleFavorites={() => setFavoritesOnly((v) => !v)}
        onDownloadAll={downloadAll}
        onShare={share}
        onSlideshow={startSlideshow}
        shareCopied={shareCopied}
      />

      <PhotoGrid
        photos={displayedPhotos}
        favoriteIds={favoriteIds}
        onOpen={(i) => setLightboxIndex(i)}
        onToggleFavorite={toggleFavorite}
        hasMore={!favoritesOnly && hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        emptyMessage={favoritesOnly ? 'No favorites yet — tap the heart on any photo.' : undefined}
      />

      {lightboxIndex !== null && displayedPhotos[lightboxIndex] && (
        <Lightbox
          photos={displayedPhotos}
          index={lightboxIndex}
          onClose={() => {
            setLightboxIndex(null);
            setSlideshow(false);
          }}
          onNavigate={setLightboxIndex}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onDownload={downloadPhoto}
          slideshow={slideshow}
        />
      )}
    </main>
  );
}
