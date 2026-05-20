import { query } from "../db/pool";

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  userId: string;
  metricValue: number;
  metricType: string;
}

export interface UserRankInfo {
  rank: number;
  displayName: string;
  metricValue: number;
  percentile: number;
}

/**
 * Get a random anonymous name from the database
 */
async function getRandomAnonymousName(): Promise<string> {
  try {
    const result = await query(
      `SELECT name FROM anonymous_user_names ORDER BY RANDOM() LIMIT 1`
    );
    return result.rows[0]?.name || "Eco Warrior";
  } catch (error) {
    console.error("Error fetching random anonymous name:", error);
    return "Eco Warrior";
  }
}

/**
 * Assign or get assigned name for an anonymous user
 */
async function getOrAssignAnonymousName(userId: string): Promise<string> {
  try {
    // Check if already assigned
    const existing = await query(
      `SELECT assigned_name FROM anonymous_user_assignments WHERE user_id = $1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].assigned_name;
    }

    // Get a random name and assign it
    const randomName = await getRandomAnonymousName();
    await query(
      `INSERT INTO anonymous_user_assignments (user_id, assigned_name) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET assigned_name = $2`,
      [userId, randomName]
    );

    return randomName;
  } catch (error) {
    console.error("Error getting anonymous name:", error);
    return "Eco Warrior";
  }
}

/**
 * Refresh leaderboard for current month
 * This should be called hourly via a scheduled job
 */
export async function refreshLeaderboard(): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  try {
    // Delete old entries for this month
    await query(
      `DELETE FROM leaderboard_entries WHERE month = $1 AND year = $2`,
      [month, year]
    );

    const metrics: Array<"kg" | "co2" | "kwh" | "donations"> = [
      "kg",
      "co2",
      "kwh",
      "donations"
    ];

    for (const metric of metrics) {
      // Map metric names to database columns
      const metricColumns: Record<string, string> = {
        kg: "COALESCE(SUM(d.weight_grams) / 1000.0, 0)",
        co2: "COALESCE(SUM(d.impact_co2_kg), 0)",
        kwh: "COALESCE(SUM(d.impact_kwh), 0)",
        donations: "COUNT(d.id)"
      };

      const metricColumn = metricColumns[metric];

      // Get all users with their monthly metric value
      const result = await query(
        `
        SELECT 
          u.id as user_id,
          u.name,
          u.is_anonymous,
          ${metricColumn} as metric_value
        FROM users u
        INNER JOIN donations d ON u.id = d.user_id 
          AND EXTRACT(MONTH FROM d.timestamp) = $1 
          AND EXTRACT(YEAR FROM d.timestamp) = $2
        GROUP BY u.id, u.name, u.is_anonymous
        ORDER BY metric_value DESC
        `,
        [month, year]
      );

      // Insert rankings
      let rank = 1;
      for (const row of result.rows) {
        let displayName = row.name;

        // If user is anonymous, get their assigned name
        if (row.is_anonymous) {
          displayName = await getOrAssignAnonymousName(row.user_id);
        }

        await query(
          `
          INSERT INTO leaderboard_entries 
            (user_id, metric_type, metric_value, rank, month, year, display_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id, metric_type, year, month) 
          DO UPDATE SET 
            metric_value = $3,
            rank = $4,
            display_name = $7,
            updated_at = NOW()
          `,
          [row.user_id, metric, row.metric_value, rank, month, year, displayName]
        );

        rank++;
      }
    }

    console.log(`✅ Leaderboard refreshed for ${month}/${year}`);
  } catch (error) {
    console.error("Error refreshing leaderboard:", error);
    throw error;
  }
}

/**
 * Get leaderboard rankings for a specific metric
 * @param metric - 'kg' | 'co2' | 'kwh' | 'donations'
 * @param limit - Number of entries to return (default: 50)
 */
export async function getLeaderboard(
  metric: string = "kg",
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    console.log(`[DEBUG] Fetching leaderboard: metric=${metric}, month=${month}, year=${year}, limit=${limit}`);
    
    // Check what data exists in leaderboard_entries
    const allEntriesDebug = await query(
      `SELECT DISTINCT metric_type, month, year, COUNT(*) as count FROM leaderboard_entries GROUP BY metric_type, month, year`
    );
    console.log(`[DEBUG] All leaderboard_entries in DB:`, allEntriesDebug.rows);
    
    const result = await query(
      `
      SELECT 
        rank,
        display_name as "displayName",
        user_id as "userId",
        metric_value as "metricValue",
        metric_type as "metricType"
      FROM leaderboard_entries
      WHERE metric_type = $1 AND month = $2 AND year = $3
      ORDER BY rank ASC
      LIMIT $4
      `,
      [metric, month, year, limit]
    );

    console.log(`[DEBUG] Query returned ${result.rows.length} rows`);
    return result.rows;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Get a user's rank for a specific metric
 */
export async function getUserRank(
  userId: string,
  metric: string = "kg"
): Promise<UserRankInfo | null> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    // Get user's rank
    const rankResult = await query(
      `
      SELECT rank, display_name, metric_value
      FROM leaderboard_entries
      WHERE user_id = $1 AND metric_type = $2 AND month = $3 AND year = $4
      `,
      [userId, metric, month, year]
    );

    if (rankResult.rows.length === 0) {
      return null;
    }

    const userEntry = rankResult.rows[0];

    // Get total count for percentile calculation
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM leaderboard_entries
      WHERE metric_type = $1 AND month = $2 AND year = $3
      `,
      [metric, month, year]
    );

    const totalUsers = countResult.rows[0].total;
    const percentile = ((totalUsers - userEntry.rank + 1) / totalUsers) * 100;

    return {
      rank: userEntry.rank,
      displayName: userEntry.display_name,
      metricValue: userEntry.metric_value,
      percentile: Math.round(percentile)
    };
  } catch (error) {
    console.error("Error fetching user rank:", error);
    return null;
  }
}
