import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isEditor } from "@/lib/user-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: {
      contributions: {
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
        include: {
          member: { select: { id: true, fullName: true, generation: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!fund) {
    return NextResponse.json({ error: "Không tìm thấy đợt đóng góp" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...fund,
      total: fund.contributions.reduce((sum, c) => sum + c.amount, 0),
    },
    canEdit: await isEditor(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (!(await isEditor())) {
    return NextResponse.json({ error: "Bạn không có quyền sửa." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Tên không được để trống" }, { status: 400 });
    data.name = name;
  }
  if (body.description !== undefined) data.description = body.description || null;
  if (body.year !== undefined) data.year = body.year ? Number(body.year) : null;
  if (body.targetAmount !== undefined) {
    data.targetAmount = body.targetAmount ? Math.round(Number(body.targetAmount)) : null;
  }
  if (body.isOpen !== undefined) data.isOpen = Boolean(body.isOpen);

  const fund = await prisma.fund.update({ where: { id }, data });
  return NextResponse.json({ data: fund });
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
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: { _count: { select: { contributions: true } } },
  });

  if (!fund) {
    return NextResponse.json({ error: "Không tìm thấy đợt đóng góp" }, { status: 404 });
  }

  // Xóa đợt là xóa luôn sổ đóng góp của đợt đó
  await prisma.fund.delete({ where: { id } });

  return NextResponse.json({ success: true, deletedEntries: fund._count.contributions });
}
