"use client";

import { X, MapPin, Briefcase, Calendar, BookOpen, FileText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GENERATION_COLORS } from "@/lib/constants";
import { getCalendarEmoji, getCalendarLabel } from "@/lib/utils";
import type { MemberData } from "@/types/member";
import Link from "next/link";

interface Props {
  member: MemberData;
  onClose: () => void;
}

export function MemberTooltip({ member, onClose }: Props) {
  const genColor = GENERATION_COLORS[(member.generation - 1) % GENERATION_COLORS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative mx-4 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 cursor-pointer"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        <div className="flex flex-col items-center text-center">
          <Avatar src={member.photoUrl} gender={member.gender} size="lg" />
          <h2 className="mt-3 text-xl font-bold text-gray-900">{member.fullName}</h2>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
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
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {member.birthDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Sinh: {member.birthDate}</span>
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                backgroundColor: member.birthDateType === "lunar" ? "#fef3c7" : "#dbeafe",
                color: member.birthDateType === "lunar" ? "#92400e" : "#1e40af",
              }}>
                {getCalendarEmoji(member.birthDateType)} {getCalendarLabel(member.birthDateType)}
              </span>
            </div>
          )}
          {member.deathDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Mất: {member.deathDate}</span>
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                backgroundColor: member.deathDateType === "lunar" ? "#fef3c7" : "#dbeafe",
                color: member.deathDateType === "lunar" ? "#92400e" : "#1e40af",
              }}>
                {getCalendarEmoji(member.deathDateType)} {getCalendarLabel(member.deathDateType)}
              </span>
            </div>
          )}
          {member.occupation && (
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{member.occupation}</span>
            </div>
          )}
          {member.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{member.address}</span>
            </div>
          )}
          {member.deathAnniversary && (
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Ngày giỗ: {member.deathAnniversary}</span>
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                backgroundColor: member.deathAnniversaryType === "lunar" ? "#fef3c7" : "#dbeafe",
                color: member.deathAnniversaryType === "lunar" ? "#92400e" : "#1e40af",
              }}>
                {getCalendarEmoji(member.deathAnniversaryType)} {getCalendarLabel(member.deathAnniversaryType)}
              </span>
            </div>
          )}
          {member.biography && (
            <div className="mt-3 flex gap-2 text-gray-600">
              <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="whitespace-pre-wrap">{member.biography}</p>
            </div>
          )}
          {member.graveInfo && (
            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-gray-600">
              <p className="text-xs font-medium uppercase text-gray-400 mb-1">Mộ phần</p>
              <p>{member.graveInfo}</p>
            </div>
          )}
          {member.notes && (
            <div className="mt-2 rounded-lg bg-amber-50 p-3 text-gray-600">
              <p className="text-xs font-medium uppercase text-amber-600 mb-1">Ghi chú</p>
              <p>{member.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link
            href={`/thanh-vien/${member.id}`}
            className="text-sm text-[#8b4513] hover:underline font-medium"
          >
            Xem chi tiết &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
