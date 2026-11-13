import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const content = String(body.content || "").trim();

  if (!content) {
    return NextResponse.json({ error: "Vui lòng nhập nội dung bình luận" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Bình luận quá dài" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: { postId: id, authorId: user.id, content },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
