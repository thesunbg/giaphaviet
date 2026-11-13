import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  USER_COOKIE,
  VIEW_COOKIE,
  LEGACY_ADMIN_COOKIE,
  verifySession,
  type SessionPayload,
} from "@/lib/session";
import { verifySessionToken } from "@/lib/auth";
import {
  hashPassword,
  verifyPassword,
  normalizePhone,
  isValidPhone,
} from "@/lib/password";

// Giữ nguyên đường import cũ cho các API route
export { hashPassword, verifyPassword, normalizePhone, isValidPhone };

/* ===================== Phiên hiện tại ===================== */

export interface CurrentUser {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "editor" | "member";
  memberId: string | null;
  avatarUrl: string | null;
}

export type Viewer =
  | { kind: "user"; user: CurrentUser }
  | { kind: "viewer"; codeId: string }
  | { kind: "legacy-admin" }
  | null;

async function readSession(cookieName: string): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(cookieName)?.value);
}

/** Tài khoản đang đăng nhập (đã kiểm tra trạng thái trong DB), null nếu không có */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const payload = await readSession(USER_COOKIE);
  if (!payload || payload.kind !== "user") return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== "active") return null;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role as CurrentUser["role"],
    memberId: user.memberId,
    avatarUrl: user.avatarUrl,
  };
}

/** Ai đang xem trang: tài khoản, mã xem, admin bằng mật khẩu cũ, hoặc chưa đăng nhập */
export async function getViewer(): Promise<Viewer> {
  const user = await getCurrentUser();
  if (user) return { kind: "user", user };

  const store = await cookies();
  const legacy = store.get(LEGACY_ADMIN_COOKIE)?.value;
  if (legacy && verifySessionToken(legacy)) return { kind: "legacy-admin" };

  const viewPayload = await readSession(VIEW_COOKIE);
  if (viewPayload?.kind === "viewer") {
    const code = await prisma.viewAccessCode.findUnique({ where: { id: viewPayload.sub } });
    if (code?.isActive) return { kind: "viewer", codeId: code.id };
  }

  return null;
}

/** Quyền biên tập dữ liệu gia phả: quản trị hoặc biên tập viên */
export async function isEditor(): Promise<boolean> {
  const viewer = await getViewer();
  if (!viewer) return false;
  if (viewer.kind === "legacy-admin") return true;
  return viewer.kind === "user" && (viewer.user.role === "admin" || viewer.user.role === "editor");
}

export async function isAdmin(): Promise<boolean> {
  const viewer = await getViewer();
  if (!viewer) return false;
  if (viewer.kind === "legacy-admin") return true;
  return viewer.kind === "user" && viewer.user.role === "admin";
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Chặn API nếu chưa đăng nhập bằng tài khoản thật (mã xem không được phép) */
export async function requireUser(): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Vui lòng đăng nhập để tiếp tục.", 401);
  }
  return user;
}

/** Chặn API nếu không có quyền biên tập (quản trị hoặc biên tập viên) */
export async function requireEditor(): Promise<Response | null> {
  if (await isEditor()) return null;
  return jsonError("Bạn không có quyền chỉnh sửa dữ liệu gia phả.", 403);
}

/** Chặn API nếu không phải quản trị (chấp nhận cả lối vào dự phòng bằng ADMIN_PASSWORD) */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return jsonError("Bạn không có quyền thực hiện thao tác này.", 403);
}
