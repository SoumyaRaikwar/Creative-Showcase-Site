export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", opts);
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  return `${(days / 30.4).toFixed(1)}mo`;
}
