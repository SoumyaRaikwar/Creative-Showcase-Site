import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import TracePoster from "./TracePoster";
import { heroTrace, formatMs, serviceColorVar, type Span } from "@/lib/trace";
import { profile } from "@/lib/profile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";

const LaptopCanvas = lazy(() => import("./LaptopCanvas"));

export interface ProgressStore {
  value: number;
  listeners: Set<() => void>;
  set(v: number): void;
  subscribe(fn: () => void): () => void;
}

function createStore(): ProgressStore {
  const store: ProgressStore = {
    value: 0,
    listeners: new Set(),
    set(v) {
      if (v === store.value) return;
      store.value = v;
      store.listeners.forEach((fn) => fn());
    },
    subscribe(fn) {
      store.listeners.add(fn);
      return () => store.listeners.delete(fn);
    },
  };
  return store;
}

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

export default function Hero() {
  const reduced = useReducedMotion();
  const [theme] = useTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const store = useMemo(createStore, []);
  const [phase, setPhase] = useState<"closed" | "opening" | "open" | "screen">("closed");
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [hover, setHover] = useState<{ span: Span; x: number; y: number } | null>(null);
  const [progressUi, setProgressUi] = useState(0);

  const id = profile.identity;

  // Decide whether to load WebGL at all. HTML and the SVG poster are already on
  // screen, so the canvas waits for the first sign of intent (scroll, pointer,
  // key) or a few seconds after load, whichever comes first.
  useEffect(() => {
    if (reduced || !webglAvailable() || saveData()) return;
    const events = ["scroll", "pointerdown", "pointermove", "touchstart", "keydown", "wheel"] as const;
    let timer = 0;
    const start = () => {
      events.forEach((ev) => window.removeEventListener(ev, start));
      window.removeEventListener("load", armTimer);
      window.clearTimeout(timer);
      setCanvasEnabled(true);
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

  // Scroll → progress (0..1 across the tall section). One rAF, passive listener.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      const p = travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel));
      store.set(p);
      const next = p < 0.06 ? "closed" : p < 0.55 ? "opening" : p < 0.8 ? "open" : "screen";
      setPhase((cur) => (cur === next ? cur : next));
      setProgressUi((cur) => (Math.abs(cur - p) > 0.02 ? p : cur));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, store]);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pause the render loop entirely when the hero is off screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onPick = useCallback((span: Span) => {
    const target = span.project ? document.getElementById(`n-${span.project}`) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.location.assign("/work");
  }, []);

  const onHover = useCallback((span: Span | null, x: number, y: number) => {
    setHover(span ? { span, x, y } : null);
  }, []);

  const showCanvas = canvasEnabled && !canvasFailed;
  const textGone = progressUi > 0.3;
  const sectionHeight = reduced ? "auto" : narrow ? "240svh" : "300svh";

  return (
    <section
      ref={sectionRef}
      aria-label="Introduction"
      className="relative"
      style={{ height: sectionHeight, minHeight: "100svh" }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Poster: paints first, stays if WebGL never arrives */}
        <div
          className="absolute inset-0 flex items-center justify-end px-[var(--gutter)] transition-opacity duration-700 md:items-end md:pb-[16svh]"
          style={{ opacity: showCanvas && canvasReady ? 0 : 1, pointerEvents: showCanvas && canvasReady ? "none" : "auto" }}
          aria-hidden={showCanvas && canvasReady}
        >
          <div className="w-full opacity-90 max-md:mt-[42svh] md:w-[50%]">
            <TracePoster className="h-auto w-full" />
          </div>
        </div>

        {showCanvas && (
          <div className="absolute inset-0" style={{ opacity: canvasReady ? 1 : 0, transition: "opacity .7s" }}>
            <Suspense fallback={null}>
              <LaptopCanvas
                store={store}
                theme={theme}
                narrow={narrow}
                active={visible}
                onReady={() => setCanvasReady(true)}
                onFail={() => setCanvasFailed(true)}
                onPick={onPick}
                onHover={onHover}
              />
            </Suspense>
          </div>
        )}

        {/* HTML content: rendered before WebGL, always usable */}
        <div className="wrap pointer-events-none relative z-10 flex h-full flex-col justify-between pb-6 pt-24 md:pt-28">
          <div
            className="max-w-[640px] transition-all duration-500"
            style={{ opacity: textGone ? 0 : 1, transform: textGone ? "translateY(-12px)" : "none" }}
          >
            <p className="eyebrow mb-5">LFX Mentee · CNCF / Jaeger</p>
            <h1 className="text-[2.6rem] leading-[1.02] md:text-[4.2rem] lg:text-[4.8rem]">{id.hero}</h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-muted md:text-[18px]">{id.heroSub}</p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Focus areas">
              {id.roleTags.map((t) => (
                <li key={t} className="tag">{t}</li>
              ))}
            </ul>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Link href="/work" className="btn btn-primary">See the work</Link>
              <a href="#contact" className="btn">Contact</a>
            </div>
          </div>

          {/* HUD: which span the camera is on */}
          <div className="flex items-end justify-between gap-4 font-mono text-[11.5px] leading-snug text-muted">
            <div aria-live="off" className="rounded-[3px] px-2 py-1.5" style={{ background: "color-mix(in srgb, var(--ground) 78%, transparent)" }}>
              <p className="text-faint">
                trace {heroTrace.id} · {heroTrace.spans.length} spans · {heroTrace.services.length} services · {formatMs(heroTrace.total)}
              </p>
              {!reduced && (
                <p className="mt-1 flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: "var(--accent)" }} />
                  {phase === "closed" && <span>scroll to open the laptop</span>}
                  {phase === "opening" && <span>opening · {Math.round(Math.min(1, Math.max(0, (progressUi - 0.06) / 0.49)) * 106)}°</span>}
                  {phase === "open" && <span>on screen: one Jaeger AI chat turn, as a trace</span>}
                  {phase === "screen" && (
                    <span>
                      <span className="text-text">{heroTrace.critical.length} spans</span> on the critical path · hover a row, click to open its work
                    </span>
                  )}
                </p>
              )}
              {reduced && <p className="mt-1">motion reduced · spans link to the work they stand for</p>}
            </div>
            {!reduced && (
              <p className="hidden shrink-0 sm:block" style={{ opacity: progressUi > 0.08 ? 0 : 1, transition: "opacity .3s" }}>
                scroll ↓
              </p>
            )}
          </div>
        </div>

        {hover && (
          <div
            role="tooltip"
            className="panel pointer-events-none absolute z-20 px-2.5 py-1.5 font-mono text-[11.5px]"
            style={{ left: Math.min(hover.x + 14, window.innerWidth - 240), top: hover.y + 14 }}
          >
            <p className="text-text">{hover.span.service}</p>
            <p className="text-muted">
              {hover.span.op} · <span className="tnum">{formatMs(hover.span.duration)}</span>
            </p>
            <p className="text-faint">{hover.span.project ? "click → related work" : "click → all work"}</p>
          </div>
        )}
      </div>
    </section>
  );
}
