import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VIEW_COOKIE,
  VIEW_SESSION_DAYS,
  signSession,
  sessionCookieOptions,
} from "@/lib/session";

/**
 * Đăng nhập bằng "mã xem gia phả" dành cho các cụ / người không lập tài khoản.
 * Chỉ cần nhập một lần trên thiết bị, phiên giữ 1 năm, quyền chỉ xem.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "")
    .trim()
    .replace(/\s/g, "")
    .toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Vui lòng nhập mã xem gia phả" }, { status: 400 });
  }

  const accessCode = await prisma.viewAccessCode.findUnique({ where: { code } });

  if (!accessCode || !accessCode.isActive) {
    return NextResponse.json(
      { error: "Mã không đúng hoặc đã ngừng sử dụng" },
      { status: 401 }
    );
  }

  await prisma.viewAccessCode.update({
    where: { id: accessCode.id },
    data: { lastUsedAt: new Date() },
  });

  const token = await signSession(
    { sub: accessCode.id, kind: "viewer", role: "viewer" },
    VIEW_SESSION_DAYS
  );

  const response = NextResponse.json({ success: true });
  response.cookies.set(VIEW_COOKIE, token, sessionCookieOptions(VIEW_SESSION_DAYS));
  return response;
}
