'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GalleryAccessForm() {
  const [value, setValue] = useState('');
  const router = useRouter();

  function go(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    // Accept either a full URL/path they pasted, or a bare slug.
    let slug = trimmed;
    try {
      if (trimmed.includes('/g/')) {
        slug = trimmed.split('/g/')[1].split(/[/?#]/)[0];
      }
    } catch {
      // fall through, use raw value
    }
    router.push(`/g/${encodeURIComponent(slug)}`);
  }

  return (
    <form onSubmit={go} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste your gallery link or code"
        className="min-touch w-full flex-1 rounded-full border border-line bg-white px-5 py-3 text-sm text-ink outline-none focus:border-ink"
        aria-label="Gallery link or code"
      />
      <button
        type="submit"
        className="min-touch shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        View Gallery
      </button>
    </form>
  );
}
