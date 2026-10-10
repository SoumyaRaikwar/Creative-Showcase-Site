import { Link } from "wouter";
import TracePoster from "./TracePoster";
import { heroTrace, formatMs } from "@/lib/trace";
import { profile } from "@/lib/profile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWorldState } from "@/lib/worldStore";

/**
 * Hero stage: HTML first. The 3D laptop behind it belongs to the page-wide
 * World; this component only owns the text, the HUD and the SVG poster that
 * stays for reduced-motion / no-WebGL visitors.
 */
export default function Hero() {
  const reduced = useReducedMotion();
  const p = useWorldState((s) => s.heroProgress);
  const worldReady = useWorldState((s) => s.ready);
  const id = profile.identity;
  const phase = p < 0.06 ? "closed" : p < 0.55 ? "opening" : p < 0.8 ? "open" : "screen";
  const textGone = !reduced && p > 0.3;
  const sectionHeight = reduced ? "auto" : "300svh";

  return (
    <section id="hero" aria-label="Introduction" className="relative" style={{ height: sectionHeight, minHeight: "100svh" }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Poster: paints first, stays if WebGL never arrives */}
        <div
          className="absolute inset-0 flex items-center justify-end px-[var(--gutter)] transition-opacity duration-700 md:items-end md:pb-[16svh]"
          style={{ opacity: worldReady ? 0 : 1, pointerEvents: worldReady ? "none" : "auto" }}
          aria-hidden={worldReady}
        >
          <div className="w-full opacity-90 max-md:mt-[42svh] md:w-[50%]">
            <TracePoster className="h-auto w-full" />
          </div>
        </div>

        <div className="wrap world-section relative z-10 flex h-full flex-col justify-between pb-6 pt-24 md:pt-28">
          <div
            className="max-w-[640px] transition-all duration-500"
            style={{ opacity: textGone ? 0 : 1, transform: textGone ? "translateY(-12px)" : "none" }}
          >
            <p className="eyebrow mb-5">LFX Mentee · CNCF / Jaeger</p>
            <h1 className="text-[3rem] leading-[0.98] md:text-[4.6rem] lg:text-[5.4rem]">{id.name}</h1>
            <p className="mt-4 font-display text-[1.35rem] font-medium leading-tight text-text md:text-[1.75rem]">{id.hero}</p>
            <p className="mt-5 max-w-[520px] text-[16px] leading-relaxed text-muted md:text-[17px]">{id.heroSub}</p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Focus areas">
              {id.roleTags.map((t) => (
                <li key={t} className="tag">{t}</li>
              ))}
            </ul>
            <div className="interactive mt-8 flex flex-wrap gap-3">
              <Link href="/work" className="btn btn-primary">See the work</Link>
              <a href="#contact" className="btn">Contact</a>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 font-mono text-[11.5px] leading-snug text-muted">
            <div aria-live="off" className="rounded-[3px] px-2 py-1.5" style={{ background: "color-mix(in srgb, var(--ground) 78%, transparent)" }}>
              <p className="text-faint">
                trace {heroTrace.id} · {heroTrace.spans.length} spans · {heroTrace.services.length} services · {formatMs(heroTrace.total)}
              </p>
              {!reduced && (
                <p className="mt-1 flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: "var(--accent)" }} />
                  {phase === "closed" && <span>scroll to open the laptop</span>}
                  {phase === "opening" && <span>opening · {Math.round(Math.min(1, Math.max(0, (p - 0.06) / 0.49)) * 106)}°</span>}
                  {phase === "open" && <span>on screen: one Jaeger AI chat turn, as a trace</span>}
                  {phase === "screen" && (
                    <span>
                      <span className="text-text">{heroTrace.critical.length} spans</span> on the critical path · keep scrolling, the river starts here
                    </span>
                  )}
                </p>
              )}
              {reduced && <p className="mt-1">motion reduced · spans link to the work they stand for</p>}
            </div>
            {!reduced && (
              <p className="hidden shrink-0 sm:block" style={{ opacity: p > 0.08 ? 0 : 1, transition: "opacity .3s" }}>
                scroll ↓
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
