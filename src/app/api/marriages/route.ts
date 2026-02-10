import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marriageSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const parsed = marriageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { spouse1Id, spouse2Id, marriageDate, orderIndex } = parsed.data;

  if (spouse1Id === spouse2Id) {
    return NextResponse.json(
      { error: "Hai người không thể là cùng một người" },
      { status: 400 }
    );
  }

  const marriage = await prisma.marriage.create({
    data: { spouse1Id, spouse2Id, marriageDate, orderIndex },
  });

  return NextResponse.json({ data: marriage }, { status: 201 });
}
