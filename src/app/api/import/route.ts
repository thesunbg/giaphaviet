import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

interface ImportEvent {
  title: string;
  date?: string;
  calendarType?: "solar" | "lunar";
  description?: string;
}

interface ImportSpouse {
  fullName: string;
  gender: "male" | "female";
  birthDate?: string;
  birthDateType?: "solar" | "lunar";
  deathDate?: string;
  deathDateType?: "solar" | "lunar";
  isAlive?: boolean;
  occupation?: string;
  address?: string;
  biography?: string;
  graveInfo?: string;
  deathAnniversary?: string;
  deathAnniversaryType?: "solar" | "lunar";
  notes?: string;
  photoUrl?: string;
  events?: ImportEvent[];
  marriageDate?: string;
  divorceDate?: string;
  isActive?: boolean;
  orderIndex?: number;
}

interface ImportMember {
  fullName: string;
  gender: "male" | "female";
  generation: number;
  birthOrder: number;
  birthDate?: string;
  birthDateType?: "solar" | "lunar";
  deathDate?: string;
  deathDateType?: "solar" | "lunar";
  isAlive?: boolean;
  occupation?: string;
  address?: string;
  biography?: string;
  graveInfo?: string;
  deathAnniversary?: string;
  deathAnniversaryType?: "solar" | "lunar";
  notes?: string;
  photoUrl?: string;
  events?: ImportEvent[];
  /** Quan hệ với cha/mẹ: biological | adopted | step */
  relationshipType?: string;
  /** orderIndex của các vợ/chồng (trong `spouses` của cha/mẹ) cũng là cha/mẹ của người này */
  otherParents?: number[];
  spouses?: ImportSpouse[];
  children?: ImportMember[];
}

interface ImportData {
  familyName?: string;
  root: ImportMember;
  /** Các nhánh rời không nối với cụ tổ (do trang Export sinh ra) */
  otherRoots?: ImportMember[];
}

const VALID_REL_TYPES = ["biological", "adopted", "step"];

async function createEvents(memberId: string, events?: ImportEvent[]) {
  if (!events?.length) return;
  for (const event of events) {
    if (!event?.title) continue;
    await prisma.event.create({
      data: {
        memberId,
        title: event.title,
        date: event.date || null,
        calendarType: event.calendarType || "solar",
        description: event.description || null,
      },
    });
  }
}

async function importMember(
  data: ImportMember,
  parentId: string | null,
  generation: number,
  relationshipType: string = "biological",
  /** orderIndex -> id của vợ/chồng của cha/mẹ, để dựng quan hệ với mẹ */
  parentSpouseIds: Map<number, string> = new Map()
): Promise<void> {
  // Create the member
  const member = await prisma.member.create({
    data: {
      fullName: data.fullName,
      gender: data.gender,
      generation,
      birthOrder: data.birthOrder || 1,
      birthDate: data.birthDate || null,
      birthDateType: data.birthDateType || "solar",
      deathDate: data.deathDate || null,
      deathDateType: data.deathDateType || "solar",
      isAlive: data.isAlive ?? true,
      occupation: data.occupation || null,
      address: data.address || null,
      biography: data.biography || null,
      graveInfo: data.graveInfo || null,
      deathAnniversary: data.deathAnniversary || null,
      deathAnniversaryType: data.deathAnniversaryType || "lunar",
      notes: data.notes || null,
      photoUrl: data.photoUrl || null,
    },
  });

  await createEvents(member.id, data.events);

  // Create parent-child relationship
  if (parentId) {
    await prisma.parentChild.create({
      data: {
        parentId,
        childId: member.id,
        relationshipType,
      },
    });
  }

  // Quan hệ với cha/mẹ còn lại (vợ/chồng của node cha/mẹ)
  if (Array.isArray(data.otherParents)) {
    for (const orderIndex of data.otherParents) {
      const otherParentId = parentSpouseIds.get(Number(orderIndex));
      if (otherParentId && otherParentId !== parentId) {
        await prisma.parentChild.create({
          data: {
            parentId: otherParentId,
            childId: member.id,
            relationshipType,
          },
        });
      }
    }
  }

  // Create spouses and marriages
  const spouseIdsByOrder = new Map<number, string>();
  if (data.spouses) {
    for (const [index, spouseData] of data.spouses.entries()) {
      const spouse = await prisma.member.create({
        data: {
          fullName: spouseData.fullName,
          gender: spouseData.gender,
          generation,
          birthOrder: 1,
          birthDate: spouseData.birthDate || null,
          birthDateType: spouseData.birthDateType || "solar",
          deathDate: spouseData.deathDate || null,
          deathDateType: spouseData.deathDateType || "solar",
          isAlive: spouseData.isAlive ?? true,
          occupation: spouseData.occupation || null,
          address: spouseData.address || null,
          biography: spouseData.biography || null,
          graveInfo: spouseData.graveInfo || null,
          deathAnniversary: spouseData.deathAnniversary || null,
          deathAnniversaryType: spouseData.deathAnniversaryType || "lunar",
          notes: spouseData.notes || null,
          photoUrl: spouseData.photoUrl || null,
        },
      });

      await createEvents(spouse.id, spouseData.events);

      const orderIndex = spouseData.orderIndex || index + 1;
      spouseIdsByOrder.set(orderIndex, spouse.id);

      await prisma.marriage.create({
        data: {
          spouse1Id: member.id,
          spouse2Id: spouse.id,
          marriageDate: spouseData.marriageDate || null,
          divorceDate: spouseData.divorceDate || null,
          isActive: spouseData.isActive ?? true,
          orderIndex,
        },
      });
    }
  }

  // Recursively create children
  if (data.children) {
    for (const childData of data.children) {
      // Ưu tiên trường relationshipType (file export), nếu không có thì suy ra từ ghi chú
      const childRelType =
        childData.relationshipType && VALID_REL_TYPES.includes(childData.relationshipType)
          ? childData.relationshipType
          : childData.notes?.includes("con nuôi")
            ? "adopted"
            : "biological";
      await importMember(
        childData,
        member.id,
        generation + 1,
        childRelType,
        spouseIdsByOrder
      );
    }
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body: ImportData = await request.json();

    if (!body.root || !body.root.fullName) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ. Cần có trường 'root' với 'fullName'." },
        { status: 400 }
      );
    }

    // Clear existing data
    await prisma.photo.deleteMany();
    await prisma.event.deleteMany();
    await prisma.parentChild.deleteMany();
    await prisma.marriage.deleteMany();
    await prisma.member.deleteMany();

    // Import the tree
    await importMember(body.root, null, body.root.generation || 1);

    // Import các nhánh rời (nếu file export có)
    if (Array.isArray(body.otherRoots)) {
      for (const branch of body.otherRoots) {
        if (branch?.fullName) {
          await importMember(branch, null, branch.generation || 1);
        }
      }
    }

    const totalMembers = await prisma.member.count();
    const totalRelationships = await prisma.parentChild.count();
    const totalMarriages = await prisma.marriage.count();

    return NextResponse.json({
      success: true,
      message: `Import thành công! ${totalMembers} thành viên, ${totalRelationships} quan hệ cha-con, ${totalMarriages} hôn nhân.`,
      stats: { totalMembers, totalRelationships, totalMarriages },
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: `Lỗi khi import: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
