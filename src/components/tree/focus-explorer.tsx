"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronUp,
  CornerLeftUp,
  Info,
  Home,
  ExternalLink,
  Heart,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GENERATION_COLORS } from "@/lib/constants";
import { cn, getLifeSpan } from "@/lib/utils";
import { getAncestors, type TreeIndex } from "@/lib/tree-index";
import type { MemberData } from "@/types/member";

interface FocusExplorerProps {
  index: TreeIndex;
  focusId: string;
  onFocus: (id: string) => void;
  onMemberClick: (member: MemberData) => void;
  searchActive: boolean;
  matchedIds: Set<string>;
  onSelectResult: (memberId: string) => void;
  /** Extra top padding so content clears the floating toolbar */
  topOffset: number;
}

function genColor(generation: number) {
  return GENERATION_COLORS[(generation - 1) % GENERATION_COLORS.length];
}

/**
 * Mobile-first "one family at a time" navigator.
 * Shows the focused person with spouses, a link up to the parents,
 * a sibling strip, and a tappable list of children to drill down.
 */
export function FocusExplorer({
  index,
  focusId,
  onFocus,
  onMemberClick,
  searchActive,
  matchedIds,
  onSelectResult,
  topOffset,
}: FocusExplorerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll back to top whenever the focus changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [focusId]);

  const node = index.byId.get(focusId) ?? index.root;
  const member = node.member;
  const parent = index.parentOf.get(member.id) ?? null;
  const ancestors = getAncestors(index, member.id);
  const siblings = parent ? parent.children.filter((c) => c.member.id !== member.id) : [];
  const lifeSpan = getLifeSpan(member.birthDate, member.deathDate, member.isAlive);
  const descendants = index.descendantCount.get(member.id) ?? 0;
  const isRoot = member.id === index.root.member.id;

  const results = searchActive ? index.members.filter((m) => matchedIds.has(m.id)) : [];

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overscroll-contain px-3 pb-8"
      style={{ paddingTop: topOffset + 12 }}
    >
      {/* ===== SEARCH RESULTS ===== */}
      {searchActive ? (
        results.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-6 text-center text-sm text-gray-400">
            Không tìm thấy thành viên nào
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {results.map((m) => {
              const host = index.byId.has(m.id) ? null : index.hostOf.get(m.id);
              const ls = getLifeSpan(m.birthDate, m.deathDate, m.isAlive);
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectResult(m.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-gray-50"
                >
                  <Avatar src={m.photoUrl} gender={m.gender} size="sm" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{m.fullName}</p>
                    <p className="truncate text-xs text-gray-400">
                      {host ? `Vợ/chồng của ${host.member.fullName}` : ls}
                    </p>
                  </div>
                  <Badge className={cn("shrink-0 text-[10px]", genColor(m.generation))}>
                    Đời {m.generation}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {/* ===== BREADCRUMB ===== */}
          <div className="scrollbar-none -mx-3 flex items-center gap-1 overflow-x-auto px-3 py-1 text-xs">
            {ancestors.map((a) => (
              <div key={a.member.id} className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onFocus(a.member.id)}
                  className="max-w-[9rem] truncate rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600 active:bg-gray-100"
                >
                  <span className="text-gray-400">Đ{a.generation} · </span>
                  {a.member.fullName}
                </button>
                <ChevronRight className="h-3 w-3 text-gray-300" />
              </div>
            ))}
            <span className="max-w-[10rem] shrink-0 truncate rounded-full bg-[#8b4513] px-2.5 py-1 font-medium text-white">
              <span className="text-white/70">Đ{member.generation} · </span>
              {member.fullName}
            </span>
          </div>

          {/* ===== PARENT (go up) ===== */}
          {parent ? (
            <button
              onClick={() => onFocus(parent.member.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#d2a679] bg-white/70 px-3 py-2.5 text-left active:bg-[#f5ede3]"
            >
              <CornerLeftUp className="h-4 w-4 shrink-0 text-[#8b4513]" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Lên đời {parent.generation}
                </p>
                <p className="truncate text-sm font-medium text-gray-800">
                  {parent.member.fullName}
                  {parent.spouses.length > 0 &&
                    ` & ${parent.spouses.map((s) => s.member.fullName).join(", ")}`}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-[#8b4513]/5 px-3 py-2 text-xs text-[#8b4513]">
              <Home className="h-3.5 w-3.5" />
              Thủy tổ của dòng họ
            </div>
          )}

          {/* ===== FOCUS CARD ===== */}
          <div className="rounded-2xl border-2 border-[#d2a679] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <button onClick={() => onMemberClick(member)} className="shrink-0">
                <Avatar src={member.photoUrl} gender={member.gender} size="lg" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold leading-tight text-gray-900">{member.fullName}</h2>
                {lifeSpan && <p className="mt-0.5 text-sm text-gray-500">{lifeSpan}</p>}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge className={cn("text-[10px]", genColor(member.generation))}>
                    Đời {member.generation}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[10px]",
                      member.gender === "male"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-pink-100 text-pink-700 border-pink-200"
                    )}
                  >
                    {member.gender === "male" ? "Nam" : "Nữ"}
                  </Badge>
                  {!member.isAlive && (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">
                      Đã mất
                    </Badge>
                  )}
                </div>
                {member.occupation && (
                  <p className="mt-1.5 truncate text-xs text-gray-500">{member.occupation}</p>
                )}
              </div>
              <button
                onClick={() => onMemberClick(member)}
                className="shrink-0 rounded-full bg-gray-100 p-2 text-gray-500 active:bg-gray-200"
                aria-label="Thông tin"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>

            {/* Spouses */}
            {node.spouses.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-gray-400">
                  <Heart className="h-3 w-3" />
                  {member.gender === "male" ? "Vợ" : "Chồng"}
                </p>
                {node.spouses.map((s) => {
                  const sls = getLifeSpan(s.member.birthDate, s.member.deathDate, s.member.isAlive);
                  return (
                    <button
                      key={s.member.id}
                      onClick={() => onMemberClick(s.member)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left active:bg-gray-50"
                    >
                      <Avatar src={s.member.photoUrl} gender={s.member.gender} size="sm" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{s.member.fullName}</p>
                        {sls && <p className="text-xs text-gray-400">{sls}</p>}
                      </div>
                      {s.marriageDate && (
                        <span className="shrink-0 text-[11px] text-gray-400">Cưới {s.marriageDate}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs">
              <Link
                href={`/thanh-vien/${member.id}`}
                className="flex items-center gap-1 rounded-lg bg-[#8b4513] px-3 py-1.5 font-medium text-white active:bg-[#6d350f]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Xem chi tiết
              </Link>
              {!isRoot && (
                <button
                  onClick={() => onFocus(index.root.member.id)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 active:bg-gray-50"
                >
                  <Home className="h-3.5 w-3.5" />
                  Về thủy tổ
                </button>
              )}
              {descendants > 0 && (
                <span className="ml-auto text-gray-400">{descendants} hậu duệ</span>
              )}
            </div>
          </div>

          {/* ===== SIBLINGS ===== */}
          {siblings.length > 0 && (
            <div>
              <p className="mb-1 px-1 text-[11px] uppercase tracking-wide text-gray-400">
                Anh chị em ({siblings.length})
              </p>
              <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
                {siblings.map((s) => (
                  <button
                    key={s.member.id}
                    onClick={() => onFocus(s.member.id)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 active:bg-gray-50"
                  >
                    <Avatar src={s.member.photoUrl} gender={s.member.gender} size="sm" className="h-7 w-7" />
                    <span className="max-w-[8rem] truncate text-xs font-medium text-gray-700">
                      {s.member.fullName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== CHILDREN ===== */}
          <div>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Con cái ({node.children.length})
              </p>
              {node.children.length > 0 && (
                <span className="text-[11px] text-gray-400">Đời {member.generation + 1}</span>
              )}
            </div>
            {node.children.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-4 text-center text-sm text-gray-400">
                Chưa có thông tin con cái
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                {node.children.map((c, i) => {
                  const hasKids = c.children.length > 0;
                  const cls = getLifeSpan(c.member.birthDate, c.member.deathDate, c.member.isAlive);
                  const spouseNames = c.spouses.map((s) => s.member.fullName).join(", ");
                  const sub = [cls, spouseNames && `& ${spouseNames}`].filter(Boolean).join(" · ");
                  return (
                    <div
                      key={c.member.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onFocus(c.member.id)}
                      onKeyDown={(e) => e.key === "Enter" && onFocus(c.member.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 active:bg-gray-50",
                        !c.member.isAlive && "opacity-80"
                      )}
                    >
                      <span className="w-4 shrink-0 text-center text-[11px] text-gray-400">{i + 1}</span>
                      <Avatar src={c.member.photoUrl} gender={c.member.gender} size="sm" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{c.member.fullName}</p>
                        {sub && <p className="truncate text-xs text-gray-400">{sub}</p>}
                      </div>
                      {hasKids && (
                        <span className="shrink-0 rounded-full bg-[#8b4513]/10 px-2 py-0.5 text-[11px] font-medium text-[#8b4513]">
                          {c.children.length} con
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMemberClick(c.member);
                        }}
                        className="shrink-0 rounded-full p-1.5 text-gray-400 active:bg-gray-100"
                        aria-label="Thông tin"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
