import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/user-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireEditor();
  if (authError) return authError;

  const { id } = await params;

  await prisma.parentChild.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
