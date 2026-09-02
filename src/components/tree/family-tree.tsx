"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, X, ChevronDown,
  GitBranch, List, Compass,
} from "lucide-react";
import { TreeBranch } from "./tree-branch";
import { MindmapBranch } from "./mindmap-branch";
import { FocusExplorer } from "./focus-explorer";
import { MemberTooltip } from "./member-tooltip";
import { searchTree, findExpandedIds, cn } from "@/lib/utils";
import { indexTree, resolveFocusNode } from "@/lib/tree-index";
import type { TreeNode } from "@/types/tree";
import type { MemberData } from "@/types/member";

export type ViewMode = "focus" | "diagram" | "mindmap";

interface FamilyTreeProps {
  tree: TreeNode;
  /** Initial view mode; the page picks "focus" for phones. */
  defaultViewMode?: ViewMode;
}

/** Compute max generation depth in tree */
function getMaxGeneration(node: TreeNode): number {
  let max = node.generation;
  for (const child of node.children) {
    max = Math.max(max, getMaxGeneration(child));
  }
  return max;
}

const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer";

/** Zoom controls — must live inside TransformWrapper (uses useControls) */
function ZoomControls({ vertical = false }: { vertical?: boolean }) {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();
  return (
    <div className={cn("flex items-center gap-1", vertical && "flex-col")}>
      <button onClick={() => zoomIn()} className={iconBtn} title="Phóng to" aria-label="Phóng to">
        <ZoomIn className="h-4 w-4 text-gray-600" />
      </button>
      <button onClick={() => zoomOut()} className={iconBtn} title="Thu nhỏ" aria-label="Thu nhỏ">
        <ZoomOut className="h-4 w-4 text-gray-600" />
      </button>
      <button onClick={() => resetTransform()} className={iconBtn} title="Reset" aria-label="Reset">
        <RotateCcw className="h-4 w-4 text-gray-600" />
      </button>
      <button onClick={() => centerView()} className={cn(iconBtn, "hidden sm:flex")} title="Căn giữa" aria-label="Căn giữa">
        <Maximize2 className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof Compass }[] = [
  { value: "focus", label: "Khám phá", icon: Compass },
  { value: "diagram", label: "Sơ đồ", icon: GitBranch },
  { value: "mindmap", label: "Danh sách", icon: List },
];

export function FamilyTree({ tree, defaultViewMode = "diagram" }: FamilyTreeProps) {
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [maxLevel, setMaxLevel] = useState<number>(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [searchIndex, setSearchIndex] = useState(0);
  const [toolbarH, setToolbarH] = useState(defaultViewMode === "focus" ? 92 : 52);
  const mindmapScrollRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const maxGen = useMemo(() => getMaxGeneration(tree), [tree]);
  const index = useMemo(() => indexTree(tree), [tree]);

  // ===== Focus mode state (synced with URL hash so the back button works) =====
  const [focusId, setFocusIdState] = useState(tree.member.id);

  useEffect(() => {
    const readHash = () => {
      const id = window.location.hash.slice(1);
      setFocusIdState(id && index.byId.has(id) ? id : tree.member.id);
    };
    readHash();
    window.addEventListener("popstate", readHash);
    return () => window.removeEventListener("popstate", readHash);
  }, [index, tree.member.id]);

  const setFocus = useCallback(
    (id: string) => {
      if (!index.byId.has(id)) return;
      setFocusIdState(id);
      try {
        window.history.pushState(null, "", `#${id}`);
      } catch {
        /* ignore */
      }
    },
    [index]
  );

  // Measure toolbar so scrollable modes can pad below it
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const update = () => setToolbarH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  // ===== Search =====
  const matchedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    return searchTree(tree, searchQuery);
  }, [tree, searchQuery]);

  const expandedForSearch = useMemo(() => {
    if (matchedIds.size === 0) return new Set<string>();
    return findExpandedIds(tree, matchedIds);
  }, [tree, matchedIds]);

  const searchActive = searchQuery.trim().length > 0;

  const scrollToResult = useCallback((idx: number) => {
    if (viewMode !== "mindmap") return;
    const container = mindmapScrollRef.current;
    if (!container) return;
    const all = container.querySelectorAll("[data-highlighted='true']");
    if (all.length === 0) return;
    all[idx % all.length]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "mindmap" && searchActive && matchedIds.size > 0) {
      const timer = setTimeout(() => scrollToResult(0), 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode, searchActive, matchedIds, scrollToResult]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchActive && matchedIds.size > 0) {
      e.preventDefault();
      const next = (searchIndex + 1) % matchedIds.size;
      setSearchIndex(next);
      setTimeout(() => scrollToResult(next), 100);
    }
    if (e.key === "Escape") {
      setSearchQuery("");
    }
  }, [searchActive, matchedIds, searchIndex, scrollToResult]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchIndex(0);
  }, []);

  /** Tapping a search result in focus mode */
  const handleSelectResult = useCallback((memberId: string) => {
    const node = resolveFocusNode(index, memberId);
    if (!node) return;
    setFocus(node.member.id);
    if (node.member.id !== memberId) {
      // A spouse was picked: focus their family and open their info
      const spouse = node.spouses.find((s) => s.member.id === memberId)?.member;
      if (spouse) setSelectedMember(spouse);
    }
    handleClearSearch();
  }, [index, setFocus, handleClearSearch]);

  /** "Khám phá" from the detail popup in any mode */
  const handleExplore = useCallback((member: MemberData) => {
    const node = resolveFocusNode(index, member.id);
    if (!node) return;
    setFocus(node.member.id);
    setViewMode("focus");
    setSelectedMember(null);
    handleClearSearch();
  }, [index, setFocus, handleClearSearch]);

  const levelOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [{ value: 0, label: "Tất cả" }];
    for (let i = 1; i <= maxGen; i++) opts.push({ value: i, label: "Đến Đời " + i });
    return opts;
  }, [maxGen]);

  // ===== Toolbar (shared by all modes; zoom controls slot for diagram mode) =====
  const renderToolbar = (zoomControls?: ReactNode) => (
    <div
      ref={toolbarRef}
      className="absolute inset-x-0 top-0 z-20 border-b border-gray-200 bg-white/90 px-2 py-2 backdrop-blur-sm sm:px-4"
    >
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {/* View mode toggle */}
        <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-gray-300">
          {VIEW_OPTIONS.map((opt) => {
            const active = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={cn(
                  "flex h-8 items-center gap-1 px-2 text-sm transition-colors cursor-pointer sm:px-3",
                  active ? "bg-[#8b4513] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                )}
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={active}
              >
                <opt.icon className="h-3.5 w-3.5" />
                <span className={cn("text-xs sm:text-sm", active ? "inline" : "hidden sm:inline")}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Level selector (not relevant in focus mode) */}
        {viewMode !== "focus" && (
          <div className="relative shrink-0">
            <select
              value={maxLevel}
              onChange={(e) => setMaxLevel(Number(e.target.value))}
              className="h-8 appearance-none rounded-lg border border-gray-300 bg-white px-2 pr-7 text-sm text-gray-700 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] cursor-pointer sm:px-3 sm:pr-8"
            >
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:right-2" />
          </div>
        )}

        {/* Search: full width on phones (wraps to 2nd row), inline on desktop */}
        <div className="order-last flex basis-full items-center gap-2 md:order-none md:max-w-xs md:flex-1 md:basis-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm kiếm theo tên..."
              enterKeyHint="search"
              className="h-8 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-gray-100 cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>
          {searchActive && (
            <span className="shrink-0 text-xs text-gray-500 whitespace-nowrap">
              {matchedIds.size > 0
                ? viewMode === "mindmap"
                  ? `${searchIndex + 1}/${matchedIds.size}`
                  : `${matchedIds.size} kết quả`
                : "0 kết quả"}
            </span>
          )}
        </div>

        {/* Right side: hint + zoom (desktop; phones get floating zoom buttons) */}
        <div className="ml-auto hidden shrink-0 items-center gap-3 md:flex">
          {viewMode === "diagram" && (
            <span className="hidden text-xs text-gray-400 whitespace-nowrap lg:inline">
              {"Kéo để di chuyển · Cuộn để zoom"}
            </span>
          )}
          {zoomControls}
        </div>
      </div>
    </div>
  );

  return (
    <div className="tree-viewport relative w-full overflow-hidden rounded-xl border border-gray-200 bg-[#faf9f6]">
      {/* ===== FOCUS MODE (mobile-first) ===== */}
      {viewMode === "focus" && (
        <>
          {renderToolbar()}
          <FocusExplorer
            index={index}
            focusId={focusId}
            onFocus={setFocus}
            onMemberClick={setSelectedMember}
            searchActive={searchActive}
            matchedIds={matchedIds}
            onSelectResult={handleSelectResult}
            topOffset={toolbarH}
          />
        </>
      )}

      {/* ===== DIAGRAM MODE ===== */}
      {viewMode === "diagram" && (
        <TransformWrapper
          initialScale={defaultViewMode === "focus" ? 0.45 : 0.7}
          minScale={0.15}
          maxScale={2}
          centerOnInit={true}
          limitToBounds={false}
        >
          {renderToolbar(<ZoomControls />)}
          <div className="absolute bottom-3 right-3 z-20 md:hidden">
            <ZoomControls vertical />
          </div>
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <div className="flex min-h-full min-w-max items-start justify-center p-20 pt-32 md:pt-24">
              <TreeBranch
                node={tree}
                onMemberClick={setSelectedMember}
                maxLevel={maxLevel}
                matchedIds={matchedIds}
                expandedForSearch={expandedForSearch}
                searchActive={searchActive}
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      )}

      {/* ===== MINDMAP / LIST MODE ===== */}
      {viewMode === "mindmap" && (
        <>
          {renderToolbar()}
          <div
            ref={mindmapScrollRef}
            className="h-full overflow-y-auto overscroll-contain px-2 pb-6 sm:px-3"
            style={{ paddingTop: toolbarH + 8 }}
          >
            <MindmapBranch
              node={tree}
              onMemberClick={setSelectedMember}
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
          onExplore={viewMode === "focus" ? undefined : handleExplore}
        />
      )}
    </div>
  );
}
