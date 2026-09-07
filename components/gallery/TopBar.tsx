'use client';

import Logo from '@/components/Logo';
import HeartIcon from '@/components/icons/HeartIcon';

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.1 10.7l7.8-4.4M8.1 13.3l7.8 4.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function SlideshowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
    </svg>
  );
}
export default function TopBar({
  title,
  studioName,
  downloadEnabled,
  favoritesOnly,
  onToggleFavorites,
  onDownloadAll,
  onShare,
  onSlideshow,
  shareCopied,
}: {
  title: string;
  studioName: string;
  downloadEnabled: boolean;
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
  onDownloadAll: () => void;
  onShare: () => void;
  onSlideshow: () => void;
  shareCopied: boolean;
}) {
  return (
    <div className="sticky top-0 z-30 glass border-b border-line safe-top">
      <div className="flex items-center gap-3 px-3 py-2.5 safe-x sm:px-5">
        <Logo variant="black" size={26} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm leading-tight text-ink sm:text-base">{title}</p>
          <p className="truncate text-[11px] leading-tight text-ink/50">{studioName}</p>
        </div>

        <div className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto">
          <button
            onClick={onToggleFavorites}
            aria-pressed={favoritesOnly}
            className={`min-touch flex items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
              favoritesOnly ? 'bg-ink text-white' : 'text-ink/70 hover:bg-ink/5'
            }`}
          >
            <HeartIcon filled={favoritesOnly} />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          <button
            onClick={onSlideshow}
            className="min-touch flex items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink/70 transition hover:bg-ink/5"
          >
            <SlideshowIcon />
            <span className="hidden sm:inline">Slideshow</span>
          </button>

          <button
            onClick={onShare}
            className="min-touch flex items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink/70 transition hover:bg-ink/5"
          >
            <ShareIcon />
            <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>

          {downloadEnabled && (
            <button
              onClick={onDownloadAll}
              className="min-touch flex items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-medium text-white transition hover:opacity-90"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Download All</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
