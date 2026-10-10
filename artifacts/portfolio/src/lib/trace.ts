import raw from "@/content/traces/hero.json";

export interface RawSpan {
  id: string;
  parent: string | null;
  service: string;
  op: string;
  start: number;
  duration: number;
  project: string | null;
  critical?: boolean;
}

export interface Span extends RawSpan {
  depth: number;
  row: number;
  lane: number;
  index: number;
  children: Span[];
}

export interface Trace {
  id: string;
  spans: Span[];
  services: string[];
  total: number;
  maxDepth: number;
  critical: Span[];
}

/** Same hash Jaeger UI uses to pick a service colour: identity, not decoration. */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const SPAN_PALETTE_SIZE = 8;

export function serviceColorIndex(service: string): number {
  return hashString(service) % SPAN_PALETTE_SIZE;
}

export function serviceColorVar(service: string): string {
  return `var(--span-${serviceColorIndex(service)})`;
}

export const SPAN_PALETTE = {
  dark: ["#dd9a5b", "#78b4c6", "#a8b39a", "#c9a36a", "#8fa3bd", "#b9927a", "#86b6a5", "#cfae8a"],
  light: ["#b5712c", "#2f7c8f", "#6f8560", "#9c7a3a", "#5d6f8d", "#8d6650", "#3f8a76", "#a2804f"],
};

export function buildTrace(): Trace {
  const rawSpans = raw.spans as RawSpan[];
  const byId = new Map<string, Span>();
  const spans: Span[] = rawSpans.map((s, index) => ({ ...s, depth: 0, row: 0, lane: 0, index, children: [] }));
  spans.forEach((s) => byId.set(s.id, s));

  const roots: Span[] = [];
  for (const s of spans) {
    if (s.parent && byId.has(s.parent)) byId.get(s.parent)!.children.push(s);
    else roots.push(s);
  }

  const services: string[] = [];
  let row = 0;
  let maxDepth = 0;
  const visit = (s: Span, depth: number) => {
    s.depth = depth;
    s.row = row++;
    if (!services.includes(s.service)) services.push(s.service);
    s.lane = services.indexOf(s.service);
    maxDepth = Math.max(maxDepth, depth);
    s.children.sort((a, b) => a.start - b.start).forEach((c) => visit(c, depth + 1));
  };
  roots.sort((a, b) => a.start - b.start).forEach((r) => visit(r, 0));

  const total = Math.max(...spans.map((s) => s.start + s.duration));
  const critical = spans.filter((s) => s.critical).sort((a, b) => a.start - b.start || b.duration - a.duration);

  return { id: raw.traceId, spans, services, total, maxDepth, critical };
}

export const heroTrace: Trace = buildTrace();

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}
