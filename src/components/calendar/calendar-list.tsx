"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { GENERATION_COLORS } from "@/lib/constants";
import { getCalendarEmoji, getCalendarLabel } from "@/lib/utils";
import Link from "next/link";
import { BookOpen, Cake, Star, Calendar, Search, X } from "lucide-react";

export interface CalendarItem {
  type: "anniversary" | "birthday" | "event";
  memberId: string;
  memberName: string;
  generation: number;
  date: string | null;
  calendarType: string;
  label: string;
  description?: string | null;
}

interface CalendarListProps {
  anniversaries: CalendarItem[];
  birthdays: CalendarItem[];
  events: CalendarItem[];
}

type FilterType = "all" | "anniversary" | "birthday" | "event";
type CalendarFilter = "all" | "lunar" | "solar";

function getTypeIcon(type: string) {
  switch (type) {
    case "anniversary":
      return <BookOpen className="h-4 w-4" />;
    case "birthday":
      return <Cake className="h-4 w-4" />;
    case "event":
      return <Star className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

function getTypeIconBg(type: string) {
  switch (type) {
    case "anniversary":
      return "bg-purple-100 text-purple-600";
    case "birthday":
      return "bg-green-100 text-green-600";
    case "event":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function CalendarList({ anniversaries, birthdays, events }: CalendarListProps) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Combine and filter items
  const filteredItems = useMemo(() => {
    let items: CalendarItem[] = [];

    if (filterType === "all" || filterType === "anniversary") {
      items = [...items, ...anniversaries];
    }
    if (filterType === "all" || filterType === "birthday") {
      items = [...items, ...birthdays];
    }
    if (filterType === "all" || filterType === "event") {
      items = [...items, ...events];
    }

    // Filter by calendar type
    if (calendarFilter !== "all") {
      items = items.filter((item) => item.calendarType === calendarFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.memberName.toLowerCase().includes(query) ||
          item.label.toLowerCase().includes(query) ||
          (item.date && item.date.toLowerCase().includes(query))
      );
    }

    return items;
  }, [anniversaries, birthdays, events, filterType, calendarFilter, searchQuery]);

  const filterButtons: { value: FilterType; label: string; icon: React.ReactNode; count: number }[] = [
    { value: "all", label: "Tất cả", icon: <Calendar className="h-4 w-4" />, count: anniversaries.length + birthdays.length + events.length },
    { value: "anniversary", label: "Ngày giỗ", icon: <BookOpen className="h-4 w-4" />, count: anniversaries.length },
    { value: "birthday", label: "Sinh nhật", icon: <Cake className="h-4 w-4" />, count: birthdays.length },
    { value: "event", label: "Sự kiện", icon: <Star className="h-4 w-4" />, count: events.length },
  ];

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Type filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterType(btn.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                filterType === btn.value
                  ? "bg-[#8b4513] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {btn.icon}
              {btn.label}
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                filterType === btn.value ? "bg-white/20" : "bg-gray-100"
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Calendar type filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thành viên..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Calendar type filter */}
          <select
            value={calendarFilter}
            onChange={(e) => setCalendarFilter(e.target.value as CalendarFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
          >
            <option value="all">📅 Tất cả lịch</option>
            <option value="lunar">🌙 Âm lịch</option>
            <option value="solar">☀️ Dương lịch</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500">
        Hiển thị {filteredItems.length} mục
        {searchQuery && ` cho "${searchQuery}"`}
      </p>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Không tìm thấy kết quả</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm text-[#8b4513] hover:underline cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, i) => {
            const genColor = GENERATION_COLORS[(item.generation - 1) % GENERATION_COLORS.length];
            return (
              <Link
                key={`${item.type}-${item.memberId}-${i}`}
                href={`/thanh-vien/${item.memberId}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getTypeIconBg(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {item.type === "event" && (
                        <span className="text-xs text-gray-400">{item.memberName}</span>
                      )}
                      {item.date && (
                        <span className="text-sm text-gray-500">{item.date}</span>
                      )}
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: item.calendarType === "lunar" ? "#fef3c7" : "#dbeafe",
                          color: item.calendarType === "lunar" ? "#92400e" : "#1e40af",
                        }}
                      >
                        {getCalendarEmoji(item.calendarType)} {getCalendarLabel(item.calendarType)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{item.description}</p>
                    )}
                  </div>
                </div>
                <Badge className={genColor + " text-xs shrink-0 ml-2"}>Đời {item.generation}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
