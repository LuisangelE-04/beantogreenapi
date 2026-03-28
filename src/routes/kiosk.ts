import { Router, Request, Response } from "express";
import { query } from "../db/pool";
import { v4 as uuidv4 } from "uuid";

const kioskRoutes = Router();

kioskRoutes.post("/verify-login", async (req: Request, res: Response) => {

});

// Helper function to calculate environmental impact from weight in grams
function calculateImpact(weightGrams: number) {
  // Example calculations (adjust these constants based on your impact model)
  // These are placeholder values - update with your actual impact metrics
  const impactKwh = (weightGrams / 1000) * 0.05; // 0.05 kWh per kg
  const impactCo2Kg = (weightGrams / 1000) * 0.12; // 0.12 kg CO2 per kg
  
  return {
    impact_kwh: parseFloat(impactKwh.toFixed(4)),
    impact_co2_kg: parseFloat(impactCo2Kg.toFixed(4))
  };
}

kioskRoutes.post("/donation", async (req: Request, res: Response) => {
  try {
    const { device_id, location_id, weight_grams, event_id: providedEventId } = req.body;
    const userId = (req as any).userId || null;

    if (!device_id || !location_id || weight_grams === undefined || weight_grams === null) {
      return res.status(400).json({
        error: "Missing required fields: device_id, location_id, weight_grams"
      });
    }

    if (typeof weight_grams !== "number" || weight_grams <= 0) {
      return res.status(400).json({
        error: "weight_grams must be a positive number"
      });
    }

    const { impact_kwh, impact_co2_kg } = calculateImpact(weight_grams);

    const eventId = providedEventId || uuidv4();

    const result = await query(
      `
      INSERT INTO donations (user_id, device_id, location_id, weight_grams, impact_kwh, impact_co2_kg, event_id, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, user_id, device_id, location_id, weight_grams, impact_kwh, impact_co2_kg, event_id, timestamp, created_at
      `,
      [userId, device_id, location_id, weight_grams, impact_kwh, impact_co2_kg, eventId]
    );

    const donation = result.rows[0];

    res.status(201).json({
      id: donation.id,
      user_id: donation.user_id,
      device_id: donation.device_id,
      location_id: donation.location_id,
      weight_grams: donation.weight_grams,
      impact: {
        kwh: donation.impact_kwh,
        co2_kg: donation.impact_co2_kg
      },
      event_id: donation.event_id,
      timestamp: donation.timestamp,
      created_at: donation.created_at
    });
  } catch (error: any) {
    console.error("Error recording donation:", error);
    
    if (error.code === "23503") {
      return res.status(400).json({
        error: "Invalid device_id, location_id, or user_id. Please verify these IDs exist."
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        error: "This event_id has already been recorded"
      });
    }

    res.status(500).json({ error: "Failed to record donation" });
  }
});
