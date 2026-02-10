import Link from "next/link";
import { TreePine } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-[#d2a679]/30 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/gia-pha" className="flex items-center gap-2">
          <TreePine className="h-7 w-7 text-[#8b4513]" />
          <span className="text-xl font-bold text-[#8b4513]">Gia Phả Việt</span>
        </Link>
        <nav className="flex items-center gap-6">
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
