import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/user-auth";
import {
  parseDayMonth,
  nextOccurrence,
  daysBetween,
  toIsoDate,
  type UpcomingItem,
} from "@/lib/upcoming";

/**
 * Ngày giỗ / sinh nhật / sự kiện sắp tới trong N ngày tới.
 * Ngày âm lịch được quy đổi sang dương lịch để sắp xếp.
 */
export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để tiếp tục." }, { status: 401 });
  }

  const days = Math.max(1, Math.min(Number(request.nextUrl.searchParams.get("days")) || 45, 366));
  const today = new Date();

  const [anniversaryMembers, birthdayMembers, events] = await Promise.all([
    prisma.member.findMany({
      where: { deathAnniversary: { not: null }, isAlive: false },
      select: {
        id: true,
        fullName: true,
        generation: true,
        deathAnniversary: true,
        deathAnniversaryType: true,
      },
    }),
    prisma.member.findMany({
      where: { birthDate: { not: null }, isAlive: true },
      select: {
        id: true,
        fullName: true,
        generation: true,
        birthDate: true,
        birthDateType: true,
      },
    }),
    prisma.event.findMany({
      where: { date: { not: null } },
      include: { member: { select: { id: true, fullName: true, generation: true } } },
    }),
  ]);

  const items: UpcomingItem[] = [];

  function push(
    type: UpcomingItem["type"],
    memberId: string,
    memberName: string,
    generation: number,
    label: string,
    rawDate: string | null,
    calendarType: string | null
  ) {
    const dayMonth = parseDayMonth(rawDate);
    if (!dayMonth) return;

    const next = nextOccurrence(dayMonth, calendarType, today);
    if (!next) return;

    const daysUntil = daysBetween(today, next);
    if (daysUntil < 0 || daysUntil > days) return;

    items.push({
      type,
      memberId,
      memberName,
      generation,
      label,
      rawDate: rawDate || "",
      calendarType: calendarType || "solar",
      solarDate: toIsoDate(next),
      daysUntil,
    });
  }

  anniversaryMembers.forEach((m) =>
    push(
      "anniversary",
      m.id,
      m.fullName,
      m.generation,
      `Giỗ ${m.fullName}`,
      m.deathAnniversary,
      m.deathAnniversaryType || "lunar"
    )
  );

  birthdayMembers.forEach((m) =>
    push(
      "birthday",
      m.id,
      m.fullName,
      m.generation,
      `Sinh nhật ${m.fullName}`,
      m.birthDate,
      m.birthDateType || "solar"
    )
  );

  events.forEach((ev) =>
    push(
      "event",
      ev.member.id,
      ev.member.fullName,
      ev.member.generation,
      ev.title,
      ev.date,
      ev.calendarType || "solar"
    )
  );

  items.sort((a, b) => a.daysUntil - b.daysUntil || a.memberName.localeCompare(b.memberName));

  return NextResponse.json({ data: items, days });
}
