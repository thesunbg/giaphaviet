import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { commentId } = await params;
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment) {
    return NextResponse.json({ error: "Không tìm thấy bình luận" }, { status: 404 });
  }

  if (comment.authorId !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ người viết hoặc quản trị mới xóa được bình luận" },
      { status: 403 }
    );
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
