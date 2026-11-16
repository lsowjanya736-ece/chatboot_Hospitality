// src/lib/auth/middleware.ts
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Verify a JWT token using the secret from .env.local.
 * Returns the decoded payload (user id) or null if verification fails.
 */
export async function verifyJwt(token: string): Promise<AuthUser | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT secret not configured");
    return null;
  }
  try {
    const payload = jwt.verify(token, secret) as JwtPayload & { sub?: string };
    const userId = payload.sub ?? payload.id ?? payload.userId;
    if (!userId) return null;
    return { id: String(userId), email: payload.email };
  } catch (e) {
    console.error("JWT verification failed", e);
    return null;
  }
}
