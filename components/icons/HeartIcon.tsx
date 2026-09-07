export default function HeartIcon({
  filled,
  size = 18,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M12 21s-7.6-4.7-10.2-9.3C.3 8.6 1.7 4.9 5.3 4.1c2.2-.5 4.4.4 5.7 2.2l1 1.4 1-1.4c1.3-1.8 3.5-2.7 5.7-2.2 3.6.8 5 4.5 3.5 7.6C19.6 16.3 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
