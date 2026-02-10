"use client";

import { useState, useMemo, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, X, ChevronDown } from "lucide-react";
import { TreeBranch } from "./tree-branch";
import { MemberTooltip } from "./member-tooltip";
import { searchTree, findExpandedIds } from "@/lib/utils";
import type { TreeNode } from "@/types/tree";
import type { MemberData } from "@/types/member";

interface FamilyTreeProps {
  tree: TreeNode;
}

/** Compute max generation depth in tree */
function getMaxGeneration(node: TreeNode): number {
  let max = node.generation;
  for (const child of node.children) {
    max = Math.max(max, getMaxGeneration(child));
  }
  return max;
}

export function FamilyTree({ tree }: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [maxLevel, setMaxLevel] = useState<number>(0); // 0 = show all
  const [searchQuery, setSearchQuery] = useState("");

  const maxGen = useMemo(() => getMaxGeneration(tree), [tree]);

  const matchedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    return searchTree(tree, searchQuery);
  }, [tree, searchQuery]);

  const expandedForSearch = useMemo(() => {
    if (matchedIds.size === 0) return new Set<string>();
    return findExpandedIds(tree, matchedIds);
  }, [tree, matchedIds]);

  const searchActive = searchQuery.trim().length > 0;

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Level options
  const levelOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [
      { value: 0, label: "Tất cả" },
    ];
    for (let i = 1; i <= maxGen; i++) {
      opts.push({ value: i, label: `Đến Đời ${i}` });
    }
    return opts;
  }, [maxGen]);

  return (
    <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-[#faf9f6]">
      <TransformWrapper
        initialScale={0.7}
        minScale={0.15}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            {/* Top toolbar */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-2.5">
              {/* Level selector */}
              <div className="relative">
                <select
                  value={maxLevel}
                  onChange={(e) => setMaxLevel(Number(e.target.value))}
                  className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] cursor-pointer"
                >
                  {levelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Search result count */}
              {searchActive && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {matchedIds.size > 0
                    ? `Tìm thấy ${matchedIds.size} kết quả`
                    : "Không tìm thấy"}
                </span>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Help text */}
              <span className="hidden md:inline text-xs text-gray-400 whitespace-nowrap">
                Kéo để di chuyển · Cuộn để zoom
              </span>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => zoomIn()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => centerView()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Căn giữa"
                >
                  <Maximize2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <div className="flex min-h-full min-w-max items-start justify-center p-20 pt-24">
                <TreeBranch
                  node={tree}
                  onMemberClick={(member) => setSelectedMember(member)}
                  maxLevel={maxLevel}
                  matchedIds={matchedIds}
                  expandedForSearch={expandedForSearch}
                  searchActive={searchActive}
                />
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Member Detail Popup */}
      {selectedMember && (
        <MemberTooltip
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
