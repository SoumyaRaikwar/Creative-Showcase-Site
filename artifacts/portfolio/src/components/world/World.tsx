import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { worldStore, WORLD_SECTIONS, SECTION_TITLES, useWorldState, type SectionRect } from "@/lib/worldStore";
import { formatMs } from "@/lib/trace";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";
import type { Pick } from "./WorldCanvas";

const WorldCanvas = lazy(() => import("./WorldCanvas"));

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
function saveData(): boolean {
  const n = navigator as Navigator & { connection?: { saveData?: boolean } };
  return Boolean(n.connection?.saveData);
}

/**
 * The fixed 3D world behind the home page. Measures the sections, feeds
 * scroll position to the store, loads WebGL after the first interaction,
 * and renders tooltips and graph labels on top of the canvas.
 */
export default function World() {
  const reduced = useReducedMotion();
  const [theme] = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [hover, setHover] = useState<{ pick: Pick; x: number; y: number } | null>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const section = useWorldState((s) => s.section);

  // Measure sections and track scroll
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const measure = () => {
      const sections: SectionRect[] = [];
      for (const id of WORLD_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        sections.push({ id, top: r.top + window.scrollY, height: r.height });
      }
      worldStore.set({ sections, viewportH: window.innerHeight, viewportW: window.innerWidth });
      setNarrow(window.innerWidth < 768);
      update();
    };
    const update = () => {
      raf = 0;
      const s = worldStore.get();
      const hero = s.sections.find((x) => x.id === "hero");
      let heroProgress = 0;
      if (hero) {
        const travel = Math.max(1, hero.height - window.innerHeight);
        heroProgress = Math.min(1, Math.max(0, (window.scrollY - hero.top) / travel));
      }
      worldStore.set({ scrollY: window.scrollY, heroProgress });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Load WebGL after the first sign of intent or a few seconds after load.
  useEffect(() => {
    if (reduced || !webglAvailable() || saveData()) return;
    const events = ["scroll", "pointerdown", "pointermove", "touchstart", "keydown", "wheel"] as const;
    let timer = 0;
    const start = () => {
      events.forEach((ev) => window.removeEventListener(ev, start));
      window.removeEventListener("load", armTimer);
      window.clearTimeout(timer);
      setEnabled(true);
    };
    const armTimer = () => {
      timer = window.setTimeout(start, 3500);
    };
    events.forEach((ev) => window.addEventListener(ev, start, { passive: true, once: true }));
    if (document.readyState === "complete") armTimer();
    else window.addEventListener("load", armTimer, { once: true });
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, start));
      window.removeEventListener("load", armTimer);
      window.clearTimeout(timer);
    };
  }, [reduced]);

  useEffect(() => {
    worldStore.set({ ready: ready && enabled && !failed });
  }, [ready, enabled, failed]);

  const onPick = useCallback((pick: Pick) => {
    if (pick.kind === "buoy") {
      document.getElementById(pick.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const target = pick.span.project ? document.getElementById(`n-${pick.span.project}`) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.location.assign("/work");
  }, []);

  const onHover = useCallback((pick: Pick | null, x: number, y: number) => {
    setHover(pick ? { pick, x, y } : null);
  }, []);

  const onLabels = useCallback((labels: { id: string; x: number; y: number; visible: boolean }[]) => {
    for (const l of labels) {
      const el = labelRefs.current.get(l.id);
      if (!el) continue;
      el.style.transform = `translate(-50%, -100%) translate(${l.x}px, ${l.y - 6}px)`;
      el.style.opacity = l.visible ? "1" : "0";
    }
  }, []);

  if (reduced) return null;
  const show = enabled && !failed;
  const stops = WORLD_SECTIONS.filter((id) => id !== "hero");

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true" style={{ opacity: show && ready ? (narrow ? 0.7 : 1) : 0, transition: "opacity .8s" }}>
      {show && (
        <Suspense fallback={null}>
          <WorldCanvas
            theme={theme}
            narrow={narrow}
            onReady={() => setReady(true)}
            onFail={() => setFailed(true)}
            onHover={onHover}
            onPick={onPick}
            onLabels={onLabels}
          />
        </Suspense>
      )}
      <div className="pointer-events-none absolute inset-0">
        {stops.map((id) => (
          <div
            key={id}
            ref={(el) => {
              if (el) labelRefs.current.set(id, el);
              else labelRefs.current.delete(id);
            }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-[2px] border px-1.5 py-0.5 font-mono text-[11px] will-change-transform"
            style={{
              background: "color-mix(in srgb, var(--ground) 82%, transparent)",
              borderColor: section === id ? "var(--accent)" : "var(--line)",
              color: section === id ? "var(--text)" : "var(--muted)",
              opacity: 0,
              transition: "border-color .3s, color .3s",
            }}
          >
            {SECTION_TITLES[id]}
          </div>
        ))}
      </div>
      {hover && (
        <div
          role="tooltip"
          className="panel pointer-events-none absolute z-20 px-2.5 py-1.5 font-mono text-[11.5px]"
          style={{ left: Math.min(hover.x + 14, window.innerWidth - 260), top: hover.y + 14 }}
        >
          {hover.pick.kind === "span" && (
            <>
              <p className="text-text">{hover.pick.span.service}</p>
              <p className="text-muted">
                {hover.pick.span.op} · <span className="tnum">{formatMs(hover.pick.span.duration)}</span>
              </p>
              <p className="text-faint">{hover.pick.span.project ? "click → related work" : "click → all work"}</p>
            </>
          )}
          {hover.pick.kind === "buoy" && (
            <>
              <p className="text-text">{hover.pick.title}</p>
              <p className="text-faint">click → go there</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
