import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TreeNode } from "@/types/tree";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr;
}

export function getCalendarLabel(type: string | null | undefined): string {
  return type === "lunar" ? "Âm lịch" : "Dương lịch";
}

export function getCalendarEmoji(type: string | null | undefined): string {
  return type === "lunar" ? "🌙" : "☀️";
}

export function getLifeSpan(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
  isAlive: boolean
): string {
  const birth = birthDate || "?";
  if (!isAlive && deathDate) {
    return `${birth} - ${deathDate}`;
  }
  if (!isAlive) {
    return `${birth} - ?`;
  }
  return birth;
}

/**
 * Search tree recursively for members whose fullName matches query.
 * Returns Set of matching member IDs (including spouses).
 */
export function searchTree(node: TreeNode, query: string): Set<string> {
  const matched = new Set<string>();
  const q = query.toLowerCase().trim();
  if (!q) return matched;

  function traverse(n: TreeNode) {
    if (n.member.fullName.toLowerCase().includes(q)) {
      matched.add(n.member.id);
    }
    // Also search spouses
    for (const spouse of n.spouses) {
      if (spouse.member.fullName.toLowerCase().includes(q)) {
        matched.add(spouse.member.id);
      }
    }
    for (const child of n.children) {
      traverse(child);
    }
  }

  traverse(node);
  return matched;
}

/**
 * Find all node IDs that are ancestors of matched nodes (for auto-expand).
 * Returns Set of member IDs that should be expanded.
 */
export function findExpandedIds(node: TreeNode, matchedIds: Set<string>): Set<string> {
  const expandIds = new Set<string>();

  function traverse(n: TreeNode): boolean {
    // Check if this node or its spouses match
    let hasMatch = matchedIds.has(n.member.id);
    for (const spouse of n.spouses) {
      if (matchedIds.has(spouse.member.id)) {
        hasMatch = true;
      }
    }

    // Check descendants
    for (const child of n.children) {
      if (traverse(child)) {
        hasMatch = true;
      }
    }

    if (hasMatch) {
      expandIds.add(n.member.id);
    }

    return hasMatch;
  }

  traverse(node);
  return expandIds;
}
