import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const invite = await prisma.inviteCode.findUnique({ where: { id } });
  if (!invite) {
    return NextResponse.json({ error: "Không tìm thấy mã mời" }, { status: 404 });
  }

  await prisma.inviteCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
