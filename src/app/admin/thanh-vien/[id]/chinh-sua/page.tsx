import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MemberForm } from "@/components/member/member-form";
import { ChevronLeft } from "lucide-react";
import type { MemberData, CalendarType } from "@/types/member";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) return notFound();

  const memberData: MemberData = {
    ...member,
    gender: member.gender as "male" | "female",
    birthDateType: (member.birthDateType as CalendarType) || "solar",
    deathDateType: (member.deathDateType as CalendarType) || "solar",
    deathAnniversaryType: (member.deathAnniversaryType as CalendarType) || "lunar",
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/thanh-vien/${member.id}`}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Chỉnh sửa: {member.fullName}
        </h1>
      </div>
      <MemberForm member={memberData} />
    </div>
  );
}
