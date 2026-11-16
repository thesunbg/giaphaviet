import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const albums = await prisma.album.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      photos: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { url: true },
      },
      _count: { select: { photos: true } },
    },
  });

  const loosePhotos = await prisma.photo.count({ where: { albumId: null } });

  return NextResponse.json({
    data: albums.map((album) => ({
      id: album.id,
      name: album.name,
      description: album.description,
      eventDate: album.eventDate,
      coverUrl: album.coverUrl || album.photos[0]?.url || null,
      photoCount: album._count.photos,
      createdAt: album.createdAt,
      createdBy: album.createdBy,
    })),
    loosePhotos,
    currentUserId: user.id,
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Vui lòng nhập tên album" }, { status: 400 });
  }

  const album = await prisma.album.create({
    data: {
      name,
      description: body.description ? String(body.description).trim() : null,
      eventDate: body.eventDate ? String(body.eventDate).trim() : null,
      createdById: user.id,
    },
  });

  return NextResponse.json({ data: album }, { status: 201 });
}
