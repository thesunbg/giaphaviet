import Link from "next/link";
import { TreePine } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d2a679]/30 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16">
        <Link href="/gia-pha" className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-[#8b4513] md:h-7 md:w-7" />
          <span className="text-lg font-bold text-[#8b4513] md:text-xl">Gia Phả Việt</span>
        </Link>
        {/* Desktop nav; phones use the bottom tab bar */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/gia-pha"
            className="text-sm font-medium text-gray-600 hover:text-[#8b4513] transition-colors"
          >
            Cây Gia Phả
          </Link>
          <Link
            href="/lich"
            className="text-sm font-medium text-gray-600 hover:text-[#8b4513] transition-colors"
          >
            Lịch Gia Đình
          </Link>
        </nav>
      </div>
    </header>
  );
}
