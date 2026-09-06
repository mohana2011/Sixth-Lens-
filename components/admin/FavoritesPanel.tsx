'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type Favorite = { photo_id: string; web: string; viewers: string[]; first_favorited_at: string };

export default function FavoritesPanel({ galleryId }: { galleryId: string }) {
  const [favorites, setFavorites] = useState<Favorite[] | null>(null);

  useEffect(() => {
    fetch(`/api/galleries/${galleryId}/favorites`)
      .then((r) => r.json())
      .then((data) => setFavorites(data.favorites ?? []))
      .catch(() => setFavorites([]));
  }, [galleryId]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink">Client Favorites</h2>
        <a
          href={`/api/galleries/${galleryId}/favorites?export=csv`}
          className="min-touch flex items-center rounded-full border border-line px-4 text-xs text-ink/70 hover:border-ink hover:text-ink"
        >
          Export CSV
        </a>
      </div>

      {favorites === null ? (
        <p className="text-sm text-ink/40">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="text-sm text-ink/40">No favorites yet.</p>
      ) : (
        <div className="photo-grid">
          {favorites.map((f) => (
            <div key={f.photo_id} className="relative aspect-square overflow-hidden rounded-md bg-line">
              <Image src={f.web} alt="" fill sizes="200px" className="object-cover" />
              <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                ♥ {f.viewers.length}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
