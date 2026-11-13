"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Bắt mọi lỗi phía máy chủ (kể cả lỗi trong layout gốc, ví dụ không kết nối
 * được cơ sở dữ liệu) để không hiện màn hình trắng "Application error".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi ứng dụng:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="antialiased">
        <div
          style={{ minHeight: "100dvh" }}
          className="flex items-center justify-center bg-[#faf9f6] p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
              ⚠️
            </div>

            <h1 className="mb-2 text-xl font-bold text-gray-900">Không tải được trang</h1>
            <p className="mb-6 text-sm text-gray-600">
              Máy chủ gặp sự cố khi đọc dữ liệu gia phả. Vui lòng thử lại; nếu vẫn lỗi, hãy
              báo người quản trị website.
            </p>

            <button
              onClick={reset}
              className="cursor-pointer rounded-lg bg-[#8b4513] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#6d350f]"
            >
              Thử lại
            </button>

            <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-400">
              {error.digest && (
                <>
                  Mã lỗi: <span className="font-mono">{error.digest}</span>
                  <br />
                </>
              )}
              Quản trị: lỗi thường gặp sau khi deploy là chưa chạy{" "}
              <span className="font-mono">prisma migrate deploy</span> hoặc{" "}
              <span className="font-mono">DATABASE_URL</span> chưa trỏ đúng PostgreSQL. Xem
              log máy chủ để biết chi tiết.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
