import Link from "next/link";
import { MemberForm } from "@/components/member/member-form";
import { ChevronLeft } from "lucide-react";

export default function AddMemberPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/thanh-vien"
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Thêm Thành Viên Mới</h1>
      </div>
      <MemberForm />
    </div>
  );
}
