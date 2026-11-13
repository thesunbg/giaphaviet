import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

/** Album ảnh chung của dòng họ */
export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const memberId = request.nextUrl.searchParams.get("memberId");

  const photos = await prisma.photo.findMany({
    where: memberId ? { memberId } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      member: { select: { id: true, fullName: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: photos, currentUserId: user.id });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await request.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body.urls)
    ? body.urls.filter((u: unknown) => typeof u === "string")
    : body.url
      ? [String(body.url)]
      : [];

  if (urls.length === 0) {
    return NextResponse.json({ error: "Chưa có ảnh nào được tải lên" }, { status: 400 });
  }

  const created = await Promise.all(
    urls.slice(0, 20).map((url) =>
      prisma.photo.create({
        data: {
          url,
          caption: body.caption ? String(body.caption).trim() : null,
          memberId: body.memberId || null,
          takenAt: body.takenAt ? String(body.takenAt).trim() : null,
          uploadedById: user.id,
        },
      })
    )
  );

  return NextResponse.json({ data: created }, { status: 201 });
}
