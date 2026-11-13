import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ExportActions } from "./export-actions";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Users,
  GitBranch,
  Heart,
  CalendarDays,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const [totalMembers, totalRelationships, totalMarriages, totalEvents] = await Promise.all([
    prisma.member.count(),
    prisma.parentChild.count(),
    prisma.marriage.count(),
    prisma.event.count(),
  ]);

  const stats = [
    { label: "Thành viên", value: totalMembers, icon: Users },
    { label: "Quan hệ cha-con", value: totalRelationships, icon: GitBranch },
    { label: "Hôn nhân", value: totalMarriages, icon: Heart },
    { label: "Sự kiện", value: totalEvents, icon: CalendarDays },
  ];

  const isEmpty = totalMembers === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Export Gia Phả</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#8b4513]/10 text-[#8b4513]">
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="truncate text-xs text-gray-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {isEmpty && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Chưa có dữ liệu để export.{" "}
            <Link href="/admin/import" className="font-medium underline">
              Import gia phả
            </Link>{" "}
            hoặc thêm thành viên trước.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* JSON */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b4513]/10 text-[#8b4513]">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Toàn bộ gia phả (JSON)</h2>
              <p className="text-sm text-gray-500">Dùng để sao lưu và import lại</p>
            </div>
          </div>

          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Cây gia phả dạng lồng nhau: cụ tổ → vợ/chồng → con cháu</li>
            <li>Đầy đủ thông tin thành viên, ngày giỗ, mộ phần, ảnh, sự kiện</li>
            <li>
              Tương thích với trang{" "}
              <Link href="/admin/import" className="font-medium text-[#8b4513] underline">
                Import JSON
              </Link>{" "}
              — import lại được nguyên trạng
            </li>
          </ul>

          <a
            href="/api/export?format=json"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6d350f]"
          >
            <Download className="mr-2 h-4 w-4" />
            Tải file JSON
          </a>

          <ExportActions />
        </Card>

        {/* CSV */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách thành viên (CSV)
              </h2>
              <p className="text-sm text-gray-500">Mở bằng Excel / Google Sheets</p>
            </div>
          </div>

          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Mỗi thành viên một dòng, sắp theo đời và thứ tự sinh</li>
            <li>Kèm tên cha, mẹ, vợ/chồng, ngày giỗ, nghề nghiệp, nơi ở</li>
            <li>Mã hóa UTF-8 (có BOM) nên Excel hiển thị đúng tiếng Việt</li>
          </ul>

          <a
            href="/api/export?format=csv"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#8b4513] px-4 py-2 text-sm font-medium text-[#8b4513] transition-colors hover:bg-[#8b4513] hover:text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Tải file CSV
          </a>

          <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <p>
              CSV chỉ dùng để xem/in danh sách. Để sao lưu đầy đủ (và import lại), hãy dùng
              file JSON.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
