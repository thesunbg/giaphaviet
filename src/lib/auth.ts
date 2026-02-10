import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "admin_session";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Generate session token using HMAC-SHA256.
 * Deterministic: all valid sessions share the same token.
 * Invalidate all sessions by changing AUTH_SECRET.
 */
export function generateSessionToken(): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update("admin-session")
    .digest("hex");
}

/**
 * Verify a token using timing-safe comparison.
 */
export function verifySessionToken(token: string): boolean {
  try {
    const expected = generateSessionToken();
    const tokenBuffer = Buffer.from(token, "utf-8");
    const expectedBuffer = Buffer.from(expected, "utf-8");
    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Check if the current request is authenticated.
 * For use in server components and API routes.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) {
    return false;
  }
  return verifySessionToken(sessionCookie.value);
}

/**
 * Guard for API mutation handlers.
 * Returns 401 Response if not authenticated, null if OK.
 */
export async function requireAuth(): Promise<Response | null> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response(
      JSON.stringify({ error: "Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
