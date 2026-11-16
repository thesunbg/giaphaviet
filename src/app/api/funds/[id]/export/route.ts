import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

const METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

/** Xuất sổ đóng góp ra CSV để mở bằng Excel */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: {
      contributions: {
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
        include: { member: { select: { fullName: true, generation: true } } },
      },
    },
  });

  if (!fund) {
    return NextResponse.json({ error: "Không tìm thấy đợt đóng góp" }, { status: 404 });
  }

  const escape = (value: unknown) =>
    `"${(value === null || value === undefined ? "" : String(value)).replace(/"/g, '""')}"`;

  const headers = ["STT", "Họ tên", "Đời", "Số tiền (VNĐ)", "Ngày đóng", "Hình thức", "Ghi chú"];

  const rows = fund.contributions.map((c, index) =>
    [
      index + 1,
      c.contributorName,
      c.member?.generation ?? "",
      c.amount,
      c.paidAt || "",
      c.method ? METHOD_LABELS[c.method] || c.method : "",
      c.note || "",
    ]
      .map(escape)
      .join(",")
  );

  const total = fund.contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalRow = ["", "TỔNG CỘNG", "", total, "", "", `${fund.contributions.length} lượt đóng`]
    .map(escape)
    .join(",");

  const csv =
    "﻿" +
    [
      escape(fund.name),
      "",
      headers.map(escape).join(","),
      ...rows,
      totalRow,
    ].join("\r\n");

  const slug = fund.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dong-gop-${slug || "quy-ho"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
