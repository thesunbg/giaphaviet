import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const existing = await prisma.viewAccessCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy mã xem" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.label !== undefined) data.label = body.label ? String(body.label).trim() : null;

  const updated = await prisma.viewAccessCode.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.viewAccessCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy mã xem" }, { status: 404 });
  }

  await prisma.viewAccessCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
