"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  UserPlus,
  Check,
  Lock,
  Unlock,
  Trash2,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

interface AccountRow {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "editor" | "member";
  status: "pending" | "active" | "blocked";
  note: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  member: { id: string; fullName: string; generation: number } | null;
  inviteCode: { code: string; note: string | null } | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị",
  editor: "Biên tập",
  member: "Thành viên",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đang dùng",
  blocked: "Đã khóa",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "", role: "member" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) setAccounts(data.data);
      else toast.error(data.error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>, successMessage: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không thực hiện được");
      return;
    }
    toast.success(successMessage);
    load();
  }

  async function remove(account: AccountRow) {
    if (!confirm(`Xóa tài khoản "${account.name}" (${account.phone})?`)) return;
    const res = await fetch(`/api/admin/users/${account.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không xóa được");
      return;
    }
    toast.success("Đã xóa tài khoản");
    load();
  }

  async function resetPassword(account: AccountRow) {
    const password = prompt(`Mật khẩu mới cho "${account.name}" (ít nhất 6 ký tự):`);
    if (!password) return;
    await patch(account.id, { password }, "Đã đặt lại mật khẩu");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không tạo được tài khoản");
        return;
      }
      toast.success("Đã tạo tài khoản");
      setForm({ name: "", phone: "", password: "", role: "member" });
      load();
    } finally {
      setCreating(false);
    }
  }

  const keyword = filter.trim().toLowerCase();
  const visible = keyword
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(keyword) ||
          a.phone.includes(keyword) ||
          (a.member?.fullName || "").toLowerCase().includes(keyword)
      )
    : accounts;

  const pendingCount = accounts.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Tài Khoản</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            {pendingCount} tài khoản chờ duyệt
          </span>
        )}
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <UserPlus className="h-5 w-5 text-[#8b4513]" />
          Tạo tài khoản trực tiếp
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <Input
            label="Họ tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nguyễn Văn A"
          />
          <Input
            label="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0912345678"
          />
          <Input
            label="Mật khẩu"
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Ít nhất 6 ký tự"
          />
          <Select
            label="Vai trò"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: "member", label: "Thành viên" },
              { value: "editor", label: "Biên tập" },
              { value: "admin", label: "Quản trị" },
            ]}
          />
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-[#8b4513]" />
            Danh sách tài khoản ({accounts.length})
          </h2>
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="sm:w-72"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Đang tải...</p>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Chưa có tài khoản nào</p>
        ) : (
          <div className="space-y-3">
            {visible.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{account.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[account.status]}`}
                    >
                      {STATUS_LABELS[account.status]}
                    </span>
                    {account.role !== "member" && (
                      <span className="flex items-center gap-1 rounded-full bg-[#8b4513]/10 px-2 py-0.5 text-xs font-medium text-[#8b4513]">
                        <ShieldCheck className="h-3 w-3" />
                        {ROLE_LABELS[account.role]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {account.phone}
                    {account.member && ` · Trong gia phả: ${account.member.fullName} (đời ${account.member.generation})`}
                    {account.inviteCode && ` · Mã mời: ${account.inviteCode.code}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {account.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => patch(account.id, { status: "active" }, "Đã duyệt tài khoản")}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Duyệt
                    </Button>
                  )}
                  {account.status === "active" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => patch(account.id, { status: "blocked" }, "Đã khóa tài khoản")}
                    >
                      <Lock className="mr-1 h-4 w-4" />
                      Khóa
                    </Button>
                  )}
                  {account.status === "blocked" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => patch(account.id, { status: "active" }, "Đã mở khóa")}
                    >
                      <Unlock className="mr-1 h-4 w-4" />
                      Mở khóa
                    </Button>
                  )}

                  <select
                    value={account.role}
                    onChange={(e) =>
                      patch(account.id, { role: e.target.value }, "Đã đổi vai trò")
                    }
                    className="cursor-pointer rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none"
                  >
                    <option value="member">Thành viên</option>
                    <option value="editor">Biên tập</option>
                    <option value="admin">Quản trị</option>
                  </select>

                  <Button size="sm" variant="ghost" onClick={() => resetPassword(account)}>
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(account)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
