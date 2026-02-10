import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
  spouses?: Array<{
    fullName: string;
    gender: "male" | "female";
    birthDate?: string;
    birthDateType?: "solar" | "lunar";
    deathDate?: string;
    deathDateType?: "solar" | "lunar";
    isAlive?: boolean;
    occupation?: string;
    address?: string;
    notes?: string;
    marriageDate?: string;
    orderIndex?: number;
  }>;
  children?: ImportMember[];
}

interface ImportData {
  familyName?: string;
  root: ImportMember;
}

async function importMember(
  data: ImportMember,
  parentId: string | null,
  generation: number,
  relationshipType: string = "biological"
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
    },
  });

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

  // Create spouses and marriages
  if (data.spouses) {
    for (const spouseData of data.spouses) {
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
          notes: spouseData.notes || null,
        },
      });

      await prisma.marriage.create({
        data: {
          spouse1Id: member.id,
          spouse2Id: spouse.id,
          marriageDate: spouseData.marriageDate || null,
          orderIndex: spouseData.orderIndex || 1,
        },
      });
    }
  }

  // Recursively create children
  if (data.children) {
    for (const childData of data.children) {
      const childRelType = childData.notes?.includes("con nuôi")
        ? "adopted"
        : "biological";
      await importMember(childData, member.id, generation + 1, childRelType);
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
    await importMember(body.root, null, 1);

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
