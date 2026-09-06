'use client';

import { useState } from 'react';

export default function ShareLink({
  shareUrl,
  downloadEnabled: initialDownloadEnabled,
  galleryId,
}: {
  shareUrl: string;
  downloadEnabled: boolean;
  galleryId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(initialDownloadEnabled);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
  }

  async function toggleDownloads() {
    const next = !downloadEnabled;
    setDownloadEnabled(next);
    await fetch(`/api/galleries/${galleryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadEnabled: next }),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs tracking-wide text-ink/50">Shareable client link</p>
        <p className="truncate font-mono text-sm text-ink">{shareUrl}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-ink/60">
          <input type="checkbox" checked={downloadEnabled} onChange={toggleDownloads} className="h-4 w-4" />
          Downloads enabled
        </label>
        <button
          onClick={copy}
          className="min-touch shrink-0 rounded-full bg-ink px-5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
