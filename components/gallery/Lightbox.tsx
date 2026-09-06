'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicPhoto } from '@/lib/types';

const SWIPE_THRESHOLD = 50;
const DISMISS_THRESHOLD = 90;
const SLIDESHOW_INTERVAL_MS = 4000;

function IconButton({
  onClick,
  label,
  children,
  className = '',
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`min-touch flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${className}`}
    >
      {children}
    </button>
  );
}

export default function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
  favoriteIds,
  onToggleFavorite,
  onDownload,
  slideshow,
}: {
  photos: PublicPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  favoriteIds: Set<string>;
  onToggleFavorite: (photoId: string) => void;
  onDownload: (photoId: string) => void;
  slideshow: boolean;
}) {
  const photo = photos[index];
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [dragY, setDragY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = () => onNavigate((index + 1) % photos.length);
  const goPrev = () => onNavigate((index - 1 + photos.length) % photos.length);

  // Keyboard nav + escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length]);

  // Preload neighbors so nav feels instant.
  useEffect(() => {
    [photos[(index + 1) % photos.length], photos[(index - 1 + photos.length) % photos.length]].forEach((p) => {
      if (!p) return;
      const img = new window.Image();
      img.src = p.web;
    });
  }, [index, photos]);

  // Slideshow auto-advance.
  useEffect(() => {
    if (!slideshow || photos.length < 2) return;
    const id = setInterval(goNext, SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideshow, index, photos.length]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!photo) return null;

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dy = t.clientY - touchStart.current.y;
    const dx = t.clientX - touchStart.current.x;
    if (Math.abs(dy) > Math.abs(dx) && dy > 0) setDragY(dy);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    setDragY(0);

    if (dy > DISMISS_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onClose();
      return;
    }
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }

  const favorited = favoriteIds.has(photo.id);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in"
      style={{ opacity: 1 - Math.min(dragY / 300, 0.6) }}
      ref={containerRef}
    >
      <div className="safe-top safe-x flex items-center justify-between p-3">
        <span className="text-xs text-white/60">
          {index + 1} / {photos.length}
        </span>
        <div className="flex gap-2">
          <IconButton label={favorited ? 'Remove favorite' : 'Add favorite'} onClick={() => onToggleFavorite(photo.id)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? '#ef4444' : 'none'}>
              <path
                d="M12 20s-7.5-4.6-10-9.2C.4 7.4 2.2 4 5.6 4c2 0 3.4 1 4.4 2.4C11 5 12.4 4 14.4 4c3.4 0 5.2 3.4 3.6 6.8C19.5 15.4 12 20 12 20z"
                stroke={favorited ? '#ef4444' : 'currentColor'}
                strokeWidth="1.6"
              />
            </svg>
          </IconButton>
          <IconButton label="Download photo" onClick={() => onDownload(photo.id)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ transform: `translateY(${dragY}px)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.web}
          alt=""
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous photo"
          className="min-touch absolute left-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 sm:flex"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next photo"
          className="min-touch absolute right-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 sm:flex"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Mobile nav bar (arrows always visible on touch, no hover dependency) */}
      <div className="safe-bottom safe-x flex items-center justify-center gap-10 pb-4 sm:hidden">
        <IconButton label="Previous photo" onClick={goPrev}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <IconButton label="Next photo" onClick={goNext}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}
