import { useMemo, useState } from "react";
import PrRows from "@/components/github/PrRows";
import ContributionCalendar from "@/components/github/ContributionCalendar";
import { usePrs } from "@/components/github/usePrs";
import { Section, SectionHead } from "@/components/Section";
import { formatDate } from "@/lib/format";
import { useReveal } from "@/hooks/useReveal";
import { useSeo, ROUTE_SEO } from "@/lib/seo";

const FILTERS: { key: string; label: string; test: (repo: string) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "jaeger", label: "Jaeger", test: (r) => r.startsWith("jaegertracing/") },
  { key: "otel", label: "OpenTelemetry", test: (r) => r.startsWith("open-telemetry/") },
  { key: "other", label: "Other", test: (r) => !r.startsWith("jaegertracing/") && !r.startsWith("open-telemetry/") },
];

export default function Work() {
  useSeo(ROUTE_SEO["/work"]);
  const prs = usePrs();
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState<"merged" | "open">("merged");
  useReveal([prs.live]);

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    return prs.prs.filter((p) => p.state === state && f.test(p.repo));
  }, [prs.prs, filter, state]);

  return (
    <div className="pt-16">
      <Section>
        <SectionHead
          eyebrow="Work"
          title="Pull requests, drawn as spans."
          lede={
            <>
              Each bar is how long a PR stayed open before it merged, on a shared log axis. {prs.mergedTotal} merged and {prs.openTotal} open across{" "}
              {prs.repos.length} repositories.{" "}
              {prs.live ? "Live from GitHub, cached for an hour." : `Snapshot from ${formatDate(prs.fetchedAt)}; the live API is unreachable right now.`}
            </>
          }
        />
        <div className="reveal mb-6 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Repository filter">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="btn h-8 px-3 text-[13px]"
                style={filter === f.key ? { borderColor: "var(--accent)", color: "var(--text)" } : undefined}
                aria-pressed={filter === f.key}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="mx-2 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          <div className="flex gap-1.5" role="group" aria-label="State">
            {(["merged", "open"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setState(s)}
                className="btn h-8 px-3 text-[13px] capitalize"
                style={state === s ? { borderColor: "var(--accent)", color: "var(--text)" } : undefined}
                aria-pressed={state === s}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="ml-auto font-mono text-[12px] text-muted tnum">{rows.length} shown</span>
        </div>
        <div className="reveal">
          <PrRows prs={rows} />
        </div>
      </Section>
      <Section className="border-t border-line">
        <SectionHead eyebrow="Activity" title="Last twelve months." />
        <div className="reveal">
          <ContributionCalendar />
        </div>
      </Section>
    </div>
  );
}
