import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRATION = "1h";

export function generateToken(userId: string): string {
  try {
    const token = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );
    
    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Failed to generate token");
  }
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpirationError") {
      console.warn("Token expired:", error.message);
    } else if (error.name === "JsonWebTokenError") {
      console.warn("Invalid token:", error.message);
    }

    return null;
  }
}
