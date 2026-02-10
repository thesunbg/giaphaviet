"use client";

import { useState, useEffect, useRef } from "react";
import { MindmapNode } from "./mindmap-node";
import type { TreeNode } from "@/types/tree";
import type { MemberData } from "@/types/member";

interface MindmapBranchProps {
  node: TreeNode;
  depth?: number;
  onMemberClick: (member: MemberData) => void;
  maxLevel?: number;
  matchedIds?: Set<string>;
  expandedForSearch?: Set<string>;
  searchActive?: boolean;
}

export function MindmapBranch({
  node,
  depth = 0,
  onMemberClick,
  maxLevel = 0,
  matchedIds = new Set(),
  expandedForSearch = new Set(),
  searchActive = false,
}: MindmapBranchProps) {
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
  const levelLimited = maxLevel > 0 && node.generation >= maxLevel;
  const showChildren = hasChildren && isExpanded && !levelLimited;

  // Determine highlighting
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
    <div>
      {/* This node */}
      <MindmapNode
        member={node.member}
        spouses={node.spouses}
        isHighlighted={isNodeHighlighted}
        highlightedSpouseIds={highlightedSpouseIds}
        onClick={onMemberClick}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        childCount={node.children.length}
        levelLimited={levelLimited}
      />

      {/* Children with indent lines */}
      {showChildren && (
        <div className="mindmap-branch">
          {node.children.map((child) => (
            <div key={child.member.id} className="mindmap-branch-item">
              <MindmapBranch
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
      )}
    </div>
  );
}
