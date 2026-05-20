import { Router, Request, Response } from "express";
import {
  getLeaderboard,
  getUserRank,
  refreshLeaderboard
} from "../services/leaderboardService";

const leaderboardRoutes = Router();

/**
 * GET /leaderboard
 * Get leaderboard rankings for a specific metric
 * Query params:
 *   - metric: 'kg' | 'co2' | 'kwh' | 'donations' (default: 'kg')
 *   - limit: number (default: 50, max: 50)
 */
leaderboardRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const metric = (req.query.metric as string) || "kg";
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 50);

    // Validate metric
    if (!["kg", "co2", "kwh", "donations"].includes(metric)) {
      return res.status(400).json({ error: "Invalid metric" });
    }

    const leaderboard = await getLeaderboard(metric, limit);
    res.json({ metric, leaderboard });
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

/**
 * GET /leaderboard/top-three
 * Get top 3 rankings for a specific metric (for home screen)
 * Query params:
 *   - metric: 'kg' | 'co2' | 'kwh' | 'donations' (default: 'kg')
 */
leaderboardRoutes.get("/top-three", async (req: Request, res: Response) => {
  try {
    const metric = (req.query.metric as string) || "kg";

    if (!["kg", "co2", "kwh", "donations"].includes(metric)) {
      return res.status(400).json({ error: "Invalid metric" });
    }

    const leaderboard = await getLeaderboard(metric, 3);
    res.json({ metric, leaderboard });
  } catch (error: any) {
    console.error("Error fetching top 3 leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

/**
 * GET /leaderboard/user/:userId
 * Get a specific user's rank
 * Query params:
 *   - metric: 'kg' | 'co2' | 'kwh' | 'donations' (default: 'kg')
 */
leaderboardRoutes.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) 
      ? req.params.userId[0] 
      : req.params.userId;
    const metric = (req.query.metric as string) || "kg";

    if (!["kg", "co2", "kwh", "donations"].includes(metric)) {
      return res.status(400).json({ error: "Invalid metric" });
    }

    const rankInfo = await getUserRank(userId, metric);

    if (!rankInfo) {
      return res.status(404).json({ error: "User not ranked this month" });
    }

    res.json(rankInfo);
  } catch (error: any) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({ error: "Failed to fetch user rank" });
  }
});

/**
 * POST /leaderboard/refresh
 * Manually trigger leaderboard refresh (admin only)
 * This endpoint should typically be called by a scheduled job
 */
leaderboardRoutes.post("/refresh", async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authorization check
    // if (!isAdmin(req)) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

    await refreshLeaderboard();
    res.json({ message: "Leaderboard refreshed successfully" });
  } catch (error: any) {
    console.error("Error refreshing leaderboard:", error);
    res.status(500).json({ error: "Failed to refresh leaderboard" });
  }
});

export default leaderboardRoutes;
