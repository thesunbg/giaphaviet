import Link from "next/link";
import { UserPlus, LogIn } from "lucide-react";

/**
 * Hiển thị khi người dùng vào khu vực tương tác nội bộ (bảng tin, ảnh, chat)
 * nhưng phiên hiện tại không gắn với một tài khoản thật:
 * - đăng nhập bằng mật khẩu quản trị cũ (/admin/login)
 * - hoặc đang dùng mã xem gia phả
 */
export function NeedAccount({
  feature,
  isLegacyAdmin,
}: {
  feature: string;
  isLegacyAdmin: boolean;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8b4513]/10">
          <UserPlus className="h-7 w-7 text-[#8b4513]" />
        </div>

        <h1 className="mb-2 text-lg font-bold text-gray-900">{feature} cần tài khoản cá nhân</h1>

        {isLegacyAdmin ? (
          <>
            <p className="mb-5 text-sm leading-relaxed text-gray-600">
              Bạn đang đăng nhập bằng <strong>mật khẩu quản trị</strong>. Phiên này quản trị
              được dữ liệu gia phả nhưng không gắn với một người cụ thể, nên không đăng bài,
              gửi tin nhắn hay tải ảnh được.
              <br />
              <br />
              Hãy tạo một tài khoản cho chính mình, rồi đăng nhập lại bằng số điện thoại.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/tai-khoan"
                className="inline-flex items-center justify-center rounded-lg bg-[#8b4513] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6d350f]"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Tạo tài khoản cho tôi
              </Link>
              <Link
                href="/dang-nhap"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập bằng số điện thoại
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mb-5 text-sm leading-relaxed text-gray-600">
              Bạn đang xem gia phả bằng <strong>mã xem</strong>. Khu vực này dành cho con cháu
              có tài khoản riêng. Hãy liên hệ trưởng họ để xin mã mời và lập tài khoản.
            </p>
            <Link
              href="/dang-nhap"
              className="inline-flex items-center justify-center rounded-lg bg-[#8b4513] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6d350f]"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Đăng nhập tài khoản
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
