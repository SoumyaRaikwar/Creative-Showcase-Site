import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { serviceGraph, type GraphNode } from "@/lib/graph";
import { heroTrace, formatMs, serviceColorVar } from "@/lib/trace";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/hooks/useTheme";
import { Section, SectionHead } from "../Section";

const GraphCanvas = lazy(() => import("./GraphCanvas"));

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Jaeger's other view of the same chat turn: the service DAG. Nodes are the
 * services from the hero trace, pulses are the calls between them. Static
 * list for reduced motion / no WebGL. The loop only runs while on screen.
 */
export default function ServiceGraph() {
  const reduced = useReducedMotion();
  const [theme] = useTheme();
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState<GraphNode | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting && !reduced && webglAvailable()) setEnabled(true);
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const onLayout = useCallback((positions: { id: string; x: number; y: number; z: number }[]) => {
    for (const p of positions) {
      const el = labelRefs.current.get(p.id);
      if (!el) continue;
      el.style.transform = `translate(-50%, 0) translate(${p.x}px, ${p.y + 14}px)`;
      el.style.opacity = p.z > 1 ? "0" : String(0.55 + 0.45 * (1 - Math.min(1, Math.max(0, (p.z - 0.9) / 0.1))));
    }
  }, []);

  const onPick = useCallback((n: GraphNode) => {
    const target = n.project ? document.getElementById(`n-${n.project}`) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.location.assign("/work");
  }, []);

  const show3d = enabled && !failed;
  const current = hover;

  return (
    <Section id="service-map" className="border-t border-line">
      <SectionHead
        eyebrow="Service map"
        title="The same turn, as a graph."
        lede="Jaeger draws a trace two ways: a timeline and a dependency graph. This is the graph of the chat turn on the laptop screen above. Pulses are calls; drag to turn it; click a service to jump to the work behind it."
        aside={<Link href="/work" className="btn">All work</Link>}
      />
      <div className="reveal grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div ref={stageRef} className="panel relative aspect-[4/3] overflow-hidden md:aspect-[16/11]" style={{ touchAction: "pan-y" }}>
          {show3d && (
            <Suspense fallback={null}>
              <GraphCanvas
                theme={theme}
                active={visible}
                onReady={() => setReady(true)}
                onFail={() => setFailed(true)}
                onHover={setHover}
                onPick={onPick}
                onLayout={onLayout}
              />
            </Suspense>
          )}
          {show3d && ready && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {serviceGraph.nodes.map((n) => (
                <div
                  key={n.id}
                  ref={(el) => {
                    if (el) labelRefs.current.set(n.id, el);
                    else labelRefs.current.delete(n.id);
                  }}
                  className="absolute left-0 top-0 whitespace-nowrap rounded-[2px] px-1.5 py-0.5 font-mono text-[11px] text-text will-change-transform"
                  style={{ background: "color-mix(in srgb, var(--ground) 80%, transparent)" }}
                >
                  {n.id}
                </div>
              ))}
            </div>
          )}
          {!(show3d && ready) && (
            <ul className="absolute inset-0 grid content-center gap-2 p-5 font-mono text-[12px]" aria-label="Services in the trace">
              {serviceGraph.edges.map((e) => (
                <li key={`${e.from}${e.to}`} className="flex items-center gap-2 text-muted">
                  <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: serviceColorVar(e.from) }} />
                  <span className="text-text">{e.from}</span>
                  <span>→</span>
                  <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: serviceColorVar(e.to) }} />
                  <span className="text-text">{e.to}</span>
                  <span className="tnum">· {e.calls} call{e.calls === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="pointer-events-none absolute left-3 top-3 font-mono text-[11px] text-faint">
            {show3d && ready ? "drag · click a node" : reduced ? "motion reduced · static list" : "loading…"}
          </p>
        </div>

        <div className="panel self-start p-5" aria-live="polite">
          <p className="eyebrow mb-3">{current ? "service" : "trace"}</p>
          {current ? (
            <>
              <p className="flex items-center gap-2 font-mono text-[15px]">
                <span className="inline-block h-3 w-3 rounded-[1px]" style={{ background: serviceColorVar(current.id) }} />
                {current.id}
              </p>
              <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-1 font-mono text-[12.5px]">
                <dt className="text-muted">spans</dt>
                <dd className="tnum">{current.spans}</dd>
                <dt className="text-muted">time in spans</dt>
                <dd className="tnum">{formatMs(current.totalMs)}</dd>
                <dt className="text-muted">calls out</dt>
                <dd className="tnum">{serviceGraph.edges.filter((e) => e.from === current.id).reduce((s, e) => s + e.calls, 0)}</dd>
                <dt className="text-muted">calls in</dt>
                <dd className="tnum">{serviceGraph.edges.filter((e) => e.to === current.id).reduce((s, e) => s + e.calls, 0)}</dd>
              </dl>
              <p className="mt-4 text-[13.5px] text-muted">{current.project ? "Click to open the related work." : "Storage. Click to see all pull requests."}</p>
            </>
          ) : (
            <>
              <p className="font-mono text-[13px]">{heroTrace.id}</p>
              <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-1 font-mono text-[12.5px]">
                <dt className="text-muted">services</dt>
                <dd className="tnum">{serviceGraph.nodes.length}</dd>
                <dt className="text-muted">calls</dt>
                <dd className="tnum">{serviceGraph.edges.reduce((s, e) => s + e.calls, 0)}</dd>
                <dt className="text-muted">spans</dt>
                <dd className="tnum">{heroTrace.spans.length}</dd>
                <dt className="text-muted">duration</dt>
                <dd className="tnum">{formatMs(heroTrace.total)}</dd>
              </dl>
              <ul className="mt-4 grid gap-1.5">
                {serviceGraph.nodes.map((n) => (
                  <li key={n.id} className="flex items-center gap-2 font-mono text-[12px] text-muted">
                    <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: serviceColorVar(n.id) }} />
                    <span className="text-text">{n.id}</span>
                    <span className="tnum">· {n.spans} spans</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
