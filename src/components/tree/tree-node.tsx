"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GENERATION_COLORS } from "@/lib/constants";
import { getLifeSpan } from "@/lib/utils";
import type { MemberData } from "@/types/member";

interface TreeNodeProps {
  member: MemberData;
  isAdopted?: boolean;
  isHighlighted?: boolean;
  onClick?: (member: MemberData) => void;
}

export function TreeNodeCard({ member, isAdopted, isHighlighted, onClick }: TreeNodeProps) {
  const genColor = GENERATION_COLORS[(member.generation - 1) % GENERATION_COLORS.length];
  const lifeSpan = getLifeSpan(member.birthDate, member.deathDate, member.isAlive);

  return (
    <div
      onClick={() => onClick?.(member)}
      className={cn(
        "flex flex-col items-center rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md cursor-pointer min-w-[140px] max-w-[180px]",
        member.isAlive ? "border-gray-200" : "border-gray-300 deceased-overlay",
        isAdopted && "adopted-border",
        member.gender === "male" ? "hover:border-blue-300" : "hover:border-pink-300",
        isHighlighted && "ring-2 ring-yellow-400 ring-offset-2 border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-200/50"
      )}
    >
      <Avatar
        src={member.photoUrl}
        gender={member.gender}
        size="md"
      />
      <p className={cn(
        "mt-2 text-center text-sm font-semibold leading-tight",
        isHighlighted ? "text-yellow-800" : "text-gray-900"
      )}>
        {member.fullName}
      </p>
      {lifeSpan && (
        <p className="mt-0.5 text-xs text-gray-400">{lifeSpan}</p>
      )}
      {member.occupation && (
        <p className="mt-0.5 text-xs text-gray-500">{member.occupation}</p>
      )}
      <div className="mt-2 flex items-center gap-1">
        <Badge className={cn("text-[10px]", genColor)}>Đời {member.generation}</Badge>
        {isAdopted && (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">
            Nuôi
          </Badge>
        )}
      </div>
    </div>
  );
}
