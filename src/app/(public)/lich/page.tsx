import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { CalendarList, type CalendarItem } from "@/components/calendar/calendar-list";
import { Calendar, BookOpen, Cake, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  // Get all death anniversaries
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

  // Get living members with birthdays
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

  const anniversaries: CalendarItem[] = membersWithAnniversary.map((m) => ({
    type: "anniversary",
    memberId: m.id,
    memberName: m.fullName,
    generation: m.generation,
    date: m.deathAnniversary,
    calendarType: m.deathAnniversaryType || "lunar",
    label: `Giỗ ${m.fullName}`,
  }));

  const birthdays: CalendarItem[] = membersWithBirthday.map((m) => ({
    type: "birthday",
    memberId: m.id,
    memberName: m.fullName,
    generation: m.generation,
    date: m.birthDate,
    calendarType: m.birthDateType || "solar",
    label: `Sinh nhật ${m.fullName}`,
  }));

  const eventItems: CalendarItem[] = events.map((ev) => ({
    type: "event",
    memberId: ev.member.id,
    memberName: ev.member.fullName,
    generation: ev.member.generation,
    date: ev.date,
    calendarType: ev.calendarType || "solar",
    label: ev.title,
    description: ev.description,
  }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-7 w-7 text-[#8b4513]" />
          Lịch Gia Đình
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tổng hợp các ngày giỗ, sinh nhật và sự kiện quan trọng trong dòng họ
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="flex flex-col items-center">
            <BookOpen className="h-6 w-6 text-purple-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{anniversaries.length}</p>
            <p className="text-xs text-gray-500">Ngày giỗ</p>
          </div>
        </Card>
        <Card className="text-center">
          <div className="flex flex-col items-center">
            <Cake className="h-6 w-6 text-green-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{birthdays.length}</p>
            <p className="text-xs text-gray-500">Sinh nhật</p>
          </div>
        </Card>
        <Card className="text-center">
          <div className="flex flex-col items-center">
            <Star className="h-6 w-6 text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{eventItems.length}</p>
            <p className="text-xs text-gray-500">Sự kiện</p>
          </div>
        </Card>
      </div>

      {/* Calendar List with filters */}
      <CalendarList
        anniversaries={anniversaries}
        birthdays={birthdays}
        events={eventItems}
      />
    </div>
  );
}
