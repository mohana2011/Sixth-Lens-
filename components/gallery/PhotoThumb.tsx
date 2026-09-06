'use client';

import Image from 'next/image';
import type { PublicPhoto } from '@/lib/types';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M12 20s-7.5-4.6-10-9.2C.4 7.4 2.2 4 5.6 4c2 0 3.4 1 4.4 2.4C11 5 12.4 4 14.4 4c3.4 0 5.2 3.4 3.6 6.8C19.5 15.4 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

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
          favorited ? 'opacity-100 text-red-500' : ''
        }`}
      >
        <HeartIcon filled={favorited} />
      </button>
    </div>
  );
}
