import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth";

/** Mã 6 chữ số, dễ đọc qua điện thoại cho các cụ */
function generateViewCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const codes = await prisma.viewAccessCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: codes });
}

/** Tạo mã xem mới (có thể tạo nhiều mã, ví dụ mỗi chi một mã) */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));

  let code = generateViewCode();
  for (let i = 0; i < 10; i++) {
    const existing = await prisma.viewAccessCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateViewCode();
  }

  const created = await prisma.viewAccessCode.create({
    data: {
      code,
      label: body.label ? String(body.label).trim() : null,
      isActive: true,
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
