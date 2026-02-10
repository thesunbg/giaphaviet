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

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: body.title,
      date: body.date,
      calendarType: body.calendarType || "solar",
      description: body.description,
    },
  });

  return NextResponse.json({ data: event });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
