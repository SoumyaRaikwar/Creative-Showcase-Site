import { heroTrace } from "./trace";

/** Service-to-service call graph derived from the hero trace (Jaeger's DAG view). */
export interface GraphNode {
  id: string;
  spans: number;
  totalMs: number;
  project: string | null;
}

export interface GraphEdge {
  from: string;
  to: string;
  calls: number;
  critical: boolean;
}

const PROJECT_FOR_SERVICE: Record<string, string | null> = {
  "jaeger-ui": "chat-ui",
  "ai-gateway": "acp-gateway",
  "agent-sidecar": "self-tracing",
  "jaeger-mcp": "read-skill",
  "skills-fs": "read-skill",
  "jaeger-query": "fixtures",
  clickhouse: null,
};

export function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const byId = new Map(heroTrace.spans.map((s) => [s.id, s]));
  for (const s of heroTrace.spans) {
    const n = nodes.get(s.service) ?? { id: s.service, spans: 0, totalMs: 0, project: PROJECT_FOR_SERVICE[s.service] ?? null };
    n.spans += 1;
    n.totalMs += s.duration;
    nodes.set(s.service, n);
    const parent = s.parent ? byId.get(s.parent) : undefined;
    if (parent && parent.service !== s.service) {
      const key = `${parent.service}→${s.service}`;
      const e = edges.get(key) ?? { from: parent.service, to: s.service, calls: 0, critical: false };
      e.calls += 1;
      if (s.critical && parent.critical) e.critical = true;
      edges.set(key, e);
    }
  }
  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}

export const serviceGraph = buildGraph();
