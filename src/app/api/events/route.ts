import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("memberId");

  const where = memberId ? { memberId } : {};

  const events = await prisma.event.findMany({
    where,
    include: { member: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: events });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: parsed.data,
  });

  return NextResponse.json({ data: event }, { status: 201 });
}
