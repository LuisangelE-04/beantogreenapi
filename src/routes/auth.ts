import { Router, Request, Response} from "express";
import { getPool } from "../db/pool";
import { generateToken } from "../utils/jwt";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";


const authRoutes = Router();

const USER_ROLE_ID = '98968a98-eab7-4784-b20e-fbee825c2679';

function generateSalt(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

function hashPassword(password: string, salt: string): string {
  const combined = password + salt;
  const encoded = new TextEncoder().encode(combined);
  const hash = sha256(combined);
  return bytesToHex(hash)
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const combined = password + salt;
  const newHash = sha256(combined);
  return bytesToHex(newHash) === hash;
}

authRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const pool = getPool();

    const result = await pool.query(
      `
      INSERT INTO users (username, name, email, password_hash, role_id, password_salt)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone_number
      `,
      [username, name, email, passwordHash, USER_ROLE_ID, salt]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      message: "Successfully registered account",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
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
