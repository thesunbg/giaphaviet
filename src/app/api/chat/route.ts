import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

const PAGE_SIZE = 50;

/**
 * Phòng chat chung của dòng họ.
 * GET ?after=<ISO>  -> chỉ lấy tin mới hơn mốc thời gian (dùng để hỏi lại định kỳ)
 * GET ?before=<ISO> -> tải thêm tin cũ hơn
 */
export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const after = request.nextUrl.searchParams.get("after");
  const before = request.nextUrl.searchParams.get("before");

  if (after) {
    const messages = await prisma.chatMessage.findMany({
      where: { createdAt: { gt: new Date(after) } },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return NextResponse.json({ data: messages, currentUserId: user.id });
  }

  const messages = await prisma.chatMessage.findMany({
    where: before ? { createdAt: { lt: new Date(before) } } : {},
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({
    data: messages.reverse(),
    hasMore: messages.length === PAGE_SIZE,
    currentUserId: user.id,
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await request.json().catch(() => ({}));
  const content = String(body.content || "").trim();

  if (!content) {
    return NextResponse.json({ error: "Tin nhắn trống" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Tin nhắn quá dài (tối đa 2000 ký tự)" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: { authorId: user.id, content },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ data: message }, { status: 201 });
}
