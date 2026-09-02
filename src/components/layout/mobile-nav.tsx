"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreePine, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/gia-pha", label: "Gia Phả", icon: TreePine },
  { href: "/lich", label: "Lịch", icon: CalendarDays },
];

/** Bottom tab bar, only visible on small screens. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Điều hướng"
    >
      <div className="flex h-14">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/") ||
            (item.href === "/gia-pha" && pathname.startsWith("/thanh-vien"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-[#8b4513]" : "text-gray-500 active:text-gray-700"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className={cn("h-5 w-5", active && "fill-[#8b4513]/10")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
