import { NextResponse } from "next/server";
import { buildFamilyTree } from "@/lib/tree-builder";

export async function GET() {
  const tree = await buildFamilyTree();

  if (!tree) {
    return NextResponse.json({ data: null, message: "Chưa có dữ liệu gia phả" });
  }

  return NextResponse.json({ data: tree });
}
