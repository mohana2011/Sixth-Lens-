import Image from 'next/image';

// Studio logo. public/logo-{black,white}.png is just the icon mark;
// public/wordmark-{black,white}.png is the "SIXTH LENS" wordmark, both
// cropped from the studio's real logo artwork. Composed together here so
// every usage matches the source logo exactly instead of pairing the icon
// with our own coded text.
const WORDMARK_ASPECT = 1676 / 704;

export default function Logo({
  variant = 'black',
  size = 40,
  layout = 'row',
  showWordmark = true,
  className = '',
}: {
  variant?: 'black' | 'white';
  size?: number;
  layout?: 'row' | 'col';
  showWordmark?: boolean;
  className?: string;
}) {
  const iconSrc = variant === 'white' ? '/logo-white.png' : '/logo-black.png';
  const wordmarkSrc = variant === 'white' ? '/wordmark-white.png' : '/wordmark-black.png';

  const icon = (
    <Image src={iconSrc} alt={showWordmark ? '' : 'Sixth Lens'} width={size} height={size} priority unoptimized />
  );

  if (!showWordmark) {
    return <div className={className}>{icon}</div>;
  }

  const wordmarkWidth = layout === 'col' ? size * 0.9 : size * 1.35;
  const wordmarkHeight = wordmarkWidth / WORDMARK_ASPECT;

  return (
    <div
      className={`flex ${layout === 'col' ? 'flex-col items-center gap-[0.35em]' : 'flex-row items-center gap-3'} ${className}`}
    >
      {icon}
      <Image src={wordmarkSrc} alt="Sixth Lens" width={wordmarkWidth} height={wordmarkHeight} priority unoptimized />
    </div>
  );
}
