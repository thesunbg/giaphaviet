import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const marriage = await prisma.marriage.update({
    where: { id },
    data: {
      marriageDate: body.marriageDate,
      divorceDate: body.divorceDate,
      isActive: body.isActive,
      orderIndex: body.orderIndex,
    },
  });

  return NextResponse.json({ data: marriage });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  await prisma.marriage.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
