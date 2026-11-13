import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  USER_COOKIE,
  USER_SESSION_DAYS,
  signSession,
  sessionCookieOptions,
} from "@/lib/session";
import { hashPassword, isValidPhone, normalizePhone } from "@/lib/user-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const phone = normalizePhone(String(body.phone || ""));
  const password = String(body.password || "");
  const code = String(body.inviteCode || "").trim().toUpperCase();

  if (!name || !phone || !password || !code) {
    return NextResponse.json(
      { error: "Vui lòng điền họ tên, số điện thoại, mật khẩu và mã mời" },
      { status: 400 }
    );
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Số điện thoại không hợp lệ (ví dụ: 0912345678)" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu phải có ít nhất 6 ký tự" },
      { status: 400 }
    );
  }

  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite) {
    return NextResponse.json({ error: "Mã mời không đúng" }, { status: 400 });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Mã mời đã hết hạn" }, { status: 400 });
  }
  if (invite.usedCount >= invite.maxUses) {
    return NextResponse.json({ error: "Mã mời đã dùng hết lượt" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "Số điện thoại này đã được đăng ký" },
      { status: 409 }
    );
  }

  const status = invite.autoApprove ? "active" : "pending";

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      passwordHash: hashPassword(password),
      role: "member",
      status,
      inviteCodeId: invite.id,
    },
  });

  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: { usedCount: { increment: 1 } },
  });

  if (status !== "active") {
    return NextResponse.json({
      success: true,
      status,
      message:
        "Đăng ký thành công! Tài khoản đang chờ quản trị duyệt, bạn sẽ đăng nhập được sau khi được duyệt.",
    });
  }

  const token = await signSession(
    { sub: user.id, kind: "user", role: "member", name: user.name },
    USER_SESSION_DAYS
  );

  const response = NextResponse.json({
    success: true,
    status,
    message: "Đăng ký thành công!",
  });
  response.cookies.set(USER_COOKIE, token, sessionCookieOptions(USER_SESSION_DAYS));
  return response;
}
