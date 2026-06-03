import { Router, Request, Response } from "express";
import { query } from "../db/pool";

const userRoutes = Router();

userRoutes.get("/profile", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID requried" });
    }

    const result = await query(
      `
      SELECT id, name, email, is_anonymous, phone_number
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const response = {
      name: user.name,
      email: user.email,
      visibility: {
        isAnonymous: user.is_anonymous
      },
      phone: user.phone_number
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

userRoutes.patch("/profile", async (req, res) => {
  try {
    const userId = (req as any).userId;

    if(!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { name, email, isAnonymous, phone} = req.body;
    const allowedUpdates: { field: string; column: string; value: any }[] = [];

    if (name !== undefined) {
      allowedUpdates.push({ field: "name", column: "name", value: name });
    }
    if (email !== undefined) {
      allowedUpdates.push({ field: "email", column: "email",value: email });
    }
    if (isAnonymous !== undefined) {
      allowedUpdates.push({ field: "is_anonymous", column: "is_anonymous", value: isAnonymous});
    }
    if (phone !== undefined) {
      allowedUpdates.push({ field: "phone_number", column: "phone_number", value: phone });
    }

    if (allowedUpdates.length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        allowedFields: ["name", "email", "phone", "isAnonymous"]
      });
    }

    const setClause = allowedUpdates.map((udpate, index) => `${udpate.column} = $${index + 1}`).join(", ");
    const values = allowedUpdates.map(update => update.value);
    values.push(userId);

    const updateQuery = `
    UPDATE users
    SET ${setClause}
    WHERE id = $${allowedUpdates.length + 1}
    RETURNING id, name, email, is_anonymous, phone_number
    `;

    const reuslt = await query(updateQuery, values);

    if (reuslt.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = reuslt.rows[0];

    res.json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        isAnonymous: updatedUser.is_anonymous,
        phone: updatedUser.phone_number
      }
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

userRoutes.get("/stats/monthly", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    // Debug mode: return raw donations for this user to inspect timestamps
    const debug = (req.query.debug as string) === '1' || (req.query.debug as string) === 'true';

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    const result = await query(
      `
      SELECT 
        DATE_TRUNC('month', COALESCE("timestamp", created_at)) as month,
        ROUND(SUM(weight_grams) / 1000.0, 4) as total_kg_contributed,
        ROUND(SUM(impact_kwh)::numeric, 4) as total_kwh_impact,
        ROUND(SUM(impact_co2_kg)::numeric, 4) as total_co2_kg_impact,
        COUNT(*) as donation_count
      FROM donations
      WHERE user_id = $1
        AND EXTRACT(MONTH FROM COALESCE("timestamp", created_at)) = $2
        AND EXTRACT(YEAR FROM COALESCE("timestamp", created_at)) = $3
      GROUP BY DATE_TRUNC('month', COALESCE("timestamp", created_at))
      `,
      [userId, currentMonth, currentYear]
    );

    let monthlyStats = result.rows.map(row => ({
      month: row.month,
      kgContributed: parseFloat(row.total_kg_contributed),
      kwhImpact: parseFloat(row.total_kwh_impact),
      co2kgImpact: parseFloat(row.total_co2_kg_impact),
      donationCount: parseInt(row.donation_count)
    }));

    // If no results for current month, return zero entry
    if (monthlyStats.length === 0) {
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      monthlyStats = [{
        month: startOfMonth.toISOString(),
        kgContributed: 0,
        kwhImpact: 0,
        co2kgImpact: 0,
        donationCount: 0
      }];
    }

    if (debug) {
      const donationsRaw = await query(
        `
        SELECT id, weight_grams, impact_kwh, impact_co2_kg, "timestamp", created_at
        FROM donations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 200
        `,
        [userId]
      );

      return res.json({
        userId: userId,
        monthlyStats: monthlyStats,
        donationsRaw: donationsRaw.rows
      });
    }

    res.json({
      userId: userId,
      monthlyStats: monthlyStats
    });
  } catch (error: any) {
    console.error("Error fetching monthly stats:", error);
    res.status(500).json({ error: "Failed to fetch monthly stats" });
  }
});

userRoutes.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const result = await query(
      `
      SELECT all_time_kg, all_time_kwh, all_time_co2_kg, donation_count, updated_at
      FROM user_stats
      WHERE user_id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User stats not found" });
    }

    const stats = result.rows[0];

    res.json({
      userId: userId,
      allTimeStats: {
        kgContributed: parseFloat(stats.all_time_kg),
        kwhImpact: parseFloat(stats.all_time_kwh),
        co2kgImpact: parseFloat(stats.all_time_co2_kg),
        totalDonations: parseInt(stats.donation_count)
      },
      updatedAt: stats.updated_at
    });
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
})

export default userRoutes;