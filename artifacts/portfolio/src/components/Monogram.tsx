export default function Monogram({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="10" fill="var(--surface)" stroke="var(--line-strong)" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="30"
        letterSpacing="-1.5"
        fill="var(--accent)"
      >
        SR
      </text>
    </svg>
  );
}
