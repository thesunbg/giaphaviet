"use client";

import { useEffect } from "react";
import { X, MapPin, Briefcase, Calendar, BookOpen, FileText, Compass, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GENERATION_COLORS } from "@/lib/constants";
import { getCalendarEmoji, getCalendarLabel } from "@/lib/utils";
import type { MemberData } from "@/types/member";
import Link from "next/link";

interface Props {
  member: MemberData;
  onClose: () => void;
  /** When provided, shows a "Khám phá gia đình" action */
  onExplore?: (member: MemberData) => void;
}

function CalendarTag({ type }: { type: string | null | undefined }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: type === "lunar" ? "#fef3c7" : "#dbeafe",
        color: type === "lunar" ? "#92400e" : "#1e40af",
      }}
    >
      {getCalendarEmoji(type)} {getCalendarLabel(type)}
    </span>
  );
}

/**
 * Member detail popup: bottom sheet on phones, centered dialog on larger screens.
 */
export function MemberTooltip({ member, onClose, onExplore }: Props) {
  const genColor = GENERATION_COLORS[(member.generation - 1) % GENERATION_COLORS.length];

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="sheet-enter relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:mx-4 sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (phones only) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-gray-100 p-1.5 hover:bg-gray-200 cursor-pointer sm:bg-transparent sm:hover:bg-gray-100"
          aria-label="Đóng"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 sm:p-6">
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
              <div className="flex flex-wrap items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Sinh: {member.birthDate}</span>
                <CalendarTag type={member.birthDateType} />
              </div>
            )}
            {member.deathDate && (
              <div className="flex flex-wrap items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Mất: {member.deathDate}</span>
                <CalendarTag type={member.deathDateType} />
              </div>
            )}
            {member.occupation && (
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{member.occupation}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{member.address}</span>
              </div>
            )}
            {member.deathAnniversary && (
              <div className="flex flex-wrap items-center gap-2 text-gray-600">
                <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Ngày giỗ: {member.deathAnniversary}</span>
                <CalendarTag type={member.deathAnniversaryType} />
              </div>
            )}
            {member.biography && (
              <div className="mt-3 flex gap-2 text-gray-600">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <p className="whitespace-pre-wrap">{member.biography}</p>
              </div>
            )}
            {member.graveInfo && (
              <div className="mt-2 rounded-lg bg-gray-50 p-3 text-gray-600">
                <p className="mb-1 text-xs font-medium uppercase text-gray-400">Mộ phần</p>
                <p>{member.graveInfo}</p>
              </div>
            )}
            {member.notes && (
              <div className="mt-2 rounded-lg bg-amber-50 p-3 text-gray-600">
                <p className="mb-1 text-xs font-medium uppercase text-amber-600">Ghi chú</p>
                <p>{member.notes}</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            {onExplore && (
              <button
                onClick={() => onExplore(member)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#8b4513] px-3 py-2.5 text-sm font-medium text-[#8b4513] hover:bg-[#8b4513]/5 active:bg-[#8b4513]/10 cursor-pointer"
              >
                <Compass className="h-4 w-4" />
                Khám phá gia đình
              </button>
            )}
            <Link
              href={`/thanh-vien/${member.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#8b4513] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#6d350f]"
            >
              <ExternalLink className="h-4 w-4" />
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
