"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  CalendarDays,
  FileJson,
  Download,
  UserCog,
  Ticket,
  TreePine,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Tổng Quan", icon: LayoutDashboard },
  { href: "/admin/thanh-vien", label: "Thành Viên", icon: Users },
  { href: "/admin/quan-he", label: "Quan Hệ", icon: GitBranch },
  { href: "/admin/su-kien", label: "Sự Kiện", icon: CalendarDays },
  { href: "/admin/import", label: "Import JSON", icon: FileJson },
  { href: "/admin/export", label: "Export JSON", icon: Download },
  { href: "/admin/tai-khoan", label: "Tài Khoản", icon: UserCog, adminOnly: true },
  { href: "/admin/ma-moi", label: "Mã Mời & Mã Xem", icon: Ticket, adminOnly: true },
];

interface AdminSidebarProps {
  userName?: string;
  isAdmin?: boolean;
}

export function AdminSidebar({ userName = "", isAdmin = true }: AdminSidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => isAdmin || !item.adminOnly);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/dang-nhap");
      router.refresh();
    } catch {
      router.push("/dang-nhap");
    }
  }

  const currentLabel =
    items.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    )?.label ?? "Quản Trị";

  const navContent = (
    <>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#8b4513]/10 text-[#8b4513]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {userName && (
          <p className="truncate text-sm font-medium text-gray-700">{userName}</p>
        )}
        <Link
          href="/gia-pha"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#8b4513] transition-colors"
        >
          <TreePine className="h-4 w-4" />
          Xem Gia Phả
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Đang đăng xuất..." : "Đăng Xuất"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ===== Mobile top bar ===== */}
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 active:bg-gray-100"
          aria-label="Mở menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TreePine className="h-5 w-5 shrink-0 text-[#8b4513]" />
          <span className="truncate text-base font-bold text-[#8b4513]">{currentLabel}</span>
        </div>
        <Link
          href="/gia-pha"
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 active:bg-gray-100"
        >
          Xem Gia Phả
        </Link>
      </div>

      {/* ===== Mobile drawer ===== */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="drawer-enter absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center gap-2">
                <TreePine className="h-6 w-6 text-[#8b4513]" />
                <span className="text-lg font-bold text-[#8b4513]">Quản Trị</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-gray-500 active:bg-gray-100"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      {/* ===== Desktop sidebar ===== */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <TreePine className="h-6 w-6 text-[#8b4513]" />
          <span className="text-lg font-bold text-[#8b4513]">Quản Trị</span>
        </div>
        {navContent}
      </aside>
    </>
  );
}
