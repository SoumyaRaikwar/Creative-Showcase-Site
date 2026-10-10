import { logger } from "./logger";

/**
 * Read-only GitHub data with an in-memory cache. Public data only.
 * A GITHUB_TOKEN raises the rate limit and unlocks the contribution calendar
 * (GraphQL requires auth). Never exposed to the browser.
 */

const GITHUB_USER = process.env.GITHUB_USER ?? "SoumyaRaikwar";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Every PR the owner authored in repositories they do not own: merged and open.
const PR_QUERIES: string[] = [
  `is:pr is:merged author:${GITHUB_USER} -user:${GITHUB_USER}`,
  `is:pr is:open author:${GITHUB_USER} -user:${GITHUB_USER}`,
];

export interface MergedPr {
  repo: string;
  number: number;
  title: string;
  url: string;
  state: "merged" | "open";
  createdAt: string;
  mergedAt: string | null;
  durationHours: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
}

const PR_TTL_MS = 60 * 60 * 1000;
const CALENDAR_TTL_MS = 6 * 60 * 60 * 1000;

let prCache: CacheEntry<MergedPr[]> | null = null;
let calendarCache: CacheEntry<{ total: number; weeks: ContributionDay[][] }> | null = null;
let prInflight: Promise<MergedPr[]> | null = null;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "soumyaraikwar.co.in",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

interface SearchItem {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  closed_at: string | null;
  repository_url: string;
  pull_request?: { merged_at: string | null };
}

async function searchMergedPrs(q: string): Promise<MergedPr[]> {
  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("sort", "created");
  url.searchParams.set("order", "desc");
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`GitHub search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { items: SearchItem[] };
  return json.items.map((it) => {
    const repo = it.repository_url.replace("https://api.github.com/repos/", "");
    const mergedAt = it.pull_request?.merged_at ?? null;
    const end = mergedAt ? new Date(mergedAt).getTime() : Date.now();
    const hours = (end - new Date(it.created_at).getTime()) / 36e5;
    return {
      repo,
      number: it.number,
      title: it.title.trim(),
      url: it.html_url,
      state: mergedAt ? "merged" : "open",
      createdAt: it.created_at,
      mergedAt,
      durationHours: Math.max(0, Math.round(hours * 10) / 10),
    };
  });
}

export async function getMergedPrs(): Promise<{ prs: MergedPr[]; fetchedAt: string; stale: boolean }> {
  const now = Date.now();
  if (prCache && now - prCache.fetchedAt < PR_TTL_MS) {
    return { prs: prCache.value, fetchedAt: new Date(prCache.fetchedAt).toISOString(), stale: false };
  }
  try {
    if (!prInflight) {
      prInflight = Promise.all(PR_QUERIES.map(searchMergedPrs)).then((lists) => {
        const seen = new Set<string>();
        const merged = lists.flat().filter((pr) => {
          const key = `${pr.repo}#${pr.number}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        merged.sort((a, b) => (b.mergedAt ?? b.createdAt).localeCompare(a.mergedAt ?? a.createdAt));
        return merged;
      });
    }
    const prs = await prInflight;
    prCache = { value: prs, fetchedAt: Date.now() };
    return { prs, fetchedAt: new Date(prCache.fetchedAt).toISOString(), stale: false };
  } catch (err) {
    logger.warn({ err }, "GitHub PR fetch failed");
    if (prCache) {
      return { prs: prCache.value, fetchedAt: new Date(prCache.fetchedAt).toISOString(), stale: true };
    }
    throw err;
  } finally {
    prInflight = null;
  }
}

const LEVELS: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export function isCalendarConfigured(): boolean {
  return Boolean(GITHUB_TOKEN);
}

export async function getContributionCalendar(): Promise<{
  total: number;
  weeks: ContributionDay[][];
  fetchedAt: string;
}> {
  const now = Date.now();
  if (calendarCache && now - calendarCache.fetchedAt < CALENDAR_TTL_MS) {
    return { ...calendarCache.value, fetchedAt: new Date(calendarCache.fetchedAt).toISOString() };
  }
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: GITHUB_USER } }),
    });
    if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
    const json = (await res.json()) as {
      data?: {
        user?: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
              weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
            };
          };
        };
      };
      errors?: unknown;
    };
    const cal = json.data?.user?.contributionsCollection.contributionCalendar;
    if (!cal) throw new Error(`GitHub GraphQL returned no calendar: ${JSON.stringify(json.errors ?? {}).slice(0, 200)}`);
    const value = {
      total: cal.totalContributions,
      weeks: cal.weeks.map((w) =>
        w.contributionDays.map((d) => ({
          date: d.date,
          count: d.contributionCount,
          level: LEVELS[d.contributionLevel] ?? 0,
        })),
      ),
    };
    calendarCache = { value, fetchedAt: Date.now() };
    return { ...value, fetchedAt: new Date(calendarCache.fetchedAt).toISOString() };
  } catch (err) {
    logger.warn({ err }, "GitHub calendar fetch failed");
    if (calendarCache) {
      return { ...calendarCache.value, fetchedAt: new Date(calendarCache.fetchedAt).toISOString() };
    }
    throw err;
  }
}
