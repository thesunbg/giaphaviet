"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Info } from "lucide-react";
import toast from "react-hot-toast";

interface SettingsForm {
  familyName: string;
  treeTitle: string;
  ancestralHome: string;
  address: string;
  description: string;
  contactPhone: string;
}

const EMPTY: SettingsForm = {
  familyName: "",
  treeTitle: "",
  ancestralHome: "",
  address: "",
  description: "",
  contactPhone: "",
};

export default function SiteSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const { data } = await res.json();
          setForm({
            familyName: data.familyName || "",
            treeTitle: data.treeTitle || "",
            ancestralHome: data.ancestralHome || "",
            address: data.address || "",
            description: data.description || "",
            contactPhone: data.contactPhone || "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(field: keyof SettingsForm) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không lưu được");
        return;
      }
      toast.success("Đã lưu thông tin dòng họ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-gray-500">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Thông Tin Dòng Họ</h1>

      <Card className="max-w-3xl space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Settings className="h-5 w-5 text-[#8b4513]" />
          Khai báo chung
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên dòng họ *"
            id="familyName"
            value={form.familyName}
            onChange={update("familyName")}
            placeholder="VD: Dòng họ Nguyễn Công"
          />

          <Input
            label="Tiêu đề cây gia phả"
            id="treeTitle"
            value={form.treeTitle}
            onChange={update("treeTitle")}
            placeholder="VD: Cây gia phả họ Nguyễn Công - Thái Bình"
          />

          <Input
            label="Nhà thờ họ / Từ đường"
            id="ancestralHome"
            value={form.ancestralHome}
            onChange={update("ancestralHome")}
            placeholder="VD: Từ đường họ Nguyễn Công"
          />

          <Input
            label="Địa chỉ cụ thể"
            id="address"
            value={form.address}
            onChange={update("address")}
            placeholder="VD: Thôn Đồng Xuân, xã Quỳnh Ngọc, tỉnh Hưng Yên"
          />

          <Input
            label="Số điện thoại liên hệ"
            id="contactPhone"
            value={form.contactPhone}
            onChange={update("contactPhone")}
            placeholder="VD: 0912345678 (trưởng họ)"
          />

          <Textarea
            label="Giới thiệu dòng họ"
            id="description"
            value={form.description}
            onChange={update("description")}
            rows={4}
            placeholder="Vài dòng về lịch sử, nguồn gốc dòng họ..."
          />

          <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <p>
              Thông tin này hiển thị trên trang cây gia phả, chân trang và trang đăng nhập
              để con cháu biết đây là gia phả của dòng họ nào.
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
