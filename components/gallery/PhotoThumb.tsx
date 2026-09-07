'use client';

import Image from 'next/image';
import type { PublicPhoto } from '@/lib/types';
import HeartIcon from '@/components/icons/HeartIcon';

export default function PhotoThumb({
  photo,
  favorited,
  onOpen,
  onToggleFavorite,
}: {
  photo: PublicPhoto;
  favorited: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group relative w-full overflow-hidden rounded-sm bg-line" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
      <button onClick={onOpen} className="absolute inset-0 h-full w-full" aria-label="Open photo">
        <Image
          src={photo.thumb}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={favorited ? 'Remove favorite' : 'Add favorite'}
        aria-pressed={favorited}
        className={`min-touch touch-reveal absolute right-1.5 top-1.5 flex items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 ${
          favorited ? 'opacity-100 !text-red-500' : ''
        }`}
      >
        <HeartIcon filled={favorited} />
      </button>
    </div>
  );
}
