import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, isEditor } from "@/lib/user-auth";

interface IncomingRow {
  contributorName?: string;
  memberId?: string | null;
  amount?: number | string;
  paidAt?: string | null;
  method?: string | null;
  note?: string | null;
}

/** "1.500.000", "1,500,000", "1500000 đ" -> 1500000 */
function parseAmount(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input) : null;
  const digits = String(input ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Thêm một hoặc nhiều dòng vào sổ đóng góp.
 * Nhận {rows: [...]} để dán nhiều dòng từ Excel cùng lúc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (!(await isEditor())) {
    return NextResponse.json(
      { error: "Chỉ quản trị hoặc biên tập mới ghi sổ được." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const fund = await prisma.fund.findUnique({ where: { id } });
  if (!fund) {
    return NextResponse.json({ error: "Không tìm thấy đợt đóng góp" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const rows: IncomingRow[] = Array.isArray(body.rows) ? body.rows : [body];

  const prepared: {
    fundId: string;
    memberId: string | null;
    contributorName: string;
    amount: number;
    paidAt: string | null;
    method: string | null;
    note: string | null;
    recordedById: string;
  }[] = [];
  const errors: string[] = [];

  rows.slice(0, 500).forEach((row, index) => {
    const name = String(row.contributorName || "").trim();
    const amount = parseAmount(row.amount);

    if (!name) {
      errors.push(`Dòng ${index + 1}: thiếu họ tên`);
      return;
    }
    if (amount === null || amount <= 0) {
      errors.push(`Dòng ${index + 1} (${name}): số tiền không hợp lệ`);
      return;
    }

    prepared.push({
      fundId: id,
      memberId: row.memberId || null,
      contributorName: name,
      amount,
      paidAt: row.paidAt ? String(row.paidAt).trim() : null,
      method: row.method === "transfer" ? "transfer" : row.method === "cash" ? "cash" : null,
      note: row.note ? String(row.note).trim() : null,
      recordedById: user.id,
    });
  });

  if (prepared.length === 0) {
    return NextResponse.json(
      { error: errors[0] || "Không có dòng nào hợp lệ", errors },
      { status: 400 }
    );
  }

  await prisma.contribution.createMany({ data: prepared });

  return NextResponse.json(
    { success: true, inserted: prepared.length, errors },
    { status: 201 }
  );
}
