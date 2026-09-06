'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sl_viewer_id';

function readOrCreate(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable (private mode etc.) — fall through to cookie/new id
  }

  const fromCookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${STORAGE_KEY}=`))
    ?.split('=')[1];
  if (fromCookie) return fromCookie;

  const id = crypto.randomUUID();
  persist(id);
  return id;
}

function persist(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
  // Non-httpOnly: this is just an identifier, not a credential, and needs to
  // be readable by client JS. 1 year expiry so it survives across visits.
  document.cookie = `${STORAGE_KEY}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

// Generates (once) and returns a stable per-browser viewer id used to scope
// favorites/downloads without requiring any account.
export function useViewerId(): string | null {
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    setViewerId(readOrCreate());
  }, []);

  return viewerId;
}
