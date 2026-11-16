import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getViewer } from "@/lib/user-auth";
import { getUploadDir, safeFileName, contentTypeOf } from "@/lib/uploads";

/**
 * Phục vụ ảnh đã tải lên.
 *
 * Next.js chỉ phục vụ file có trong `public` từ lúc build, nên ảnh tải lên lúc
 * chạy phải đọc trực tiếp từ đĩa. Đường dẫn `/uploads/...` được chuyển về đây
 * (xem rewrites trong next.config.ts) nên các ảnh cũ vẫn xem được.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để xem ảnh." }, { status: 401 });
  }

  const { path: segments } = await params;
  if (!segments || segments.length !== 1) {
    return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
  }

  const fileName = safeFileName(segments[0]);
  if (!fileName) {
    return NextResponse.json({ error: "Tên file không hợp lệ" }, { status: 400 });
  }

  const filePath = path.join(getUploadDir(), fileName);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");

    const file = await readFile(filePath);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypeOf(fileName),
        "Content-Length": String(info.size),
        // Tên file có mã ngẫu nhiên nên nội dung không đổi -> cho trình duyệt nhớ
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
  }
}
