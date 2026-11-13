import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

/** Bật/tắt thả tim cho một bài đăng */
export async function POST(
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

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId: id, userId: user.id } });
  }

  const reactionCount = await prisma.reaction.count({ where: { postId: id } });

  return NextResponse.json({ reactedByMe: !existing, reactionCount });
}
