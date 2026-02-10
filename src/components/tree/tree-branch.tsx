"use client";

import { useState, useEffect, useRef } from "react";
import { TreeNodeCard } from "./tree-node";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TreeNode } from "@/types/tree";
import type { MemberData } from "@/types/member";

interface TreeBranchProps {
  node: TreeNode;
  depth?: number;
  onMemberClick: (member: MemberData) => void;
  maxLevel?: number;
  matchedIds?: Set<string>;
  expandedForSearch?: Set<string>;
  searchActive?: boolean;
}

export function TreeBranch({
  node,
  depth = 0,
  onMemberClick,
  maxLevel = 0,
  matchedIds = new Set(),
  expandedForSearch = new Set(),
  searchActive = false,
}: TreeBranchProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const prevSearchActiveRef = useRef(searchActive);

  // Auto-expand when search finds results in descendants
  useEffect(() => {
    if (searchActive && expandedForSearch.has(node.member.id)) {
      setIsExpanded(true);
    }
    // When search is cleared, restore to expanded (default)
    if (prevSearchActiveRef.current && !searchActive) {
      setIsExpanded(true);
    }
    prevSearchActiveRef.current = searchActive;
  }, [searchActive, expandedForSearch, node.member.id]);

  const hasChildren = node.children.length > 0;

  // If maxLevel is set and we're at or beyond the limit, don't show children
  const levelLimited = maxLevel > 0 && node.generation >= maxLevel;
  const showChildren = hasChildren && isExpanded && !levelLimited;

  // Determine if this node or its spouses are highlighted by search
  const isNodeHighlighted = searchActive && matchedIds.has(node.member.id);
  const highlightedSpouseIds = new Set<string>();
  if (searchActive) {
    for (const spouse of node.spouses) {
      if (matchedIds.has(spouse.member.id)) {
        highlightedSpouseIds.add(spouse.member.id);
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Spouse pair */}
      <div className="flex items-center gap-1">
        <TreeNodeCard
          member={node.member}
          onClick={onMemberClick}
          isHighlighted={isNodeHighlighted}
        />
        {node.spouses.map((spouse) => (
          <div key={spouse.member.id} className="flex items-center gap-1">
            <div className="tree-spouse-connector" />
            <TreeNodeCard
              member={spouse.member}
              onClick={onMemberClick}
              isHighlighted={highlightedSpouseIds.has(spouse.member.id)}
            />
          </div>
        ))}
      </div>

      {/* Expand/collapse toggle */}
      {hasChildren && !levelLimited && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8b4513] text-white hover:bg-[#6d350f] transition-colors cursor-pointer z-10"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Level limit indicator */}
      {hasChildren && levelLimited && (
        <div className="mt-1 flex h-6 items-center justify-center rounded-full bg-gray-300 px-2 text-[10px] text-gray-600">
          +{node.children.length}
        </div>
      )}

      {/* Children */}
      {showChildren && (
        <>
          {/* Vertical line from toggle to horizontal bar */}
          <div className="tree-connector-v h-6" />

          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <div className="tree-connector-h self-stretch mx-auto" style={{
              width: `${Math.max(50, (node.children.length - 1) * 50)}%`,
              maxWidth: '90%',
            }} />
          )}

          {/* Children row */}
          <div className="flex items-start gap-6">
            {node.children.map((child) => (
              <div key={child.member.id} className="flex flex-col items-center">
                <div className="tree-connector-v h-6" />
                <TreeBranch
                  node={child}
                  depth={depth + 1}
                  onMemberClick={onMemberClick}
                  maxLevel={maxLevel}
                  matchedIds={matchedIds}
                  expandedForSearch={expandedForSearch}
                  searchActive={searchActive}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
