"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GENERATION_COLORS } from "@/lib/constants";
import { MemberActions } from "@/components/member/member-actions";

interface MemberItem {
  id: string;
  fullName: string;
  birthDate: string | null;
  gender: string;
  generation: number;
  occupation: string | null;
  isAlive: boolean;
  photoUrl: string | null;
}

interface MemberListClientProps {
  members: MemberItem[];
}

export function MemberListClient({ members }: MemberListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase().trim();
    return members.filter((m) => m.fullName.toLowerCase().includes(query));
  }, [members, searchQuery]);

  const searchActive = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
          Thành Viên
        </h1>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-gray-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Result count */}
        {searchActive && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filteredMembers.length > 0
              ? `Tìm thấy ${filteredMembers.length} kết quả`
              : "Không tìm thấy"}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add button */}
        <Link href="/admin/thanh-vien/them-moi">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        </Link>
      </div>

      {/* Table */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Chưa có thành viên nào.</p>
          <Link href="/admin/thanh-vien/them-moi">
            <Button className="mt-4">Thêm thành viên đầu tiên</Button>
          </Link>
        </div>
      ) : filteredMembers.length === 0 && searchActive ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">
            Không tìm thấy thành viên nào với từ khóa &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Đời
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Giới tính
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Nghề nghiệp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Tình trạng
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/thanh-vien/${m.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar
                        src={m.photoUrl}
                        gender={m.gender as "male" | "female"}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-gray-900 hover:text-[#8b4513]">
                          {m.fullName}
                        </p>
                        {m.birthDate && (
                          <p className="text-xs text-gray-400">{m.birthDate}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={
                        GENERATION_COLORS[(m.generation - 1) % GENERATION_COLORS.length]
                      }
                    >
                      Đời {m.generation}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.gender === "male" ? "Nam" : "Nữ"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.occupation || "\u2014"}
                  </td>
                  <td className="px-6 py-4">
                    {m.isAlive ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Còn sống
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                        Đã mất
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <MemberActions memberId={m.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
