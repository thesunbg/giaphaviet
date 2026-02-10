import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Users, GitBranch, CalendarDays, TreePine } from "lucide-react";

export default async function AdminDashboard() {
  const [totalMembers, totalRelationships, totalMarriages, totalEvents, generationStats] =
    await Promise.all([
      prisma.member.count(),
      prisma.parentChild.count(),
      prisma.marriage.count(),
      prisma.event.count(),
      prisma.member.groupBy({
        by: ["generation"],
        _count: true,
        orderBy: { generation: "asc" },
      }),
    ]);

  const stats = [
    { label: "Thành viên", value: totalMembers, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Quan hệ cha-con", value: totalRelationships, icon: GitBranch, color: "text-green-600 bg-green-100" },
    { label: "Hôn nhân", value: totalMarriages, icon: TreePine, color: "text-purple-600 bg-purple-100" },
    { label: "Sự kiện", value: totalEvents, icon: CalendarDays, color: "text-orange-600 bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tổng Quan</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Thống kê theo đời</h2>
        {generationStats.length === 0 ? (
          <p className="text-gray-500">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-3">
            {generationStats.map((gen) => (
              <div key={gen.generation} className="flex items-center gap-4">
                <span className="w-16 text-sm font-medium text-gray-700">
                  Đời {gen.generation}
                </span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#8b4513]/70"
                      style={{
                        width: `${Math.max((gen._count / totalMembers) * 100, 8)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-medium text-gray-600">
                  {gen._count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
