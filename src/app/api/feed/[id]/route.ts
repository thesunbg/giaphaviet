import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  // Ghim bài: chỉ quản trị / biên tập
  if (body.pinned !== undefined) {
    if (user.role === "member") {
      return NextResponse.json({ error: "Bạn không có quyền ghim bài" }, { status: 403 });
    }
    data.pinned = Boolean(body.pinned);
  }

  // Sửa nội dung: chỉ tác giả
  if (body.content !== undefined) {
    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "Chỉ tác giả mới sửa được bài" }, { status: 403 });
    }
    data.content = String(body.content).trim();
  }

  const updated = await prisma.post.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });
  }

  if (post.authorId !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ tác giả hoặc quản trị mới xóa được bài" },
      { status: 403 }
    );
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
