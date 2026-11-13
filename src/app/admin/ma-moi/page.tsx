"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Trash2, Ticket, KeyRound, Eye, EyeOff, Info } from "lucide-react";
import toast from "react-hot-toast";

interface Invite {
  id: string;
  code: string;
  note: string | null;
  maxUses: number;
  usedCount: number;
  autoApprove: boolean;
  expiresAt: string | null;
  createdAt: string;
  users: { id: string; name: string; phone: string; status: string }[];
}

interface ViewCode {
  id: string;
  code: string;
  label: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

function copy(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`Đã copy: ${text}`))
    .catch(() => toast.error("Không copy được, vui lòng copy thủ công"));
}

export default function InviteCodesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [viewCodes, setViewCodes] = useState<ViewCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({
    note: "",
    maxUses: "1",
    expiresInDays: "30",
    autoApprove: false,
  });
  const [viewLabel, setViewLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invitesRes, viewRes] = await Promise.all([
        fetch("/api/admin/invites"),
        fetch("/api/admin/view-code"),
      ]);
      const invitesData = await invitesRes.json();
      const viewData = await viewRes.json();
      if (invitesRes.ok) setInvites(invitesData.data);
      if (viewRes.ok) setViewCodes(viewData.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: inviteForm.note,
        maxUses: Number(inviteForm.maxUses) || 1,
        expiresInDays: Number(inviteForm.expiresInDays) || 0,
        autoApprove: inviteForm.autoApprove,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không tạo được mã mời");
      return;
    }
    toast.success(`Đã tạo mã mời: ${data.data.code}`);
    setInviteForm({ note: "", maxUses: "1", expiresInDays: "30", autoApprove: false });
    load();
  }

  async function deleteInvite(invite: Invite) {
    if (!confirm(`Xóa mã mời ${invite.code}?`)) return;
    const res = await fetch(`/api/admin/invites/${invite.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Không xóa được");
      return;
    }
    toast.success("Đã xóa mã mời");
    load();
  }

  async function createViewCode(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/view-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: viewLabel }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không tạo được mã xem");
      return;
    }
    toast.success(`Đã tạo mã xem: ${data.data.code}`);
    setViewLabel("");
    load();
  }

  async function toggleViewCode(code: ViewCode) {
    const res = await fetch(`/api/admin/view-code/${code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !code.isActive }),
    });
    if (!res.ok) {
      toast.error("Không cập nhật được");
      return;
    }
    toast.success(code.isActive ? "Đã ngừng mã xem" : "Đã bật lại mã xem");
    load();
  }

  async function deleteViewCode(code: ViewCode) {
    if (!confirm(`Xóa mã xem ${code.code}? Các thiết bị đang dùng mã này sẽ phải nhập mã khác.`))
      return;
    const res = await fetch(`/api/admin/view-code/${code.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xóa được");
      return;
    }
    toast.success("Đã xóa mã xem");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mã Mời & Mã Xem</h1>

      {/* ===== Mã xem gia phả ===== */}
      <Card className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <KeyRound className="h-5 w-5 text-[#8b4513]" />
            Mã xem gia phả (cho các cụ)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Mã 6 chữ số, chỉ xem gia phả — không vào được feed, chat hay trang quản trị.
            Nhập một lần trên máy của cụ, thiết bị nhớ 1 năm.
          </p>
        </div>

        <form onSubmit={createViewCode} className="flex flex-wrap items-end gap-3">
          <Input
            label="Ghi chú (tùy chọn)"
            value={viewLabel}
            onChange={(e) => setViewLabel(e.target.value)}
            placeholder="VD: Chi nhà ông Ba"
            className="sm:w-64"
          />
          <Button type="submit">
            <Plus className="mr-1 h-4 w-4" />
            Tạo mã xem
          </Button>
        </form>

        {viewCodes.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Chưa có mã xem nào. Tạo một mã để các cụ xem được gia phả mà không cần tài khoản.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {viewCodes.map((code) => (
              <div
                key={code.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold tracking-widest text-gray-900">
                    {code.code}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      code.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {code.isActive ? "Đang dùng" : "Đã ngừng"}
                  </span>
                  {code.label && <span className="text-sm text-gray-500">{code.label}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => copy(code.code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleViewCode(code)}>
                    {code.isActive ? (
                      <>
                        <EyeOff className="mr-1 h-4 w-4" /> Ngừng
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-4 w-4" /> Bật
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteViewCode(code)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ===== Mã mời đăng ký ===== */}
      <Card className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Ticket className="h-5 w-5 text-[#8b4513]" />
            Mã mời đăng ký tài khoản
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gửi mã cho người trong họ để họ tự đăng ký tại trang <code>/dang-ky</code>.
          </p>
        </div>

        <form onSubmit={createInvite} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <Input
            label="Ghi chú"
            value={inviteForm.note}
            onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
            placeholder="VD: Chi 2 - nhà bác Tư"
            className="sm:col-span-2"
          />
          <Input
            label="Số lượt dùng"
            type="number"
            min={1}
            value={inviteForm.maxUses}
            onChange={(e) => setInviteForm({ ...inviteForm, maxUses: e.target.value })}
          />
          <Input
            label="Hết hạn sau (ngày)"
            type="number"
            min={0}
            value={inviteForm.expiresInDays}
            onChange={(e) => setInviteForm({ ...inviteForm, expiresInDays: e.target.value })}
            placeholder="0 = không hết hạn"
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Plus className="mr-1 h-4 w-4" />
              Tạo mã
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-5">
            <input
              type="checkbox"
              checked={inviteForm.autoApprove}
              onChange={(e) => setInviteForm({ ...inviteForm, autoApprove: e.target.checked })}
              className="h-4 w-4 cursor-pointer accent-[#8b4513]"
            />
            Tự động duyệt (đăng ký xong dùng được ngay, không cần quản trị duyệt)
          </label>
        </form>

        {loading ? (
          <p className="py-6 text-center text-gray-500">Đang tải...</p>
        ) : invites.length === 0 ? (
          <p className="py-6 text-center text-gray-500">Chưa có mã mời nào</p>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => {
              const expired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
              const usedUp = invite.usedCount >= invite.maxUses;
              return (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-wider text-gray-900">
                        {invite.code}
                      </span>
                      {invite.autoApprove && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Tự động duyệt
                        </span>
                      )}
                      {(expired || usedUp) && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {usedUp ? "Hết lượt" : "Hết hạn"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Đã dùng {invite.usedCount}/{invite.maxUses}
                      {invite.note && ` · ${invite.note}`}
                      {invite.expiresAt &&
                        ` · Hết hạn ${new Date(invite.expiresAt).toLocaleDateString("vi-VN")}`}
                      {invite.users.length > 0 &&
                        ` · ${invite.users.map((u) => u.name).join(", ")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copy(invite.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteInvite(invite)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
