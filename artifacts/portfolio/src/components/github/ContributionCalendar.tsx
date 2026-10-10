import { useGetContributionCalendar, getGetContributionCalendarQueryKey } from "@workspace/api-client-react";

const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1];

export default function ContributionCalendar() {
  const q = useGetContributionCalendar({ query: { queryKey: getGetContributionCalendarQueryKey(), retry: 0, staleTime: 60 * 60 * 1000 } });

  if (q.isLoading) return <p className="font-mono text-[12px] text-faint">loading contributions…</p>;
  if (q.isError || !q.data || !q.data.configured) {
    return (
      <p className="font-mono text-[12px] text-faint">
        Contribution calendar is off: the API has no GITHUB_TOKEN. See{" "}
        <a className="underline" href="https://github.com/SoumyaRaikwar" target="_blank" rel="noreferrer">
          github.com/SoumyaRaikwar
        </a>
        .
      </p>
    );
  }

  const { weeks, total } = q.data;
  return (
    <figure>
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: "repeat(7, 10px)" }} role="img" aria-label={`${total} contributions in the last year`}>
          {weeks.flat().map((d) => (
            <span
              key={d.date}
              title={`${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}`}
              className="h-[10px] w-[10px] rounded-[1px]"
              style={{
                background: d.level === 0 ? "var(--surface-2)" : "var(--accent)",
                opacity: d.level === 0 ? 1 : LEVEL_OPACITY[d.level],
              }}
            />
          ))}
        </div>
      </div>
      <figcaption className="mt-2 font-mono text-[12px] text-muted">
        <span className="text-text tnum">{total}</span> contributions in the last year · from GitHub, cached hourly
      </figcaption>
    </figure>
  );
}
