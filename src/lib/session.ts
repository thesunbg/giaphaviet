/**
 * Phiên đăng nhập: token tự chứa, ký bằng HMAC-SHA256 qua Web Crypto
 * nên dùng được cả ở Node runtime (API routes) và Edge runtime (middleware).
 *
 * Định dạng: base64url(payload JSON) + "." + base64url(chữ ký)
 */

export const USER_COOKIE = "gp_session";
export const VIEW_COOKIE = "gp_view";
/** Cookie cũ dùng mật khẩu ADMIN_PASSWORD, giữ lại làm lối vào dự phòng */
export const LEGACY_ADMIN_COOKIE = "admin_session";

export const USER_SESSION_DAYS = 30;
export const VIEW_SESSION_DAYS = 365;

export type SessionKind = "user" | "viewer";

export interface SessionPayload {
  /** id tài khoản (kind = "user") hoặc id mã xem (kind = "viewer") */
  sub: string;
  kind: SessionKind;
  role: "admin" | "editor" | "member" | "viewer";
  name?: string;
  /** hạn dùng, epoch milliseconds */
  exp: number;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(signature);
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return secret;
}

export async function signSession(
  payload: Omit<SessionPayload, "exp">,
  days: number
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + days * 24 * 60 * 60 * 1000,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(full)));
  const signature = toBase64Url(await hmac(getSecret(), body));
  return `${body}.${signature}`;
}

/** Trả về payload nếu chữ ký hợp lệ và chưa hết hạn, ngược lại null */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const expected = toBase64Url(await hmac(getSecret(), body));
    if (expected.length !== signature.length) return null;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (!payload?.sub || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(days: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: days * 24 * 60 * 60,
  };
}
