import Image from 'next/image';

// Studio logo mark. Drop your real transparent-PNG logo files into /public
// as logo-black.png (ink) and logo-white.png (reversed) — same file names
// this component already points at, so no code changes are needed.
export default function Logo({
  variant = 'black',
  size = 40,
  className = '',
}: {
  variant?: 'black' | 'white';
  size?: number;
  className?: string;
}) {
  const src = variant === 'white' ? '/logo-white.png' : '/logo-black.png';
  return (
    <Image
      src={src}
      alt="Sixth Lens"
      width={size}
      height={size}
      className={className}
      priority
      unoptimized
    />
  );
}
