import { headers } from "next/headers";
import { userAgent } from "next/server";
import { buildFamilyTree } from "@/lib/tree-builder";
import { FamilyTree } from "@/components/tree/family-tree";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GiaPhaPage() {
  const [tree, headerList] = await Promise.all([buildFamilyTree(), headers()]);
  const { device } = userAgent({ headers: headerList });
  // Phones open in the family-by-family explorer; larger screens keep the diagram.
  const defaultViewMode = device.type === "mobile" ? "focus" : "diagram";

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-gray-500">Chưa có dữ liệu gia phả.</p>
        <Link
          href="/admin/thanh-vien/them-moi"
          className="mt-4 text-[#8b4513] hover:underline"
        >
          Thêm thành viên đầu tiên &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4">
      <div className="mb-4 hidden text-center md:block">
        <h1 className="text-3xl font-bold text-[#8b4513]">Cây Gia Phả</h1>
        <p className="mt-1 text-gray-500">Dòng họ {tree.member.fullName.split(" ")[0]}</p>
      </div>
      <FamilyTree tree={tree} defaultViewMode={defaultViewMode} />
    </div>
  );
}
