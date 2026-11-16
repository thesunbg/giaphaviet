import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Next.js chỉ phục vụ file có trong public từ lúc build, nên ảnh tải lên
        // lúc chạy được đọc từ đĩa qua API. Giữ nguyên đường dẫn /uploads/... để
        // ảnh đã lưu trong cơ sở dữ liệu vẫn xem được.
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
