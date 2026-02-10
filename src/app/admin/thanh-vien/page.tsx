import { prisma } from "@/lib/prisma";
import { MemberListClient } from "@/components/member/member-list-client";

export default async function MemberListPage() {
  const members = await prisma.member.findMany({
    orderBy: [{ generation: "asc" }, { birthOrder: "asc" }],
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      gender: true,
      generation: true,
      occupation: true,
      isAlive: true,
      photoUrl: true,
    },
  });

  return <MemberListClient members={members} />;
}
