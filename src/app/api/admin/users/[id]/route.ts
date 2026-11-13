import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser, hashPassword } from "@/lib/user-auth";

const VALID_STATUS = ["pending", "active", "blocked"];
const VALID_ROLES = ["admin", "editor", "member"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
    }
    data.role = body.role;
  }

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.note !== undefined) data.note = body.note || null;
  if (body.memberId !== undefined) data.memberId = body.memberId || null;

  if (body.password) {
    if (String(body.password).length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }
    data.passwordHash = hashPassword(String(body.password));
  }

  // Không để quản trị tự hạ quyền/khóa chính mình (tránh mất lối vào)
  const current = await getCurrentUser();
  if (current?.id === id && (data.role === "member" || data.status === "blocked")) {
    return NextResponse.json(
      { error: "Không thể tự hạ quyền hoặc khóa tài khoản của chính mình" },
      { status: 400 }
    );
  }

  // Luôn giữ ít nhất một quản trị đang hoạt động
  if (
    target.role === "admin" &&
    (data.role === "member" || data.role === "editor" || data.status === "blocked")
  ) {
    const activeAdmins = await prisma.user.count({
      where: { role: "admin", status: "active", id: { not: id } },
    });
    if (activeAdmins === 0) {
      return NextResponse.json(
        { error: "Phải còn ít nhất một quản trị đang hoạt động" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({ where: { id }, data });
  const { passwordHash: _hash, ...safe } = updated;
  return NextResponse.json({ data: safe });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const current = await getCurrentUser();

  if (current?.id === id) {
    return NextResponse.json(
      { error: "Không thể xóa tài khoản của chính mình" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
  }

  if (target.role === "admin") {
    const activeAdmins = await prisma.user.count({
      where: { role: "admin", status: "active", id: { not: id } },
    });
    if (activeAdmins === 0) {
      return NextResponse.json(
        { error: "Phải còn ít nhất một quản trị đang hoạt động" },
        { status: 400 }
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
