"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, X, ChevronDown, GitBranch, List } from "lucide-react";
import { TreeBranch } from "./tree-branch";
import { MindmapBranch } from "./mindmap-branch";
import { MemberTooltip } from "./member-tooltip";
import { searchTree, findExpandedIds, cn } from "@/lib/utils";
import type { TreeNode } from "@/types/tree";
import type { MemberData } from "@/types/member";

interface FamilyTreeProps {
  tree: TreeNode;
}

type ViewMode = "diagram" | "mindmap";

/** Compute max generation depth in tree */
function getMaxGeneration(node: TreeNode): number {
  let max = node.generation;
  for (const child of node.children) {
    max = Math.max(max, getMaxGeneration(child));
  }
  return max;
}

/** Inner component for zoom controls — uses useControls hook inside TransformWrapper */
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();
  return (
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
  );
}

export function FamilyTree({ tree }: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [maxLevel, setMaxLevel] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("mindmap");
  const [searchIndex, setSearchIndex] = useState(0);
  const mindmapScrollRef = useRef<HTMLDivElement>(null);

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

  // Reset search index when query or results change
  useEffect(() => {
    setSearchIndex(0);
  }, [matchedIds]);

  // Scroll to search result by index in mindmap mode
  const scrollToResult = useCallback((index: number) => {
    if (viewMode !== "mindmap") return;
    const container = mindmapScrollRef.current;
    if (!container) return;
    const allHighlighted = container.querySelectorAll("[data-highlighted='true']");
    if (allHighlighted.length === 0) return;
    const safeIndex = index % allHighlighted.length;
    allHighlighted[safeIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [viewMode]);

  // Auto-scroll to first search result when search changes
  useEffect(() => {
    if (viewMode === "mindmap" && searchActive && matchedIds.size > 0) {
      const timer = setTimeout(() => scrollToResult(0), 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode, searchActive, matchedIds, scrollToResult]);

  // Handle Enter key to cycle through results
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchActive && matchedIds.size > 0) {
      e.preventDefault();
      const nextIndex = (searchIndex + 1) % matchedIds.size;
      setSearchIndex(nextIndex);
      setTimeout(() => scrollToResult(nextIndex), 100);
    }
  }, [searchActive, matchedIds, searchIndex, scrollToResult]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchIndex(0);
  }, []);

  const levelOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [
      { value: 0, label: "Tất cả" },
    ];
    for (let i = 1; i <= maxGen; i++) {
      opts.push({ value: i, label: "Đến Đời " + i });
    }
    return opts;
  }, [maxGen]);

  const toolbarContent = (
    <>
      {/* View mode toggle */}
      <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
        <button
          onClick={() => setViewMode("diagram")}
          className={cn(
            "flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm transition-colors cursor-pointer",
            viewMode === "diagram"
              ? "bg-[#8b4513] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
          title="Sơ đồ"
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{"Sơ đồ"}</span>
        </button>
        <button
          onClick={() => setViewMode("mindmap")}
          className={cn(
            "flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm transition-colors cursor-pointer",
            viewMode === "mindmap"
              ? "bg-[#8b4513] text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
          title="Danh sách"
        >
          <List className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{"Danh sách"}</span>
        </button>
      </div>

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
          onKeyDown={handleSearchKeyDown}
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
            ? `${searchIndex + 1}/${matchedIds.size}`
            : "0 kết quả"}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />
    </>
  );

  return (
    <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl border border-gray-200 bg-[#faf9f6]">
      {/* ===== DIAGRAM MODE ===== */}
      {viewMode === "diagram" && (
        <TransformWrapper
          initialScale={0.7}
          minScale={0.15}
          maxScale={2}
          centerOnInit={true}
          limitToBounds={false}
        >
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-4 py-2.5">
            {toolbarContent}

            <span className="hidden md:inline text-xs text-gray-400 whitespace-nowrap">
              {"Kéo để di chuyển · Cuộn để zoom"}
            </span>

            <ZoomControls />
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
        </TransformWrapper>
      )}

      {/* ===== MINDMAP MODE ===== */}
      {viewMode === "mindmap" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-4 py-2">
            {/* Row 1: View toggle + Level selector + Search counter */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* View mode toggle */}
              <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
                <button
                  onClick={() => setViewMode("diagram")}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm transition-colors cursor-pointer bg-white text-gray-600 hover:bg-gray-50"
                  title="Sơ đồ"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{"Sơ đồ"}</span>
                </button>
                <button
                  onClick={() => setViewMode("mindmap")}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm transition-colors cursor-pointer bg-[#8b4513] text-white"
                  title="Danh sách"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{"Danh sách"}</span>
                </button>
              </div>

              {/* Level selector */}
              <div className="relative">
                <select
                  value={maxLevel}
                  onChange={(e) => setMaxLevel(Number(e.target.value))}
                  className="appearance-none rounded-lg border border-gray-300 bg-white px-2 sm:px-3 py-1.5 pr-7 sm:pr-8 text-sm text-gray-700 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] cursor-pointer"
                >
                  {levelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 sm:right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Search result count */}
              {searchActive && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {matchedIds.size > 0
                    ? `${searchIndex + 1}/${matchedIds.size}`
                    : "0 kết quả"}
                </span>
              )}
            </div>

            {/* Row 2: Search input full-width */}
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
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
          </div>

          <div ref={mindmapScrollRef} className="h-full overflow-y-auto pt-[88px] px-2 sm:px-3 pb-6">
            <MindmapBranch
              node={tree}
              onMemberClick={(member) => setSelectedMember(member)}
              maxLevel={maxLevel}
              matchedIds={matchedIds}
              expandedForSearch={expandedForSearch}
              searchActive={searchActive}
            />
          </div>
        </>
      )}

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
