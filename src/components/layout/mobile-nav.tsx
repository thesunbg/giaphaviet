"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  TreePine,
  CalendarDays,
  Newspaper,
  Images,
  MessagesSquare,
  Wallet,
  Search,
  MoreHorizontal,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  /** Tài khoản thật mới thấy bảng tin / ảnh / chat (mã xem thì không) */
  isMember?: boolean;
  /** Quản trị / biên tập thấy lối vào trang quản trị */
  isStaff?: boolean;
}

/** Thanh điều hướng dưới cùng, chỉ hiện trên điện thoại */
export function MobileNav({ isMember = false, isStaff = false }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const tabs = [
    { href: "/gia-pha", label: "Gia Phả", icon: TreePine },
    { href: "/tim-kiem", label: "Tìm Kiếm", icon: Search },
    ...(isMember ? [{ href: "/feed", label: "Bảng Tin", icon: Newspaper }] : []),
    { href: "/lich", label: "Lịch", icon: CalendarDays },
  ];

  const moreItems = [
    ...(isMember
      ? [
          { href: "/anh", label: "Album ảnh dòng họ", icon: Images },
          { href: "/chat", label: "Trò chuyện dòng họ", icon: MessagesSquare },
          { href: "/quy-ho", label: "Quỹ dòng họ", icon: Wallet },
        ]
      : []),
    ...(isStaff ? [{ href: "/admin", label: "Trang quản trị", icon: Settings }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (href === "/gia-pha" && pathname.startsWith("/thanh-vien"));

  const moreActive = moreItems.some((item) => isActive(item.href));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/dang-nhap");
    router.refresh();
  }

  return (
    <>
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="font-semibold text-gray-900">Thêm</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-full p-1.5 text-gray-400 active:bg-gray-100"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-1">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-[15px] text-gray-800 active:bg-gray-50"
                >
                  <item.icon className="h-5 w-5 text-[#8b4513]" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] text-gray-800 active:bg-gray-50"
              >
                <LogOut className="h-5 w-5 text-gray-400" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Điều hướng"
      >
        <div className="flex h-14">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-[#8b4513]" : "text-gray-500 active:text-gray-700"
                )}
                aria-current={active ? "page" : undefined}
              >
                <tab.icon className={cn("h-5 w-5", active && "fill-[#8b4513]/10")} />
                {tab.label}
              </Link>
            );
          })}

          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
              moreActive ? "text-[#8b4513]" : "text-gray-500 active:text-gray-700"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            Thêm
          </button>
        </div>
      </nav>
    </>
  );
}
