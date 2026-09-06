'use client';

import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#portfolio', label: 'Portfolio' },
  { href: '#gallery-access', label: 'Client Access' },
  { href: '#contact', label: 'Contact' },
];

export default function StickyNav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 safe-top transition-colors duration-300 ${
        solid ? 'glass border-b border-line' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 safe-x sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <Logo variant={solid ? 'black' : 'white'} size={32} />
          <span
            className={`font-serif text-lg tracking-wide transition-colors ${
              solid ? 'text-ink' : 'text-white'
            }`}
          >
            Sixth Lens
          </span>
        </a>

        <nav className="hidden gap-8 sm:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm tracking-wide transition-colors ${
                solid ? 'text-ink/80 hover:text-ink' : 'text-white/85 hover:text-white'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={`min-touch flex items-center justify-center sm:hidden ${
            solid ? 'text-ink' : 'text-white'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="glass flex flex-col gap-1 border-t border-line px-4 pb-4 sm:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="min-touch flex items-center text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
