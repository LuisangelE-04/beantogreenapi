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
        allowedFields: ["name", "phone", "isAnonymous"]
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

userRoutes.get("/stats", async (req: Request, res: Response) => {
  
})

export default userRoutes;