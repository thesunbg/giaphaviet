"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Plus, X, ChevronRight, Users, Lock } from "lucide-react";
import toast from "react-hot-toast";

interface FundItem {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  targetAmount: number | null;
  isOpen: boolean;
  total: number;
  contributorCount: number;
  entryCount: number;
}

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function FundsClient() {
  const [funds, setFunds] = useState<FundItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    year: String(new Date().getFullYear()),
    targetAmount: "",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/funds");
      if (res.ok) {
        const data = await res.json();
        setFunds(data.data);
        setCanEdit(data.canEdit);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createFund(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên đợt đóng góp");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetAmount: form.targetAmount.replace(/[^\d]/g, "") || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không tạo được");
        return;
      }
      toast.success("Đã tạo đợt đóng góp");
      setForm({ name: "", year: String(new Date().getFullYear()), targetAmount: "", description: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const grandTotal = funds.reduce((sum, f) => sum + f.total, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-4 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
            <Wallet className="h-5 w-5 text-[#8b4513] sm:h-6 sm:w-6" />
            Quỹ Dòng Họ
          </h1>
          <p className="text-sm text-gray-500">
            Sổ đóng góp của các đợt: giỗ tổ, tu sửa từ đường, khuyến học...
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <>
                <X className="mr-1.5 h-4 w-4" /> Đóng
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" /> Tạo đợt mới
              </>
            )}
          </Button>
        )}
      </div>

      {showForm && canEdit && (
        <Card>
          <form onSubmit={createFund} className="space-y-3">
            <Input
              label="Tên đợt đóng góp *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Quỹ giỗ tổ năm 2026"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Năm"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
              <Input
                label="Mục tiêu (VNĐ)"
                inputMode="numeric"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="VD: 50000000"
              />
            </div>
            <Input
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Dùng vào việc gì..."
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Đang tạo..." : "Tạo đợt đóng góp"}
            </Button>
          </form>
        </Card>
      )}

      {funds.length > 0 && (
        <Card className="bg-[#8b4513]/5">
          <p className="text-sm text-gray-600">Tổng thu tất cả các đợt</p>
          <p className="text-2xl font-bold text-[#8b4513]">{formatVnd(grandTotal)}</p>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-gray-500">Đang tải...</p>
      ) : funds.length === 0 ? (
        <Card className="flex flex-col items-center py-10 text-center text-sm text-gray-500">
          <Wallet className="mb-3 h-10 w-10 text-gray-300" />
          Chưa có đợt đóng góp nào.
          {canEdit && " Bấm “Tạo đợt mới” để mở sổ."}
        </Card>
      ) : (
        <div className="space-y-3">
          {funds.map((fund) => {
            const percent = fund.targetAmount
              ? Math.min(100, Math.round((fund.total / fund.targetAmount) * 100))
              : null;

            return (
              <Link
                key={fund.id}
                href={`/quy-ho/${fund.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition-colors active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                      {fund.name}
                      {!fund.isOpen && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                          <Lock className="h-3 w-3" /> Đã đóng
                        </span>
                      )}
                    </p>
                    {fund.description && (
                      <p className="mt-0.5 truncate text-sm text-gray-500">{fund.description}</p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {fund.contributorCount} người · {fund.entryCount} lượt
                      </span>
                      {fund.year && <span>Năm {fund.year}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-[#8b4513]">{formatVnd(fund.total)}</p>
                    {fund.targetAmount && (
                      <p className="text-[11px] text-gray-500">
                        / {formatVnd(fund.targetAmount)}
                      </p>
                    )}
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-gray-300" />
                  </div>
                </div>

                {percent !== null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#8b4513]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
