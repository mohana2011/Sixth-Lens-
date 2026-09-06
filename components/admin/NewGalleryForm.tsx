'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGalleryForm() {
  const [title, setTitle] = useState('');
  const [pin, setPin] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          pin: pin || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create gallery.');
        return;
      }
      router.push(`/admin/galleries/${data.gallery.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1 block text-xs tracking-wide text-ink/60">Gallery title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Maren & Tobias — Wedding"
          className="min-touch w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs tracking-wide text-ink/60">PIN (optional, 4-8 digits)</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="Leave blank for no PIN"
          className="min-touch w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs tracking-wide text-ink/60">Expiry date (optional)</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="min-touch w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="min-touch mt-2 self-start rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Gallery'}
      </button>
    </form>
  );
}
