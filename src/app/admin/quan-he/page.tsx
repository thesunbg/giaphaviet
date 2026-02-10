import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { RelationshipManager } from "@/components/relationship/relationship-manager";

export default async function RelationshipPage() {
  const members = await prisma.member.findMany({
    orderBy: [{ generation: "asc" }, { fullName: "asc" }],
    select: { id: true, fullName: true, gender: true, generation: true },
  });

  const parentChildRelations = await prisma.parentChild.findMany({
    include: {
      parent: { select: { id: true, fullName: true, gender: true } },
      child: { select: { id: true, fullName: true, gender: true } },
    },
  });

  const marriages = await prisma.marriage.findMany({
    include: {
      spouse1: { select: { id: true, fullName: true, gender: true } },
      spouse2: { select: { id: true, fullName: true, gender: true } },
    },
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản Lý Quan Hệ</h1>

      <RelationshipManager
        members={members}
        parentChildRelations={parentChildRelations}
        marriages={marriages}
      />
    </div>
  );
}
