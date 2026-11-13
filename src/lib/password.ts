import crypto from "crypto";

/* Băm mật khẩu bằng scrypt (có sẵn trong Node, không cần thư viện ngoài) */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return ["scrypt", salt, derived].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** "0912 345 678", "+84912345678" -> "0912345678" */
export function normalizePhone(input: string): string {
  const digits = (input || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) return "0" + digits.slice(3);
  if (digits.startsWith("84") && digits.length >= 11) return "0" + digits.slice(2);
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^0\d{9,10}$/.test(phone);
}
