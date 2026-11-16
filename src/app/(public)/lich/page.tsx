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
    <div className="mx-auto max-w-4xl px-4 py-3 sm:p-6">
      <div className="mb-3 sm:mb-6">
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-2xl">
          <Calendar className="h-5 w-5 text-[#8b4513] sm:h-7 sm:w-7" />
          Lịch Gia Đình
        </h1>
        {/* Mô tả dài chỉ hiện trên màn hình lớn cho đỡ chật */}
        <p className="mt-1 hidden text-sm text-gray-500 sm:block">
          Tổng hợp các ngày giỗ, sinh nhật và sự kiện quan trọng trong dòng họ
        </p>
      </div>

      {/* Thống kê: trên điện thoại gom thành một hàng gọn */}
      <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-4">
        {[
          { icon: BookOpen, color: "text-purple-500", value: anniversaries.length, label: "Ngày giỗ" },
          { icon: Cake, color: "text-green-500", value: birthdays.length, label: "Sinh nhật" },
          { icon: Star, color: "text-blue-500", value: eventItems.length, label: "Sự kiện" },
        ].map((stat) => (
          <Card key={stat.label} className="!p-2.5 text-center sm:!p-6">
            <div className="flex items-center justify-center gap-2 sm:flex-col sm:gap-0">
              <stat.icon className={`h-4 w-4 shrink-0 sm:mb-1 sm:h-6 sm:w-6 ${stat.color}`} />
              <p className="text-base font-bold text-gray-900 sm:text-2xl">{stat.value}</p>
              <p className="text-[11px] text-gray-500 sm:text-xs">{stat.label}</p>
            </div>
          </Card>
        ))}
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
