import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberSchema } from "@/lib/validators";
import { requireEditor } from "@/lib/user-auth";
import { foldVietnamese } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const generation = searchParams.get("generation");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (generation) {
    where.generation = parseInt(generation);
  }

  // Tìm theo tên: bỏ dấu, không phân biệt hoa/thường ("nguyen van do" ra "Nguyễn Văn Đô").
  // Lọc trong bộ nhớ vì số thành viên của một dòng họ không lớn.
  if (search.trim()) {
    const all = await prisma.member.findMany({
      where,
      orderBy: [{ generation: "asc" }, { birthOrder: "asc" }],
    });
    const needle = foldVietnamese(search);
    const matched = all.filter((m) => foldVietnamese(m.fullName).includes(needle));

    return NextResponse.json({
      data: matched.slice((page - 1) * limit, page * limit),
      total: matched.length,
      page,
      limit,
    });
  }

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: [{ generation: "asc" }, { birthOrder: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

export async function POST(request: NextRequest) {
  const authError = await requireEditor();
  if (authError) return authError;

  const body = await request.json();
  const parsed = memberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const member = await prisma.member.create({
    data: parsed.data,
  });

  return NextResponse.json({ data: member }, { status: 201 });
}
