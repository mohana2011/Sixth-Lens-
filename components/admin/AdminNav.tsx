'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function AdminNav({ studioName }: { studioName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-white safe-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 safe-x sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Logo variant="black" size={26} />
          <span className="font-serif text-base text-ink">{studioName}</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className={`text-sm ${pathname === '/admin/dashboard' ? 'text-ink' : 'text-ink/50 hover:text-ink'}`}
          >
            Galleries
          </Link>
          <Link
            href="/admin/galleries/new"
            className="min-touch flex items-center rounded-full bg-ink px-4 text-xs font-medium text-white transition hover:opacity-90"
          >
            + New Gallery
          </Link>
          <button onClick={logout} className="min-touch text-sm text-ink/50 hover:text-ink">
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
