import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGalleryForCover } from '@/lib/galleryQueries';
import { hasGalleryAccess } from '@/lib/galleryAccess';
import Logo from '@/components/Logo';
import PinForm from '@/components/gallery/PinForm';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function GalleryCoverPage({ params }: { params: { slug: string } }) {
  const gallery = await getGalleryForCover(params.slug);
  if (!gallery) notFound();

  if (gallery.expired) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ink px-6 text-center text-white">
        <div>
          <Logo variant="white" size={48} className="mx-auto mb-6" />
          <h1 className="font-serif text-2xl">This gallery link has expired</h1>
          <p className="mt-2 text-white/70">Please contact your photographer for a new link.</p>
        </div>
      </main>
    );
  }

  const authorized = await hasGalleryAccess({ slug: gallery.slug, pin_hash: gallery.pinHash });
  const viewHref = `/g/${gallery.slug}/view`;
  const date = new Date(gallery.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="relative flex dvh-screen min-h-[560px] w-full items-center justify-center overflow-hidden bg-ink">
      {gallery.cover && (
        <Image
          src={gallery.cover.web}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      <div className="relative z-10 flex w-full flex-col items-center px-6 text-center safe-x safe-top safe-bottom">
        <Logo variant="white" size={56} className="mb-6" />
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">{gallery.studioName}</p>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,5vw,3.5rem)] text-white">
          {gallery.title}
        </h1>
        <p className="mt-2 text-sm text-white/60">{date}</p>

        <div className="mt-10">
          {gallery.requiresPin && !authorized ? (
            <PinForm slug={gallery.slug} nextHref={viewHref} />
          ) : (
            <Link
              href={viewHref}
              className="min-touch inline-flex items-center rounded-full border border-white/50 px-8 py-3 text-sm tracking-wide text-white transition hover:bg-white hover:text-ink"
            >
              View Gallery
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
