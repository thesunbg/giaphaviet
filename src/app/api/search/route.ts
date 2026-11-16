import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/user-auth";
import { searchMembers } from "@/lib/search";

export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để tiếp tục." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") || "";
  const limit = Math.max(1, Math.min(Number(request.nextUrl.searchParams.get("limit")) || 30, 100));

  if (query.trim().length === 0) {
    return NextResponse.json({ data: [], query });
  }

  const data = await searchMembers(query, limit);
  return NextResponse.json({ data, query, total: data.length });
}
