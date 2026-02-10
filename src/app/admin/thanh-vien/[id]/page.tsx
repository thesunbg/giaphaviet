import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GENERATION_COLORS } from "@/lib/constants";
import { ChevronLeft, Pencil, MapPin, Briefcase, BookOpen, Calendar } from "lucide-react";
import { getCalendarEmoji, getCalendarLabel } from "@/lib/utils";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      parentChildAsChild: { include: { parent: true } },
      parentChildAsParent: { include: { child: true } },
      marriagesAsSpouse1: { include: { spouse2: true }, orderBy: { orderIndex: "asc" } },
      marriagesAsSpouse2: { include: { spouse1: true }, orderBy: { orderIndex: "asc" } },
      events: { orderBy: { date: "asc" } },
    },
  });

  if (!member) return notFound();

  const parents = member.parentChildAsChild.map((pc) => ({
    ...pc.parent,
    type: pc.relationshipType,
  }));
  const children = member.parentChildAsParent.map((pc) => ({
    ...pc.child,
    type: pc.relationshipType,
  }));
  const spouses = [
    ...member.marriagesAsSpouse1.map((m) => m.spouse2),
    ...member.marriagesAsSpouse2.map((m) => m.spouse1),
  ];

  const genColor = GENERATION_COLORS[(member.generation - 1) % GENERATION_COLORS.length];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/thanh-vien"
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{member.fullName}</h1>
        </div>
        <Link href={`/admin/thanh-vien/${member.id}/chinh-sua`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={member.photoUrl}
              gender={member.gender as "male" | "female"}
              size="lg"
            />
            <h2 className="mt-4 text-xl font-bold text-gray-900">{member.fullName}</h2>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Badge className={genColor}>Đời {member.generation}</Badge>
              <Badge className={member.gender === "male" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-pink-100 text-pink-700 border-pink-200"}>
                {member.gender === "male" ? "Nam" : "Nữ"}
              </Badge>
              {!member.isAlive && (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200">Đã mất</Badge>
              )}
            </div>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              {member.birthDate && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Sinh: {member.birthDate}
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                    backgroundColor: member.birthDateType === "lunar" ? "#fef3c7" : "#dbeafe",
                    color: member.birthDateType === "lunar" ? "#92400e" : "#1e40af",
                  }}>
                    {getCalendarEmoji(member.birthDateType)} {getCalendarLabel(member.birthDateType)}
                  </span>
                </p>
              )}
              {member.deathDate && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Mất: {member.deathDate}
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                    backgroundColor: member.deathDateType === "lunar" ? "#fef3c7" : "#dbeafe",
                    color: member.deathDateType === "lunar" ? "#92400e" : "#1e40af",
                  }}>
                    {getCalendarEmoji(member.deathDateType)} {getCalendarLabel(member.deathDateType)}
                  </span>
                </p>
              )}
              {member.occupation && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  {member.occupation}
                </p>
              )}
              {member.address && (
                <p className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {member.address}
                </p>
              )}
              {member.deathAnniversary && (
                <p className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  Giỗ: {member.deathAnniversary}
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
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Biography */}
          {member.biography && (
            <Card>
              <h3 className="mb-2 font-semibold text-gray-900">Tiểu sử</h3>
              <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                {member.biography}
              </p>
            </Card>
          )}

          {/* Family */}
          <Card>
            <h3 className="mb-4 font-semibold text-gray-900">Gia đình</h3>
            <div className="space-y-4">
              {parents.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400 mb-2">Cha / Mẹ</p>
                  <div className="flex flex-wrap gap-2">
                    {parents.map((p) => (
                      <Link
                        key={p.id}
                        href={`/admin/thanh-vien/${p.id}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Avatar
                          src={p.photoUrl}
                          gender={p.gender as "male" | "female"}
                          size="sm"
                        />
                        <span className="text-sm font-medium">{p.fullName}</span>
                        {p.type === "adopted" && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                            Nuôi
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {spouses.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400 mb-2">Vợ / Chồng</p>
                  <div className="flex flex-wrap gap-2">
                    {spouses.map((s) => (
                      <Link
                        key={s.id}
                        href={`/admin/thanh-vien/${s.id}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors"
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
                </div>
              )}
              {children.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400 mb-2">Con</p>
                  <div className="flex flex-wrap gap-2">
                    {children.map((c) => (
                      <Link
                        key={c.id}
                        href={`/admin/thanh-vien/${c.id}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Avatar
                          src={c.photoUrl}
                          gender={c.gender as "male" | "female"}
                          size="sm"
                        />
                        <span className="text-sm font-medium">{c.fullName}</span>
                        {c.type === "adopted" && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                            Nuôi
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {parents.length === 0 && spouses.length === 0 && children.length === 0 && (
                <p className="text-sm text-gray-400">Chưa có thông tin quan hệ.</p>
              )}
            </div>
          </Card>

          {/* Events */}
          {member.events.length > 0 && (
            <Card>
              <h3 className="mb-4 font-semibold text-gray-900">Sự kiện</h3>
              <div className="space-y-3">
                {member.events.map((ev) => (
                  <div key={ev.id} className="flex gap-3 border-l-2 border-[#c9a96e] pl-4">
                    <div>
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
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes / Grave Info */}
          {(member.graveInfo || member.notes) && (
            <Card>
              {member.graveInfo && (
                <div className="mb-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Thông tin mộ phần</h3>
                  <p className="text-sm text-gray-600">{member.graveInfo}</p>
                </div>
              )}
              {member.notes && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Ghi chú</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{member.notes}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
