import raw from "@/content/profile.json";
import snapshot from "@/content/prs-snapshot.json";

export interface PrRef {
  repo: string;
  number: number;
}

export interface NarrativeItem {
  id: string;
  title: string;
  prs: PrRef[];
  issue?: PrRef;
  summary: string;
  detail: string[];
  span: string;
}

export interface SnapshotPr {
  repo: string;
  number: number;
  title: string;
  url: string;
  state: "merged" | "open";
  createdAt: string;
  mergedAt: string | null;
  durationHours: number;
}

export const profile = raw;
export const narrative = raw.narrative as NarrativeItem[];
export const prSnapshot = snapshot as { fetchedAt: string; prs: SnapshotPr[] };

export function prUrl(ref: PrRef): string {
  return `https://github.com/${ref.repo}/pull/${ref.number}`;
}

export function issueUrl(ref: PrRef): string {
  return `https://github.com/${ref.repo}/issues/${ref.number}`;
}

export function shortRepo(repo: string): string {
  return repo.split("/")[1] ?? repo;
}

export const CNCF_REPOS = new Set([
  "jaegertracing/jaeger",
  "jaegertracing/jaeger-ui",
  "open-telemetry/opentelemetry-collector",
  "open-telemetry/opentelemetry-collector-contrib",
  "goharbor/harbor",
]);

export const JAEGER_OTEL_REPOS = new Set([
  "jaegertracing/jaeger",
  "jaegertracing/jaeger-ui",
  "open-telemetry/opentelemetry-collector",
  "open-telemetry/opentelemetry-collector-contrib",
]);
