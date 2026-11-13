"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound, Eye } from "lucide-react";

interface UserMenuProps {
  name: string | null;
  role: "admin" | "editor" | "member" | "viewer";
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  editor: "Biên tập",
  member: "Thành viên",
  viewer: "Chế độ xem",
};

export function UserMenu({ name, role }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/dang-nhap");
      router.refresh();
    }
  }

  const isViewer = role === "viewer";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-2 pr-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#8b4513]/40 hover:text-[#8b4513]"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8b4513]/10 text-[#8b4513]">
          {isViewer ? <Eye className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
        </span>
        <span className="max-w-[9rem] truncate">{name || ROLE_LABELS[role]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
            <div className="border-b border-gray-100 px-4 pb-2">
              <p className="truncate text-sm font-medium text-gray-900">
                {name || ROLE_LABELS[role]}
              </p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[role]}</p>
            </div>

            {isViewer && (
              <Link
                href="/dang-nhap"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserRound className="h-4 w-4" />
                Đăng nhập tài khoản
              </Link>
            )}

            {(role === "admin" || role === "editor") && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Trang quản trị
              </Link>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Đang thoát..." : isViewer ? "Thoát chế độ xem" : "Đăng xuất"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
