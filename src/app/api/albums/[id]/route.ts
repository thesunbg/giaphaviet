import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      photos: {
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, fullName: true } },
          uploadedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!album) {
    return NextResponse.json({ error: "Không tìm thấy album" }, { status: 404 });
  }

  return NextResponse.json({ data: album, currentUserId: user.id, role: user.role });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const album = await prisma.album.findUnique({ where: { id } });
  if (!album) {
    return NextResponse.json({ error: "Không tìm thấy album" }, { status: 404 });
  }

  if (album.createdById !== user.id && user.role === "member") {
    return NextResponse.json(
      { error: "Chỉ người tạo album hoặc quản trị mới sửa được" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Tên album không được để trống" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.description !== undefined) data.description = body.description || null;
  if (body.eventDate !== undefined) data.eventDate = body.eventDate || null;
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl || null;

  const updated = await prisma.album.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: { _count: { select: { photos: true } } },
  });

  if (!album) {
    return NextResponse.json({ error: "Không tìm thấy album" }, { status: 404 });
  }

  if (album.createdById !== user.id && user.role === "member") {
    return NextResponse.json(
      { error: "Chỉ người tạo album hoặc quản trị mới xóa được" },
      { status: 403 }
    );
  }

  // Xóa album không xóa ảnh: ảnh quay về mục "Ảnh lẻ"
  await prisma.album.delete({ where: { id } });

  return NextResponse.json({ success: true, releasedPhotos: album._count.photos });
}
