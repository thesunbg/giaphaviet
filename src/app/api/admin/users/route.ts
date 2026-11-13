import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword, isValidPhone, normalizePhone } from "@/lib/user-auth";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const status = request.nextUrl.searchParams.get("status");

  const users = await prisma.user.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      member: { select: { id: true, fullName: true, generation: true } },
      inviteCode: { select: { code: true, note: true } },
    },
  });

  return NextResponse.json({ data: users.map(({ passwordHash: _hash, ...rest }) => rest) });
}

/** Quản trị tạo sẵn tài khoản cho người trong họ */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const phone = normalizePhone(String(body.phone || ""));
  const password = String(body.password || "");
  const role = ["admin", "editor", "member"].includes(body.role) ? body.role : "member";

  if (!name || !phone || !password) {
    return NextResponse.json(
      { error: "Vui lòng nhập họ tên, số điện thoại và mật khẩu" },
      { status: 400 }
    );
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Số điện thoại này đã có tài khoản" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      role,
      status: "active",
      passwordHash: hashPassword(password),
      memberId: body.memberId || null,
      note: body.note || null,
    },
  });

  const { passwordHash: _hash, ...safe } = user;
  return NextResponse.json({ data: safe }, { status: 201 });
}
