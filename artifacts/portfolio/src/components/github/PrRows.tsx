import type { MergedPr } from "@workspace/api-client-react";
import { serviceColorVar } from "@/lib/trace";
import { formatDate, formatHours } from "@/lib/format";
import { shortRepo } from "@/lib/profile";

/**
 * Pull requests drawn like spans in a trace: the bar is how long the PR was
 * open before it merged (log scale, shared axis). Open PRs are still "running".
 */
export default function PrRows({ prs, compact = false }: { prs: MergedPr[]; compact?: boolean }) {
  const maxHours = Math.max(1, ...prs.map((p) => p.durationHours));
  const width = (h: number) => `${Math.max(2, (Math.log1p(h) / Math.log1p(maxHours)) * 100)}%`;

  if (prs.length === 0) {
    return <p className="py-8 text-center text-muted">No pull requests match this filter.</p>;
  }

  return (
    <ol className="divide-y divide-line border-y border-line">
      {prs.map((p) => (
        <li key={`${p.repo}#${p.number}`}>
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="group grid gap-x-5 gap-y-1.5 py-3 md:grid-cols-[150px_minmax(0,1fr)_240px] md:items-center"
          >
            <span className="flex items-center gap-2 font-mono text-[12px] text-muted">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[1px]" style={{ background: serviceColorVar(p.repo) }} />
              <span className="truncate">{shortRepo(p.repo)}</span>
              <span className="text-faint">#{p.number}</span>
            </span>
            <span className={`min-w-0 ${compact ? "truncate" : ""} text-[15px] leading-snug text-text group-hover:text-accent`}>
              {p.title}
            </span>
            <span className="flex items-center gap-3">
              <span className="relative h-2.5 flex-1 overflow-hidden rounded-[1px] bg-surface-2" aria-hidden="true">
                <span
                  className="absolute inset-y-0 left-0 rounded-[1px]"
                  style={{
                    width: width(p.durationHours),
                    background: serviceColorVar(p.repo),
                    opacity: p.state === "merged" ? 0.9 : 0.45,
                    outline: p.state === "open" ? "1px dashed var(--muted)" : "none",
                  }}
                />
              </span>
              <span className="w-[112px] shrink-0 whitespace-nowrap text-right font-mono text-[11.5px] text-muted tnum">
                {p.state === "merged" ? (
                  <>
                    <span className="text-text">{formatHours(p.durationHours)}</span> · {formatDate(p.mergedAt ?? p.createdAt, { month: "short", year: "2-digit" })}
                  </>
                ) : (
                  <span className="text-warn">open · {formatHours(p.durationHours)}</span>
                )}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
