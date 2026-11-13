import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const cursor = request.nextUrl.searchParams.get("cursor");

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      onBehalfOf: { select: { id: true, fullName: true, generation: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
      reactions: { select: { userId: true, emoji: true } },
    },
  });

  const hasMore = posts.length > PAGE_SIZE;
  const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  return NextResponse.json({
    data: page.map((post) => ({
      ...post,
      reactionCount: post.reactions.length,
      reactedByMe: post.reactions.some((r) => r.userId === user.id),
      reactions: undefined,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
    currentUserId: user.id,
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await request.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  const images: string[] = Array.isArray(body.images)
    ? body.images.filter((url: unknown) => typeof url === "string").slice(0, 10)
    : [];

  if (!content && images.length === 0) {
    return NextResponse.json(
      { error: "Vui lòng nhập nội dung hoặc chọn ảnh" },
      { status: 400 }
    );
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: "Nội dung quá dài (tối đa 5000 ký tự)" }, { status: 400 });
  }

  // Chỉ quản trị/biên tập mới đăng được thông báo ghim lên đầu
  const isAnnouncement = body.type === "announcement" && user.role !== "member";

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      content,
      images,
      type: isAnnouncement ? "announcement" : "post",
      pinned: isAnnouncement && Boolean(body.pinned),
      onBehalfOfMemberId: body.onBehalfOfMemberId || null,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      onBehalfOf: { select: { id: true, fullName: true, generation: true } },
      comments: true,
    },
  });

  return NextResponse.json(
    { data: { ...post, reactionCount: 0, reactedByMe: false } },
    { status: 201 }
  );
}
