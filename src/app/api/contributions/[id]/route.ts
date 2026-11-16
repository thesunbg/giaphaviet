import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isEditor } from "@/lib/user-auth";

function parseAmount(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input) : null;
  const digits = String(input ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (!(await isEditor())) {
    return NextResponse.json({ error: "Bạn không có quyền sửa sổ." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.contribution.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy dòng đóng góp" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.contributorName !== undefined) {
    const name = String(body.contributorName).trim();
    if (!name) return NextResponse.json({ error: "Thiếu họ tên" }, { status: 400 });
    data.contributorName = name;
  }
  if (body.amount !== undefined) {
    const amount = parseAmount(body.amount);
    if (amount === null || amount <= 0) {
      return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
    }
    data.amount = amount;
  }
  if (body.memberId !== undefined) data.memberId = body.memberId || null;
  if (body.paidAt !== undefined) data.paidAt = body.paidAt || null;
  if (body.method !== undefined) data.method = body.method || null;
  if (body.note !== undefined) data.note = body.note || null;

  const updated = await prisma.contribution.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (!(await isEditor())) {
    return NextResponse.json({ error: "Bạn không có quyền xóa." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.contribution.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy dòng đóng góp" }, { status: 404 });
  }

  await prisma.contribution.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
