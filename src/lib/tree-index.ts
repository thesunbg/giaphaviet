import type { TreeNode } from "@/types/tree";
import type { MemberData } from "@/types/member";

/**
 * Flat lookup structures built from the recursive TreeNode.
 * Used by the mobile Focus Explorer to navigate up/down without walking the tree.
 */
export interface TreeIndex {
  root: TreeNode;
  /** Bloodline node by member id */
  byId: Map<string, TreeNode>;
  /** Child node id -> its parent node */
  parentOf: Map<string, TreeNode>;
  /** Spouse member id -> the bloodline node they married into */
  hostOf: Map<string, TreeNode>;
  /** Node id -> number of descendants (all generations below) */
  descendantCount: Map<string, number>;
  /** Every member (bloodline + spouses) in depth-first order */
  members: MemberData[];
}

export function indexTree(root: TreeNode): TreeIndex {
  const byId = new Map<string, TreeNode>();
  const parentOf = new Map<string, TreeNode>();
  const hostOf = new Map<string, TreeNode>();
  const descendantCount = new Map<string, number>();
  const members: MemberData[] = [];

  function walk(node: TreeNode, parent: TreeNode | null): number {
    byId.set(node.member.id, node);
    members.push(node.member);
    if (parent) parentOf.set(node.member.id, parent);
    for (const s of node.spouses) {
      if (!hostOf.has(s.member.id)) {
        hostOf.set(s.member.id, node);
        members.push(s.member);
      }
    }
    let count = 0;
    for (const child of node.children) {
      count += 1 + walk(child, node);
    }
    descendantCount.set(node.member.id, count);
    return count;
  }

  walk(root, null);
  return { root, byId, parentOf, hostOf, descendantCount, members };
}

/** Ancestors of a node from root down to its direct parent (excludes the node itself). */
export function getAncestors(index: TreeIndex, id: string): TreeNode[] {
  const chain: TreeNode[] = [];
  let current = index.parentOf.get(id);
  while (current) {
    chain.unshift(current);
    current = index.parentOf.get(current.member.id);
  }
  return chain;
}

/** Resolve any member id (bloodline or spouse) to the bloodline node to focus on. */
export function resolveFocusNode(index: TreeIndex, memberId: string): TreeNode | null {
  return index.byId.get(memberId) ?? index.hostOf.get(memberId) ?? null;
}
