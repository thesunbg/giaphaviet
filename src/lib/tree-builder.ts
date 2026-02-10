import { prisma } from "@/lib/prisma";
import type { MemberData } from "@/types/member";
import type { TreeNode, TreeSpouseInfo } from "@/types/tree";

function toMemberData(m: Record<string, unknown>): MemberData {
  return {
    id: m.id as string,
    fullName: m.fullName as string,
    birthDate: (m.birthDate as string) || null,
    birthDateType: (m.birthDateType as "solar" | "lunar") || "solar",
    deathDate: (m.deathDate as string) || null,
    deathDateType: (m.deathDateType as "solar" | "lunar") || "solar",
    isAlive: m.isAlive as boolean,
    gender: m.gender as "male" | "female",
    generation: m.generation as number,
    birthOrder: m.birthOrder as number,
    occupation: (m.occupation as string) || null,
    address: (m.address as string) || null,
    biography: (m.biography as string) || null,
    graveInfo: (m.graveInfo as string) || null,
    deathAnniversary: (m.deathAnniversary as string) || null,
    deathAnniversaryType: (m.deathAnniversaryType as "solar" | "lunar") || "lunar",
    notes: (m.notes as string) || null,
    photoUrl: (m.photoUrl as string) || null,
    createdAt: String(m.createdAt),
    updatedAt: String(m.updatedAt),
  };
}

export async function buildFamilyTree(): Promise<TreeNode | null> {
  const allMembers = await prisma.member.findMany();
  const allParentChild = await prisma.parentChild.findMany();
  const allMarriages = await prisma.marriage.findMany();

  const memberMap = new Map<string, MemberData>();
  allMembers.forEach((m) => memberMap.set(m.id, toMemberData(m)));

  // Build children lookup: parentId -> childIds (only unique by male/main parent line)
  const childrenOf = new Map<string, string[]>();
  const childHasParent = new Map<string, string>(); // track first parent assigned to avoid duplication

  allParentChild.forEach((pc) => {
    // Only add child under one parent node to avoid duplication in tree
    if (!childHasParent.has(pc.childId)) {
      childHasParent.set(pc.childId, pc.parentId);
      const existing = childrenOf.get(pc.parentId) || [];
      existing.push(pc.childId);
      childrenOf.set(pc.parentId, existing);
    }
  });

  // Build spouse lookup
  const spousesOf = new Map<string, TreeSpouseInfo[]>();
  allMarriages.forEach((m) => {
    const s1List = spousesOf.get(m.spouse1Id) || [];
    const spouse2Data = memberMap.get(m.spouse2Id);
    if (spouse2Data) {
      s1List.push({
        member: spouse2Data,
        marriageDate: m.marriageDate,
        orderIndex: m.orderIndex,
      });
    }
    spousesOf.set(m.spouse1Id, s1List);

    const s2List = spousesOf.get(m.spouse2Id) || [];
    const spouse1Data = memberMap.get(m.spouse1Id);
    if (spouse1Data) {
      s2List.push({
        member: spouse1Data,
        marriageDate: m.marriageDate,
        orderIndex: m.orderIndex,
      });
    }
    spousesOf.set(m.spouse2Id, s2List);
  });

  // Relationship types lookup
  const relTypeMap = new Map<string, string>();
  allParentChild.forEach((pc) => {
    relTypeMap.set(`${pc.parentId}-${pc.childId}`, pc.relationshipType);
  });

  // Find root ancestor (generation 1, preferably male)
  const gen1Members = allMembers
    .filter((m) => m.generation === 1)
    .sort((a, b) => {
      if (a.gender === "male" && b.gender !== "male") return -1;
      if (a.gender !== "male" && b.gender === "male") return 1;
      return a.birthOrder - b.birthOrder;
    });

  if (gen1Members.length === 0) return null;

  // Set of spouse IDs to exclude from being root
  const allSpouseIds = new Set<string>();
  allMarriages.forEach((m) => {
    allSpouseIds.add(m.spouse2Id);
  });

  const rootMember = gen1Members.find((m) => !allSpouseIds.has(m.id)) || gen1Members[0];

  // Build tree recursively
  function buildNode(memberId: string, visited: Set<string>): TreeNode | null {
    if (visited.has(memberId)) return null;
    visited.add(memberId);

    const member = memberMap.get(memberId);
    if (!member) return null;

    const spouses = (spousesOf.get(memberId) || []).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );

    const childIds = childrenOf.get(memberId) || [];
    // Also collect children from spouses
    spouses.forEach((s) => {
      const spouseChildren = childrenOf.get(s.member.id) || [];
      spouseChildren.forEach((cid) => {
        if (!childIds.includes(cid)) {
          childIds.push(cid);
        }
      });
    });

    const children = childIds
      .map((cid) => {
        const childMember = memberMap.get(cid);
        return childMember ? { id: cid, birthOrder: childMember.birthOrder } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.birthOrder - b!.birthOrder)
      .map((c) => buildNode(c!.id, new Set(visited)))
      .filter(Boolean) as TreeNode[];

    return {
      member,
      spouses,
      children,
      generation: member.generation,
    };
  }

  return buildNode(rootMember.id, new Set());
}
