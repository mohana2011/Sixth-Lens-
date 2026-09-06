'use client';

import { useState } from 'react';
import Uploader from './Uploader';
import PhotoManageGrid from './PhotoManageGrid';
import FavoritesPanel from './FavoritesPanel';
import ShareLink from './ShareLink';

export type AdminPhoto = {
  id: string;
  width: number;
  height: number;
  sort_order: number;
  thumb: string;
  web: string;
};

type Tab = 'photos' | 'favorites';

export default function GalleryManager({
  galleryId,
  shareUrl,
  downloadEnabled,
  initialPhotos,
  initialCoverPhotoId,
}: {
  galleryId: string;
  shareUrl: string;
  downloadEnabled: boolean;
  initialPhotos: AdminPhoto[];
  initialCoverPhotoId: string | null;
}) {
  const [photos, setPhotos] = useState<AdminPhoto[]>(initialPhotos);
  const [coverPhotoId, setCoverPhotoId] = useState(initialCoverPhotoId);
  const [tab, setTab] = useState<Tab>('photos');

  function handleUploaded(photo: AdminPhoto) {
    setPhotos((prev) => [...prev, photo]);
    setCoverPhotoId((prev) => prev ?? photo.id);
  }

  async function handleReorder(orderedIds: string[]) {
    const byId = new Map(photos.map((p) => [p.id, p]));
    setPhotos(orderedIds.map((id, i) => ({ ...byId.get(id)!, sort_order: i })));
    await fetch(`/api/galleries/${galleryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoOrder: orderedIds.map((id, i) => ({ id, sort_order: i })) }),
    });
  }

  async function handleSetCover(photoId: string) {
    setCoverPhotoId(photoId);
    await fetch(`/api/galleries/${galleryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coverPhotoId: photoId }),
    });
  }

  async function handleDelete(photoId: string) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    await fetch(`/api/galleries/${galleryId}/photos/${photoId}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-8">
      <ShareLink shareUrl={shareUrl} downloadEnabled={downloadEnabled} galleryId={galleryId} />

      <div>
        <h2 className="mb-3 font-serif text-lg text-ink">Upload Photos</h2>
        <Uploader galleryId={galleryId} onUploaded={handleUploaded} />
      </div>

      <div>
        <div className="mb-4 flex gap-6 border-b border-line">
          <button
            onClick={() => setTab('photos')}
            className={`min-touch border-b-2 px-1 text-sm ${
              tab === 'photos' ? 'border-ink text-ink' : 'border-transparent text-ink/40'
            }`}
          >
            Photos ({photos.length})
          </button>
          <button
            onClick={() => setTab('favorites')}
            className={`min-touch border-b-2 px-1 text-sm ${
              tab === 'favorites' ? 'border-ink text-ink' : 'border-transparent text-ink/40'
            }`}
          >
            Favorites
          </button>
        </div>

        {tab === 'photos' ? (
          <PhotoManageGrid
            photos={photos}
            coverPhotoId={coverPhotoId}
            onReorder={handleReorder}
            onSetCover={handleSetCover}
            onDelete={handleDelete}
          />
        ) : (
          <FavoritesPanel galleryId={galleryId} />
        )}
      </div>
    </div>
  );
}
