import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/user-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const photo = await prisma.photo.findUnique({ where: { id } });

  if (!photo) {
    return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
  }

  if (photo.uploadedById !== user.id && user.role === "member") {
    return NextResponse.json(
      { error: "Chỉ người đăng, biên tập hoặc quản trị mới xóa được ảnh" },
      { status: 403 }
    );
  }

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
