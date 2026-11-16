import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import crypto from "crypto";
import { requireUser } from "@/lib/user-auth";
import { ensureUploadDir, ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE } from "@/lib/uploads";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  // Mọi tài khoản đã đăng nhập đều được tải ảnh lên (feed, album ảnh)
  const user = await requireUser();
  if (user instanceof Response) return user;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Không có file được tải lên" }, { status: 400 });
  }

  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "File quá lớn. Tối đa 5MB." }, { status: 400 });
  }

  // Phần mở rộng lấy theo loại file thật, không tin tên file người dùng gửi lên
  const ext = EXT_BY_TYPE[file.type] || "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const dir = await ensureUploadDir();
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      {
        error:
          "Không lưu được ảnh trên máy chủ. Kiểm tra quyền ghi của thư mục lưu ảnh (UPLOAD_DIR).",
      },
      { status: 500 }
    );
  }

  // Ảnh được phục vụ qua /api/uploads (xem rewrites trong next.config.ts)
  return NextResponse.json({ url: `/uploads/${filename}` });
}
