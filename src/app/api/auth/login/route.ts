import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, COOKIE_NAME } from "@/lib/auth";
import {
  USER_COOKIE,
  USER_SESSION_DAYS,
  signSession,
  sessionCookieOptions,
} from "@/lib/session";
import { normalizePhone, verifyPassword } from "@/lib/user-auth";

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Tài khoản đang chờ quản trị duyệt. Vui lòng liên hệ trưởng họ.",
  blocked: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị.",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { phone, password } = body as { phone?: string; password?: string };

  if (!password) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu" }, { status: 400 });
  }

  /* ---- Đăng nhập bằng tài khoản (số điện thoại + mật khẩu) ---- */
  if (phone) {
    const normalized = normalizePhone(phone);
    const user = await prisma.user.findUnique({ where: { phone: normalized } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Số điện thoại hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: STATUS_MESSAGES[user.status] || "Tài khoản chưa được kích hoạt." },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    const token = await signSession(
      {
        sub: user.id,
        kind: "user",
        role: user.role as "admin" | "editor" | "member",
        name: user.name,
      },
      USER_SESSION_DAYS
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
    });
    response.cookies.set(USER_COOKIE, token, sessionCookieOptions(USER_SESSION_DAYS));
    return response;
  }

  /* ---- Lối vào dự phòng: chỉ mật khẩu ADMIN_PASSWORD (bản cũ) ---- */
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Vui lòng nhập số điện thoại và mật khẩu" },
      { status: 400 }
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Mật khẩu không đúng" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, legacyAdmin: true });
  response.cookies.set(COOKIE_NAME, generateSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
