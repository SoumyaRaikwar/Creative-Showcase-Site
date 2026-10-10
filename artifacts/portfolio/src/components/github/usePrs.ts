import { useListMergedPrs, getListMergedPrsQueryKey, type MergedPr } from "@workspace/api-client-react";
import { prSnapshot, CNCF_REPOS, JAEGER_OTEL_REPOS } from "@/lib/profile";

export interface PrsResult {
  prs: MergedPr[];
  live: boolean;
  loading: boolean;
  fetchedAt: string;
  mergedTotal: number;
  openTotal: number;
  mergedCncf: number;
  mergedJaegerOtel: number;
  repos: string[];
}

/** Live PRs from the API with the committed snapshot as the offline fallback. */
export function usePrs(): PrsResult {
  const q = useListMergedPrs({ query: { queryKey: getListMergedPrsQueryKey(), retry: 0, staleTime: 10 * 60 * 1000 } });
  const live = Boolean(q.data && q.data.prs.length > 0);
  const prs: MergedPr[] = live ? q.data!.prs : (prSnapshot.prs as MergedPr[]);
  const merged = prs.filter((p) => p.state === "merged");
  return {
    prs,
    live,
    loading: q.isLoading,
    fetchedAt: live ? q.data!.fetchedAt : prSnapshot.fetchedAt,
    mergedTotal: merged.length,
    openTotal: prs.length - merged.length,
    mergedCncf: merged.filter((p) => CNCF_REPOS.has(p.repo)).length,
    mergedJaegerOtel: merged.filter((p) => JAEGER_OTEL_REPOS.has(p.repo)).length,
    repos: Array.from(new Set(prs.map((p) => p.repo))),
  };
}
