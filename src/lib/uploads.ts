import path from "path";
import { mkdir } from "fs/promises";

/**
 * Thư mục lưu ảnh tải lên.
 *
 * Mặc định là `public/uploads`, nhưng Next.js chỉ phục vụ file có trong `public`
 * từ lúc build, nên ảnh tải lên sau đó được phục vụ qua `/api/uploads/...`.
 * Trên máy chủ nên trỏ UPLOAD_DIR vào một ổ đĩa gắn ngoài (volume) để ảnh
 * không mất mỗi lần deploy lại.
 */
export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR;
  if (configured && configured.trim()) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "public", "uploads");
}

export async function ensureUploadDir(): Promise<string> {
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Chỉ nhận tên file an toàn, chặn đường dẫn kiểu ../../etc/passwd */
export function safeFileName(name: string): string | null {
  const base = path.basename(name);
  if (!base || base === "." || base === "..") return null;
  if (!/^[A-Za-z0-9._-]+$/.test(base)) return null;
  return base;
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function contentTypeOf(fileName: string): string {
  return CONTENT_TYPES[path.extname(fileName).toLowerCase()] || "application/octet-stream";
}

export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
