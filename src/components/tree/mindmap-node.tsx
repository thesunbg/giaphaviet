"use client";

import { cn, getLifeSpan } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GENERATION_COLORS } from "@/lib/constants";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MemberData } from "@/types/member";
import type { TreeSpouseInfo } from "@/types/tree";

interface MindmapNodeProps {
  member: MemberData;
  spouses?: TreeSpouseInfo[];
  isHighlighted?: boolean;
  highlightedSpouseIds?: Set<string>;
  onClick?: (member: MemberData) => void;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  childCount?: number;
  levelLimited?: boolean;
}

export function MindmapNode({
  member,
  spouses = [],
  isHighlighted,
  highlightedSpouseIds = new Set(),
  onClick,
  hasChildren,
  isExpanded,
  onToggleExpand,
  childCount = 0,
  levelLimited,
}: MindmapNodeProps) {
  const genColor = GENERATION_COLORS[(member.generation - 1) % GENERATION_COLORS.length];
  const lifeSpan = getLifeSpan(member.birthDate, member.deathDate, member.isAlive);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-2 transition-all cursor-pointer hover:bg-white/80",
        !member.isAlive && "opacity-70",
        isHighlighted && "ring-2 ring-yellow-400 ring-offset-1 bg-yellow-50 shadow-sm"
      )}
      data-highlighted={isHighlighted ? "true" : undefined}
      onClick={() => onClick?.(member)}
    >
      {/* Expand/collapse toggle or level-limit badge */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {hasChildren && !levelLimited && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8b4513] text-white hover:bg-[#6d350f] transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {hasChildren && levelLimited && (
          <span className="flex h-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] text-gray-600 font-medium">
            +{childCount}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar
        src={member.photoUrl}
        gender={member.gender}
        size="sm"
        className="shrink-0"
      />

      {/* Info block */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <p className={cn(
          "text-sm font-semibold leading-tight truncate",
          isHighlighted ? "text-yellow-800" : "text-gray-900"
        )}>
          {member.fullName}
        </p>

        {/* Spouse names (inline) */}
        {spouses.length > 0 && (
          <p className="text-xs text-gray-500 leading-tight mt-0.5 truncate">
            {"& "}
            {spouses.map((spouse, idx) => (
              <span key={spouse.member.id}>
                {idx > 0 && ", "}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(spouse.member);
                  }}
                  className={cn(
                    "hover:underline cursor-pointer",
                    highlightedSpouseIds.has(spouse.member.id)
                      ? "text-yellow-700 font-semibold"
                      : "text-[#8b4513]"
                  )}
                >
                  {spouse.member.fullName}
                </button>
              </span>
            ))}
          </p>
        )}

        {/* Life span */}
        {lifeSpan && (
          <p className="text-xs text-gray-400 leading-tight mt-0.5">{lifeSpan}</p>
        )}
      </div>

      {/* Generation badge */}
      <Badge className={cn("text-[10px] shrink-0 whitespace-nowrap", genColor)}>
        {"Đời"} {member.generation}
      </Badge>
    </div>
  );
}
