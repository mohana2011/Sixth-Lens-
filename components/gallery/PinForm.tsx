'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PinForm({ slug, nextHref }: { slug: string; nextHref: string }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/g/${slug}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect PIN.');
        return;
      }
      router.push(nextHref);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-white/95 p-8 text-center shadow-xl"
    >
      <p className="text-sm tracking-wide text-ink/60">This gallery is private</p>
      <input
        autoFocus
        inputMode="numeric"
        pattern="[0-9]*"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
        className="min-touch w-full rounded-full border border-line px-5 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-ink"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !pin.trim()}
        className="min-touch w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {loading ? 'Checking...' : 'Unlock Gallery'}
      </button>
    </form>
  );
}
