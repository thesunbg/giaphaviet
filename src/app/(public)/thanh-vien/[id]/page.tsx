import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GENERATION_COLORS } from "@/lib/constants";
import { getLifeSpan, getCalendarEmoji, getCalendarLabel } from "@/lib/utils";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Calendar,
  BookOpen,
  Users,
  ChevronLeft,
} from "lucide-react";

export default async function PublicMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      parentChildAsChild: { include: { parent: true } },
      parentChildAsParent: {
        include: { child: true },
        orderBy: { child: { birthOrder: "asc" } },
      },
      marriagesAsSpouse1: { include: { spouse2: true }, orderBy: { orderIndex: "asc" } },
      marriagesAsSpouse2: { include: { spouse1: true }, orderBy: { orderIndex: "asc" } },
      events: { orderBy: { date: "asc" } },
    },
  });

  if (!member) return notFound();

  const parents = member.parentChildAsChild.map((pc) => ({
    member: pc.parent,
    type: pc.relationshipType,
  }));
  const children = member.parentChildAsParent.map((pc) => ({
    member: pc.child,
    type: pc.relationshipType,
  }));
  const spouses = [
    ...member.marriagesAsSpouse1.map((m) => m.spouse2),
    ...member.marriagesAsSpouse2.map((m) => m.spouse1),
  ];

  const genColor = GENERATION_COLORS[(member.generation - 1) % GENERATION_COLORS.length];
  const lifeSpan = getLifeSpan(member.birthDate, member.deathDate, member.isAlive);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href="/gia-pha"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#8b4513] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại Cây Gia Phả
      </Link>

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar
            src={member.photoUrl}
            gender={member.gender as "male" | "female"}
            size="lg"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{member.fullName}</h1>
            {lifeSpan && <p className="text-gray-500">{lifeSpan}</p>}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge className={genColor}>Đời {member.generation}</Badge>
              <Badge
                className={
                  member.gender === "male"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-pink-100 text-pink-700 border-pink-200"
                }
              >
                {member.gender === "male" ? "Nam" : "Nữ"}
              </Badge>
              {!member.isAlive && (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200">Đã mất</Badge>
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {member.occupation && (
                <p className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" /> {member.occupation}
                </p>
              )}
              {member.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" /> {member.address}
                </p>
              )}
              {member.deathAnniversary && (
                <p className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" /> Ngày giỗ: {member.deathAnniversary}
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                    backgroundColor: member.deathAnniversaryType === "lunar" ? "#fef3c7" : "#dbeafe",
                    color: member.deathAnniversaryType === "lunar" ? "#92400e" : "#1e40af",
                  }}>
                    {getCalendarEmoji(member.deathAnniversaryType)} {getCalendarLabel(member.deathAnniversaryType)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Biography */}
        {member.biography && (
          <Card className="lg:col-span-2">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-[#8b4513]" />
              Tiểu sử
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
              {member.biography}
            </p>
          </Card>
        )}

        {/* Family */}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-[#8b4513]" />
            Gia đình
          </h2>
          <div className="space-y-4">
            {parents.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400 mb-2">Cha / Mẹ</p>
                {parents.map((p) => (
                  <Link
                    key={p.member.id}
                    href={`/thanh-vien/${p.member.id}`}
                    className="mb-1 flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <Avatar
                      src={p.member.photoUrl}
                      gender={p.member.gender as "male" | "female"}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{p.member.fullName}</span>
                  </Link>
                ))}
              </div>
            )}
            {spouses.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400 mb-2">Vợ / Chồng</p>
                {spouses.map((s) => (
                  <Link
                    key={s.id}
                    href={`/thanh-vien/${s.id}`}
                    className="mb-1 flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <Avatar
                      src={s.photoUrl}
                      gender={s.gender as "male" | "female"}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{s.fullName}</span>
                  </Link>
                ))}
              </div>
            )}
            {children.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400 mb-2">Con</p>
                {children.map((c) => (
                  <Link
                    key={c.member.id}
                    href={`/thanh-vien/${c.member.id}`}
                    className="mb-1 flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <Avatar
                      src={c.member.photoUrl}
                      gender={c.member.gender as "male" | "female"}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{c.member.fullName}</span>
                    {c.type === "adopted" && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                        Con nuôi
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Events */}
        {member.events.length > 0 && (
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-[#8b4513]" />
              Sự kiện quan trọng
            </h2>
            <div className="space-y-3">
              {member.events.map((ev) => (
                <div key={ev.id} className="border-l-2 border-[#c9a96e] pl-4">
                  <p className="font-medium text-gray-900">{ev.title}</p>
                  {ev.date && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      {ev.date}
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                        backgroundColor: ev.calendarType === "lunar" ? "#fef3c7" : "#dbeafe",
                        color: ev.calendarType === "lunar" ? "#92400e" : "#1e40af",
                      }}>
                        {getCalendarEmoji(ev.calendarType)} {getCalendarLabel(ev.calendarType)}
                      </span>
                    </p>
                  )}
                  {ev.description && (
                    <p className="mt-1 text-sm text-gray-600">{ev.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Grave Info */}
        {member.graveInfo && (
          <Card>
            <h2 className="mb-3 font-semibold text-gray-900">Thông tin mộ phần</h2>
            <p className="text-sm text-gray-600">{member.graveInfo}</p>
          </Card>
        )}

        {/* Notes */}
        {member.notes && (
          <Card>
            <h2 className="mb-3 font-semibold text-gray-900">Ghi chú</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{member.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
