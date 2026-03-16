import { Router, Request, Response} from "express";
import { getPool } from "../db/pool";


const authRoutes = Router();

const USER_ROLE_ID = '98968a98-eab7-4784-b20e-fbee825c2679';

authRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const passwordHash = password;

    const pool = getPool();

    const result = await pool.query(
      `
      INSERT INTO users (username, name, email, password_hash, role_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING name, email, phone_number
      `,
      [username, name, email, passwordHash, USER_ROLE_ID]
    );

    res.status(201).json({message: "Successfully registered account"});
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      return res.status(409).json({ error: "Email alrady exists" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

authRoutes.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Query DB for user
  // Use bcrypt.compare() to verify password
  // Call generateToken() to create JWT
  // Return { token: "jwt...", userId: "..." }
});

export default authRoutes;
