import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      parentChildAsChild: {
        include: { parent: true },
      },
      parentChildAsParent: {
        include: { child: true },
      },
      marriagesAsSpouse1: {
        include: { spouse2: true },
        orderBy: { orderIndex: "asc" },
      },
      marriagesAsSpouse2: {
        include: { spouse1: true },
        orderBy: { orderIndex: "asc" },
      },
      events: { orderBy: { date: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Không tìm thấy thành viên" }, { status: 404 });
  }

  const parents = member.parentChildAsChild.map((pc) => ({
    member: pc.parent,
    relationshipType: pc.relationshipType,
  }));

  const children = member.parentChildAsParent.map((pc) => ({
    member: pc.child,
    relationshipType: pc.relationshipType,
  }));

  const spouses = [
    ...member.marriagesAsSpouse1.map((m) => ({
      member: m.spouse2,
      marriageDate: m.marriageDate,
      orderIndex: m.orderIndex,
      marriageId: m.id,
    })),
    ...member.marriagesAsSpouse2.map((m) => ({
      member: m.spouse1,
      marriageDate: m.marriageDate,
      orderIndex: m.orderIndex,
      marriageId: m.id,
    })),
  ].sort((a, b) => a.orderIndex - b.orderIndex);

  const { parentChildAsChild, parentChildAsParent, marriagesAsSpouse1, marriagesAsSpouse2, ...memberData } = member;

  return NextResponse.json({
    data: {
      ...memberData,
      parents,
      children,
      spouses,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const parsed = memberSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const member = await prisma.member.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ data: member });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  await prisma.member.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
