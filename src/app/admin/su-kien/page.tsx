import { prisma } from "@/lib/prisma";
import { EventManager } from "@/components/member/event-manager";

export default async function EventPage() {
  const members = await prisma.member.findMany({
    orderBy: [{ generation: "asc" }, { fullName: "asc" }],
    select: { id: true, fullName: true, generation: true },
  });

  const events = await prisma.event.findMany({
    include: {
      member: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sự Kiện</h1>
      <EventManager members={members} events={events} />
    </div>
  );
}
