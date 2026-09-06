'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AdminPhoto } from './GalleryManager';

export default function PhotoManageGrid({
  photos,
  coverPhotoId,
  onReorder,
  onSetCover,
  onDelete,
}: {
  photos: AdminPhoto[];
  coverPhotoId: string | null;
  onReorder: (orderedIds: string[]) => void;
  onSetCover: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!dragKey || dragKey === targetId) {
      setDragKey(null);
      setOverKey(null);
      return;
    }
    const ids = photos.map((p) => p.id);
    const from = ids.indexOf(dragKey);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragKey);
    setDragKey(null);
    setOverKey(null);
    onReorder(ids);
  }

  if (photos.length === 0) {
    return <p className="py-10 text-center text-sm text-ink/40">No photos uploaded yet.</p>;
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <div
          key={photo.id}
          draggable
          onDragStart={() => setDragKey(photo.id)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverKey(photo.id);
          }}
          onDrop={() => handleDrop(photo.id)}
          className={`group relative aspect-square cursor-grab overflow-hidden rounded-md bg-line ${
            overKey === photo.id && dragKey !== photo.id ? 'ring-2 ring-ink' : ''
          }`}
        >
          <Image src={photo.thumb} alt="" fill sizes="200px" className="object-cover" />

          {photo.id === coverPhotoId && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">
              Cover
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {photo.id !== coverPhotoId && (
              <button
                onClick={() => onSetCover(photo.id)}
                className="min-touch rounded-full bg-white/90 px-2 text-[11px] text-ink"
              >
                Set cover
              </button>
            )}
            <button
              onClick={() => onDelete(photo.id)}
              className="min-touch rounded-full bg-white/90 px-2 text-[11px] text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
