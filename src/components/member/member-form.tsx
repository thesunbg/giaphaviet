"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GENDER_OPTIONS, CALENDAR_TYPE_OPTIONS } from "@/lib/constants";
import { DateInput } from "@/components/ui/date-input";
import toast from "react-hot-toast";
import type { MemberData, CalendarType } from "@/types/member";

interface MemberFormProps {
  member?: MemberData | null;
}

export function MemberForm({ member }: MemberFormProps) {
  const router = useRouter();
  const isEditing = !!member;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: member?.fullName || "",
    birthDate: member?.birthDate || "",
    birthDateType: member?.birthDateType || "solar",
    deathDate: member?.deathDate || "",
    deathDateType: member?.deathDateType || "solar",
    isAlive: member?.isAlive ?? true,
    gender: member?.gender || "male",
    generation: member?.generation || 1,
    birthOrder: member?.birthOrder || 1,
    occupation: member?.occupation || "",
    address: member?.address || "",
    biography: member?.biography || "",
    graveInfo: member?.graveInfo || "",
    deathAnniversary: member?.deathAnniversary || "",
    deathAnniversaryType: member?.deathAnniversaryType || "lunar",
    notes: member?.notes || "",
    photoUrl: member?.photoUrl || "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(member?.photoUrl || null);

  function updateField(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = form.photoUrl;

      // Upload photo if new file selected
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          photoUrl = uploadData.url;
        }
      }

      const payload = {
        ...form,
        photoUrl: photoUrl || null,
        birthDate: form.birthDate || null,
        deathDate: form.deathDate || null,
        occupation: form.occupation || null,
        address: form.address || null,
        biography: form.biography || null,
        graveInfo: form.graveInfo || null,
        deathAnniversary: form.deathAnniversary || null,
        notes: form.notes || null,
      };

      const url = isEditing ? `/api/members/${member.id}` : "/api/members";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Đã xảy ra lỗi");
      }

      toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành viên thành công!");
      router.push("/admin/thanh-vien");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Họ tên *"
            id="fullName"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            required
            placeholder="Nguyễn Văn A"
          />
          <Select
            label="Giới tính"
            id="gender"
            options={[...GENDER_OPTIONS]}
            value={form.gender}
            onChange={(e) => updateField("gender", e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <DateInput
                  value={form.birthDate}
                  onChange={(val) => updateField("birthDate", val)}
                  calendarType={form.birthDateType as CalendarType}
                  placeholder="VD: 1990, 15/03/1990"
                  id="birthDate"
                />
              </div>
              <select
                value={form.birthDateType}
                onChange={(e) => updateField("birthDateType", e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] mt-8"
              >
                {CALENDAR_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === "lunar" ? "\uD83C\uDF19" : "\u2600\uFE0F"} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tình trạng</label>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isAlive"
                  checked={form.isAlive}
                  onChange={() => updateField("isAlive", true)}
                  className="accent-[#8b4513]"
                />
                <span className="text-sm">Còn sống</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isAlive"
                  checked={!form.isAlive}
                  onChange={() => updateField("isAlive", false)}
                  className="accent-[#8b4513]"
                />
                <span className="text-sm">Đã mất</span>
              </label>
            </div>
          </div>
          {!form.isAlive && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Ngày mất</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <DateInput
                      value={form.deathDate}
                      onChange={(val) => updateField("deathDate", val)}
                      calendarType={form.deathDateType as CalendarType}
                      placeholder="VD: 2020"
                      id="deathDate"
                    />
                  </div>
                  <select
                    value={form.deathDateType}
                    onChange={(e) => updateField("deathDateType", e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] mt-8"
                  >
                    {CALENDAR_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === "lunar" ? "\uD83C\uDF19" : "\u2600\uFE0F"} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Ngày giỗ</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <DateInput
                      value={form.deathAnniversary}
                      onChange={(val) => updateField("deathAnniversary", val)}
                      calendarType={form.deathAnniversaryType as CalendarType}
                      placeholder="VD: Mùng 10 tháng 3"
                      id="deathAnniversary"
                    />
                  </div>
                  <select
                    value={form.deathAnniversaryType}
                    onChange={(e) => updateField("deathAnniversaryType", e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513] mt-8"
                  >
                    {CALENDAR_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === "lunar" ? "\uD83C\uDF19" : "\u2600\uFE0F"} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          <Input
            label="Đời thứ"
            id="generation"
            type="number"
            min={1}
            value={form.generation}
            onChange={(e) => updateField("generation", parseInt(e.target.value) || 1)}
          />
          <Input
            label="Thứ tự trong gia đình"
            id="birthOrder"
            type="number"
            min={1}
            value={form.birthOrder}
            onChange={(e) => updateField("birthOrder", parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Thông tin thêm</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nghề nghiệp"
            id="occupation"
            value={form.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
            placeholder="VD: Giáo viên"
          />
          <Input
            label="Nơi ở"
            id="address"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="VD: Hà Nội"
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Tiểu sử"
            id="biography"
            value={form.biography}
            onChange={(e) => updateField("biography", e.target.value)}
            placeholder="Viết vài dòng về thành viên này..."
            rows={3}
          />
        </div>
        {!form.isAlive && (
          <div className="mt-4">
            <Textarea
              label="Thông tin mộ phần"
              id="graveInfo"
              value={form.graveInfo}
              onChange={(e) => updateField("graveInfo", e.target.value)}
              placeholder="VD: Nghĩa trang..."
              rows={2}
            />
          </div>
        )}
        <div className="mt-4">
          <Textarea
            label="Ghi chú"
            id="notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Ghi chú thêm..."
            rows={2}
          />
        </div>
      </div>

      {/* Photo */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Ảnh đại diện</h3>
        <div className="flex items-center gap-6">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
            />
          )}
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#8b4513]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#8b4513] file:cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-400">JPEG, PNG hoặc WebP. Tối đa 5MB.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm thành viên"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
