import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TreeNode } from "@/types/tree";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Bỏ dấu tiếng Việt để tìm kiếm: "Nguyễn Văn Đô" -> "nguyen van do" */
export function foldVietnamese(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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
  const q = foldVietnamese(query);
  if (!q) return matched;

  function traverse(n: TreeNode) {
    if (foldVietnamese(n.member.fullName).includes(q)) {
      matched.add(n.member.id);
    }
    // Also search spouses
    for (const spouse of n.spouses) {
      if (foldVietnamese(spouse.member.fullName).includes(q)) {
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

/** Khoảng thời gian thân thiện: "vừa xong", "5 phút trước", "3 ngày trước" */
export function timeAgo(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
