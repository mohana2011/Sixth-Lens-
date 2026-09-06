'use client';

import type { PublicPhoto } from '@/lib/types';
import PhotoThumb from './PhotoThumb';

export default function PhotoGrid({
  photos,
  favoriteIds,
  onOpen,
  onToggleFavorite,
  hasMore,
  loadingMore,
  onLoadMore,
  emptyMessage,
}: {
  photos: PublicPhoto[];
  favoriteIds: Set<string>;
  onOpen: (index: number) => void;
  onToggleFavorite: (photoId: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  emptyMessage?: string;
}) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-ink/40">
        <p>{emptyMessage ?? 'No photos yet.'}</p>
      </div>
    );
  }

  return (
    <div className="px-2 py-3 sm:px-4 sm:py-5">
      <div className="photo-masonry">
        {photos.map((photo, i) => (
          <PhotoThumb
            key={photo.id}
            photo={photo}
            favorited={favoriteIds.has(photo.id)}
            onOpen={() => onOpen(i)}
            onToggleFavorite={() => onToggleFavorite(photo.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="min-touch rounded-full border border-line px-8 text-sm text-ink/80 transition hover:border-ink hover:text-ink disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
