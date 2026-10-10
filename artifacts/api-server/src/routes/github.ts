import { Router, type IRouter } from "express";
import { getContributionCalendar, getMergedPrs, isCalendarConfigured } from "../lib/github";

const router: IRouter = Router();

router.get("/github/prs", async (req, res) => {
  try {
    const result = await getMergedPrs();
    res.setHeader("Cache-Control", "public, max-age=600, stale-while-revalidate=3600");
    res.json({ prs: result.prs, total: result.prs.length, fetchedAt: result.fetchedAt, stale: result.stale });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch merged PRs");
    res.status(502).json({ error: "github_unavailable" });
  }
});

router.get("/github/contributions", async (req, res) => {
  if (!isCalendarConfigured()) {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json({ configured: false, total: 0, weeks: [], fetchedAt: new Date().toISOString() });
    return;
  }
  try {
    const result = await getContributionCalendar();
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
    res.json({ configured: true, ...result });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch contribution calendar");
    res.status(502).json({ error: "github_unavailable" });
  }
});

export default router;
