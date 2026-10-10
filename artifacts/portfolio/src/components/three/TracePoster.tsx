import { heroTrace, serviceColorVar, formatMs } from "@/lib/trace";

const ROW = 15;
const LABEL_W = 176;
const PAD = 12;
const W = 760;

/**
 * 2D waterfall of the same trace the canvas renders. It paints before any
 * WebGL loads, stays for reduced-motion and no-WebGL visitors, and each span
 * links to the project it stands for. ~3 kB of markup instead of a bitmap.
 */
export default function TracePoster({
  className = "",
  style,
  interactive = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  const H = heroTrace.spans.length * ROW + PAD * 2 + 18;
  const timeW = W - LABEL_W - PAD * 2;
  const x = (ms: number) => LABEL_W + PAD + (ms / heroTrace.total) * timeW;
  const rows = [...heroTrace.spans].sort((a, b) => a.row - b.row);
  const ticks = [0, 400, 800, 1200, 1600];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={style}
      role="img"
      aria-label={`Trace ${heroTrace.id}: ${heroTrace.spans.length} spans across ${heroTrace.services.length} services, ${formatMs(heroTrace.total)} total`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--faint)">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={PAD} y2={H - PAD} stroke="var(--line)" strokeWidth="1" />
            <text x={x(t) + 3} y={PAD + 9}>{t} ms</text>
          </g>
        ))}
      </g>
      {rows.map((s) => {
        const y = PAD + 18 + s.row * ROW;
        const w = Math.max(2, ((s.duration / heroTrace.total) * timeW));
        const target = s.project ? `#n-${s.project}` : "/work";
        const bar = (
          <g key={s.id}>
            <text
              x={LABEL_W - 4 + PAD}
              y={y + 10}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="9"
              fill={s.critical ? "var(--text)" : "var(--muted)"}
              className="poster-label"
            >
              {s.service} · {s.op.length > 22 ? s.op.slice(0, 21) + "…" : s.op}
            </text>
            <rect
              x={x(s.start)}
              y={y + 2}
              width={w}
              height={ROW - 5}
              rx="1"
              fill={serviceColorVar(s.service)}
              opacity={s.critical ? 1 : 0.62}
              stroke={s.critical ? "var(--accent)" : "none"}
              strokeWidth={s.critical ? 1 : 0}
            />
            <title>{`${s.service} · ${s.op} · ${formatMs(s.duration)}`}</title>
          </g>
        );
        return interactive ? (
          <a key={s.id} href={target}>
            {bar}
          </a>
        ) : (
          bar
        );
      })}
      <style>{`@media (max-width: 640px) { .poster-label { display: none; } }`}</style>
    </svg>
  );
}
