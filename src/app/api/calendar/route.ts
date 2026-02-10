import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Get all death anniversaries (ngày giỗ)
  const membersWithAnniversary = await prisma.member.findMany({
    where: {
      deathAnniversary: { not: null },
      isAlive: false,
    },
    select: {
      id: true,
      fullName: true,
      generation: true,
      deathAnniversary: true,
      deathAnniversaryType: true,
    },
    orderBy: { generation: "asc" },
  });

  // Get all living members with birthdays
  const membersWithBirthday = await prisma.member.findMany({
    where: {
      birthDate: { not: null },
      isAlive: true,
    },
    select: {
      id: true,
      fullName: true,
      generation: true,
      birthDate: true,
      birthDateType: true,
    },
    orderBy: { generation: "asc" },
  });

  // Get all events
  const events = await prisma.event.findMany({
    include: {
      member: {
        select: { id: true, fullName: true, generation: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Format data
  const anniversaries = membersWithAnniversary.map((m) => ({
    type: "anniversary" as const,
    memberId: m.id,
    memberName: m.fullName,
    generation: m.generation,
    date: m.deathAnniversary,
    calendarType: m.deathAnniversaryType || "lunar",
    label: `Giỗ ${m.fullName}`,
  }));

  const birthdays = membersWithBirthday.map((m) => ({
    type: "birthday" as const,
    memberId: m.id,
    memberName: m.fullName,
    generation: m.generation,
    date: m.birthDate,
    calendarType: m.birthDateType || "solar",
    label: `Sinh nhật ${m.fullName}`,
  }));

  const eventItems = events.map((ev) => ({
    type: "event" as const,
    memberId: ev.member.id,
    memberName: ev.member.fullName,
    generation: ev.member.generation,
    date: ev.date,
    calendarType: ev.calendarType || "solar",
    label: ev.title,
    description: ev.description,
  }));

  return NextResponse.json({
    data: {
      anniversaries,
      birthdays,
      events: eventItems,
      total: anniversaries.length + birthdays.length + eventItems.length,
    },
  });
}
