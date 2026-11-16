"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { CALENDAR_TYPE_OPTIONS } from "@/lib/constants";
import { getCalendarEmoji } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  members: Array<{ id: string; fullName: string; generation: number }>;
  events: Array<{
    id: string;
    title: string;
    date: string | null;
    calendarType: string | null;
    description: string | null;
    member: { id: string; fullName: string } | null;
    location?: string | null;
  }>;
}

export function EventManager({ members, events }: Props) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [calendarType, setCalendarType] = useState("solar");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.fullName} (Đời ${m.generation})`,
  }));

  async function addEvent() {
    if (!title) {
      toast.error("Vui lòng nhập tên sự kiện");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: memberId || null,
          title,
          date: date || null,
          calendarType,
          description: description || null,
          location: location || null,
        }),
      });
      if (!res.ok) throw new Error("Lỗi khi thêm sự kiện");
      toast.success("Thêm sự kiện thành công!");
      setTitle("");
      setDate("");
      setLocation("");
      setCalendarType("solar");
      setDescription("");
      router.refresh();
    } catch {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Xóa sự kiện này?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa sự kiện");
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Thêm sự kiện mới</h2>
        <div className="space-y-3">
          <Select
            label="Thành viên (không bắt buộc)"
            options={memberOptions}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="-- Sự kiện chung của dòng họ --"
          />
          <p className="-mt-2 text-xs text-gray-500">
            Để trống nếu là sự kiện chung: giỗ tổ, họp họ, xây từ đường...
          </p>
          <Input
            label="Tên sự kiện *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Tốt nghiệp Đại học"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Ngày</label>
            <div className="flex gap-2">
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="VD: 1990, 15/06/2000"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              />
              <select
                value={calendarType}
                onChange={(e) => setCalendarType(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
              >
                {CALENDAR_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === "lunar" ? "🌙" : "☀️"} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Địa điểm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="VD: Từ đường họ Nguyễn"
          />
          <Textarea
            label="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết về sự kiện..."
            rows={3}
          />
          <Button onClick={addEvent} disabled={loading} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Đang thêm..." : "Thêm sự kiện"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Danh sách sự kiện ({events.length})
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có sự kiện nào</p>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{ev.title}</p>
                  <p className="text-xs text-gray-500">
                    {ev.member ? ev.member.fullName : "Sự kiện chung của dòng họ"}
                    {ev.location && ` • ${ev.location}`}
                    {ev.date && (
                      <span>
                        {" "}&bull; {ev.date}{" "}
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{
                          backgroundColor: ev.calendarType === "lunar" ? "#fef3c7" : "#dbeafe",
                          color: ev.calendarType === "lunar" ? "#92400e" : "#1e40af",
                        }}>
                          {getCalendarEmoji(ev.calendarType)} {ev.calendarType === "lunar" ? "Âm lịch" : "Dương lịch"}
                        </span>
                      </span>
                    )}
                  </p>
                  {ev.description && (
                    <p className="mt-1 text-sm text-gray-600">{ev.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="rounded p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
