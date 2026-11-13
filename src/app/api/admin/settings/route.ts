import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth";
import { getSiteSettings } from "@/lib/settings";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({ data: await getSiteSettings() });
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const familyName = String(body.familyName || "").trim();

  if (!familyName) {
    return NextResponse.json({ error: "Vui lòng nhập tên dòng họ" }, { status: 400 });
  }

  const data = {
    familyName,
    treeTitle: body.treeTitle ? String(body.treeTitle).trim() : null,
    ancestralHome: body.ancestralHome ? String(body.ancestralHome).trim() : null,
    address: body.address ? String(body.address).trim() : null,
    description: body.description ? String(body.description).trim() : null,
    contactPhone: body.contactPhone ? String(body.contactPhone).trim() : null,
  };

  const saved = await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return NextResponse.json({ data: saved });
}
