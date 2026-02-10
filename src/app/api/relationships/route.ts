import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parentChildSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

async function updateDescendantGenerations(memberId: string, generation: number) {
  const childLinks = await prisma.parentChild.findMany({
    where: { parentId: memberId },
  });
  for (const link of childLinks) {
    await prisma.member.update({
      where: { id: link.childId },
      data: { generation: generation + 1 },
    });
    await updateDescendantGenerations(link.childId, generation + 1);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const parsed = parentChildSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { parentId, childId, relationshipType } = parsed.data;

  if (parentId === childId) {
    return NextResponse.json(
      { error: "Cha/mẹ và con không thể là cùng một người" },
      { status: 400 }
    );
  }

  const parent = await prisma.member.findUnique({ where: { id: parentId } });
  if (!parent) {
    return NextResponse.json({ error: "Không tìm thấy cha/mẹ" }, { status: 404 });
  }

  const relationship = await prisma.parentChild.create({
    data: { parentId, childId, relationshipType },
  });

  // Auto-update child generation
  const childGeneration = parent.generation + 1;
  await prisma.member.update({
    where: { id: childId },
    data: { generation: childGeneration },
  });
  await updateDescendantGenerations(childId, childGeneration);

  return NextResponse.json({ data: relationship }, { status: 201 });
}
