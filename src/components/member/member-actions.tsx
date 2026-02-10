"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export function MemberActions({ memberId }: { memberId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

    const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Xóa thành công!");
      router.refresh();
    } else {
      toast.error("Không thể xóa. Vui lòng thử lại.");
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/thanh-vien/${memberId}/chinh-sua`}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-[#8b4513] transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDelete}
        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
