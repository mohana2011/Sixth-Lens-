import Image from 'next/image';
import Logo from '@/components/Logo';
import StickyNav from '@/components/marketing/StickyNav';
import GalleryAccessForm from '@/components/marketing/GalleryAccessForm';

const CATEGORIES = [
  { name: 'Weddings', desc: 'Full-day coverage, timeless and unobtrusive.' },
  { name: 'Engagements', desc: 'Relaxed sessions that feel like the two of you.' },
  { name: 'Portraits', desc: 'Studio and natural light, for individuals and families.' },
  { name: 'Events', desc: 'Documentary coverage for milestones worth remembering.' },
];

const TESTIMONIALS = [
  { quote: 'Our gallery felt like a gift, not a download link.', name: 'Maren & Tobias' },
  { quote: 'Every photo was there, organized, and easy to share with family.', name: 'Priya K.' },
  { quote: 'Simple, private, and beautifully presented.', name: 'James O.' },
];

export default function HomePage() {
  return (
    <main id="top" className="bg-paper">
      <StickyNav />

      {/* Hero */}
      <section className="relative flex dvh-screen min-h-[560px] items-center justify-center overflow-hidden bg-ink">
        <Image
          src="/images/hero-wedding.jpg"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-[35%_40%]"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative z-10 flex flex-col items-center px-6 text-center safe-x">
          <Logo variant="white" layout="col" size={160} className="mb-2" />
          <p className="mt-5 max-w-xl text-[clamp(0.95rem,2vw,1.25rem)] text-white/80">
            Photography that lingers. Weddings, portraits, and moments — delivered with care.
          </p>
          <a
            href="#gallery-access"
            className="min-touch mt-8 rounded-full border border-white/40 px-7 py-3 text-sm tracking-wide text-white transition hover:bg-white hover:text-ink"
          >
            Access Your Gallery
          </a>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-3xl px-6 py-24 text-center safe-x sm:py-32">
        <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
          Quiet, honest, unforgettable
        </h2>
        <p className="mt-5 text-[clamp(0.95rem,1.6vw,1.1rem)] leading-relaxed text-ink/70">
          Sixth Lens is a one-person studio focused on documentary-style photography. No
          gimmicks — just careful light, real moments, and a gallery experience as considered
          as the photographs themselves.
        </p>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="border-y border-line bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 safe-x">
          <h2 className="text-center font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
            Portfolio
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <div
                key={c.name}
                className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-ink/90"
              >
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-5">
                  <h3 className="font-serif text-xl text-white">{c.name}</h3>
                  <p className="mt-1 text-sm text-white/75">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client gallery access */}
      <section id="gallery-access" className="mx-auto max-w-3xl px-6 py-24 text-center safe-x sm:py-32">
        <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
          Client Gallery Access
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[clamp(0.9rem,1.6vw,1.05rem)] text-ink/70">
          Every client receives a private, unique link to their gallery — no account, no
          password to remember. Just the link (and a PIN, for select galleries).
        </p>
        <div className="mt-8 flex justify-center">
          <GalleryAccessForm />
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-line bg-white py-24 sm:py-32">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 safe-x sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="text-center">
              <blockquote className="font-serif text-lg italic text-ink/85">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm tracking-wide text-ink/50">
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-xl px-6 py-24 text-center safe-x sm:py-32">
        <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] text-ink">
          Let&rsquo;s work together
        </h2>
        <p className="mt-4 text-ink/70">hello@sixthlens.studio</p>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-3 border-t border-line bg-paper px-6 py-12 text-center safe-x safe-bottom">
        <Logo variant="black" layout="col" size={40} />
        <p className="text-xs tracking-wide text-ink/50">
          &copy; {new Date().getFullYear()} Sixth Lens Photography. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
