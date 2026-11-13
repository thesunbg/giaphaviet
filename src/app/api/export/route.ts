import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { buildExportData, buildMembersCsv } from "@/lib/export-builder";

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}`;
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const format = (request.nextUrl.searchParams.get("format") || "json").toLowerCase();
  // ?download=0 để xem trước trong trang quản trị, mặc định là tải file
  const download = request.nextUrl.searchParams.get("download") !== "0";

  try {
    if (format === "csv") {
      const csv = await buildMembersCsv();
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="gia-pha-${timestamp()}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (format !== "json") {
      return NextResponse.json(
        { error: "Định dạng không hỗ trợ. Chỉ nhận 'json' hoặc 'csv'." },
        { status: 400 }
      );
    }

    const data = await buildExportData();
    if (!data) {
      return NextResponse.json(
        { error: "Chưa có dữ liệu gia phả để export." },
        { status: 404 }
      );
    }

    const json = JSON.stringify(data, null, 2);
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    };
    if (download) {
      headers["Content-Disposition"] = `attachment; filename="gia-pha-${timestamp()}.json"`;
    }

    return new NextResponse(json, { headers });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      {
        error: `Lỗi khi export: ${err instanceof Error ? err.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
