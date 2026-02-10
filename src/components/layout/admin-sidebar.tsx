"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  CalendarDays,
  FileJson,
  TreePine,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Tổng Quan", icon: LayoutDashboard },
  { href: "/admin/thanh-vien", label: "Thành Viên", icon: Users },
  { href: "/admin/quan-he", label: "Quan Hệ", icon: GitBranch },
  { href: "/admin/su-kien", label: "Sự Kiện", icon: CalendarDays },
  { href: "/admin/import", label: "Import JSON", icon: FileJson },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <TreePine className="h-6 w-6 text-[#8b4513]" />
        <span className="text-lg font-bold text-[#8b4513]">Quản Trị</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#8b4513]/10 text-[#8b4513]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-gray-200 p-4">
        <Link
          href="/gia-pha"
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
    </aside>
  );
}
