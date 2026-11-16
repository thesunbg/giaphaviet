import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isEditor } from "@/lib/user-auth";

/** Danh sách các đợt đóng góp kèm tổng thu */
export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const funds = await prisma.fund.findMany({
    orderBy: [{ isOpen: "desc" }, { year: "desc" }, { createdAt: "desc" }],
    include: {
      contributions: { select: { amount: true, memberId: true, contributorName: true } },
    },
  });

  return NextResponse.json({
    data: funds.map((fund) => ({
      id: fund.id,
      name: fund.name,
      description: fund.description,
      year: fund.year,
      targetAmount: fund.targetAmount,
      isOpen: fund.isOpen,
      createdAt: fund.createdAt,
      total: fund.contributions.reduce((sum, c) => sum + c.amount, 0),
      contributorCount: new Set(
        fund.contributions.map((c) => c.memberId || c.contributorName)
      ).size,
      entryCount: fund.contributions.length,
    })),
    canEdit: await isEditor(),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (!(await isEditor())) {
    return NextResponse.json(
      { error: "Chỉ quản trị hoặc biên tập mới tạo được đợt đóng góp." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Vui lòng nhập tên đợt đóng góp" }, { status: 400 });
  }

  const fund = await prisma.fund.create({
    data: {
      name,
      description: body.description ? String(body.description).trim() : null,
      year: body.year ? Number(body.year) : null,
      targetAmount: body.targetAmount ? Math.round(Number(body.targetAmount)) : null,
      createdById: user.id,
    },
  });

  return NextResponse.json({ data: fund }, { status: 201 });
}
