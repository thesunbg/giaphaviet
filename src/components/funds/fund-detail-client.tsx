"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Download,
  ClipboardPaste,
  Check,
  X,
  Pencil,
  Users,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatVnd } from "./funds-client";

interface ContributionRow {
  id: string;
  contributorName: string;
  amount: number;
  paidAt: string | null;
  method: string | null;
  note: string | null;
  member: { id: string; fullName: string; generation: number } | null;
}

interface FundData {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  targetAmount: number | null;
  isOpen: boolean;
  total: number;
  contributions: ContributionRow[];
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

const EMPTY_DRAFT = { contributorName: "", amount: "", paidAt: "", method: "", note: "" };

/** "1.500.000 đ" -> 1500000 */
function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function FundDetailClient({ fundId }: { fundId: string }) {
  const router = useRouter();
  const [fund, setFund] = useState<FundData | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ ...EMPTY_DRAFT });
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/funds/${fundId}`);
      if (!res.ok) {
        toast.error("Không tìm thấy đợt đóng góp");
        return;
      }
      const data = await res.json();
      setFund(data.data);
      setCanEdit(data.canEdit);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addRow() {
    if (!draft.contributorName.trim() || !digitsOnly(draft.amount)) {
      toast.error("Nhập họ tên và số tiền");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/funds/${fundId}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, amount: digitsOnly(draft.amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không ghi được");
        return;
      }
      // giữ lại ngày và hình thức để nhập nhanh dòng tiếp theo
      setDraft({ ...EMPTY_DRAFT, paidAt: draft.paidAt, method: draft.method });
      nameInputRef.current?.focus();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/contributions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editDraft, amount: digitsOnly(editDraft.amount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không sửa được");
      return;
    }
    setEditingId(null);
    load();
  }

  async function removeRow(row: ContributionRow) {
    if (!confirm(`Xóa dòng của ${row.contributorName}?`)) return;
    const res = await fetch(`/api/contributions/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xóa được");
      return;
    }
    load();
  }

  async function removeFund() {
    if (!fund) return;
    if (!confirm(`Xóa đợt "${fund.name}" và toàn bộ sổ đóng góp của đợt này?`)) return;
    const res = await fetch(`/api/funds/${fundId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xóa được");
      return;
    }
    toast.success("Đã xóa đợt đóng góp");
    router.push("/quy-ho");
  }

  /** Dán nhiều dòng từ Excel: Họ tên [tab] Số tiền [tab] Ngày [tab] Ghi chú */
  async function importPaste() {
    const rows = pasteText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const cells = line.split(/\t|;|,(?=\s*\d)|\s{2,}/).map((c) => c.trim());
        return {
          contributorName: cells[0] || "",
          amount: digitsOnly(cells[1] || ""),
          paidAt: cells[2] || null,
          note: cells[3] || null,
        };
      })
      .filter((row) => row.contributorName && row.amount);

    if (rows.length === 0) {
      toast.error("Không đọc được dòng nào. Mỗi dòng: Họ tên [tab] Số tiền");
      return;
    }

    const res = await fetch(`/api/funds/${fundId}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không nhập được");
      return;
    }

    toast.success(`Đã thêm ${data.inserted} dòng`);
    if (data.errors?.length) toast.error(`${data.errors.length} dòng bị bỏ qua`);
    setPasteText("");
    setShowPaste(false);
    load();
  }

  if (loading) return <p className="py-10 text-center text-gray-500">Đang tải...</p>;
  if (!fund) return <p className="py-10 text-center text-gray-500">Không tìm thấy đợt đóng góp</p>;

  const percent = fund.targetAmount
    ? Math.min(100, Math.round((fund.total / fund.targetAmount) * 100))
    : null;
  const contributorCount = new Set(fund.contributions.map((c) => c.contributorName)).size;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-4 sm:py-6">
      <Link
        href="/quy-ho"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#8b4513]"
      >
        <ChevronLeft className="h-4 w-4" />
        Tất cả đợt đóng góp
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{fund.name}</h1>
          {fund.description && <p className="text-sm text-gray-500">{fund.description}</p>}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/funds/${fundId}/export`}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#8b4513] px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-colors hover:bg-[#8b4513] hover:text-white"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Xuất Excel
          </a>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={removeFund}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3">
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Wallet className="h-3.5 w-3.5" /> Đã thu
          </p>
          <p className="text-lg font-bold text-[#8b4513] sm:text-xl">{formatVnd(fund.total)}</p>
          {fund.targetAmount && (
            <p className="text-[11px] text-gray-500">
              Mục tiêu {formatVnd(fund.targetAmount)} ({percent}%)
            </p>
          )}
        </Card>
        <Card className="!p-3">
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" /> Người đóng
          </p>
          <p className="text-lg font-bold text-gray-900 sm:text-xl">{contributorCount}</p>
          <p className="text-[11px] text-gray-500">{fund.contributions.length} lượt đóng</p>
        </Card>
      </div>

      {percent !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#8b4513]" style={{ width: `${percent}%` }} />
        </div>
      )}

      {/* ===== Nhập nhanh ===== */}
      {canEdit && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ghi sổ</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowPaste((v) => !v)}>
              <ClipboardPaste className="mr-1.5 h-4 w-4" />
              Dán từ Excel
            </Button>
          </div>

          {showPaste ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Copy các dòng từ Excel rồi dán vào đây. Mỗi dòng: <strong>Họ tên</strong> |
                <strong> Số tiền</strong> | Ngày (tùy chọn) | Ghi chú (tùy chọn).
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                placeholder={"Nguyễn Văn A\t500000\t2026-03-10\tĐóng tại từ đường\nNguyễn Thị B\t1000000"}
                className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs focus:border-[#8b4513] focus:outline-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={importPaste}>
                  <Check className="mr-1.5 h-4 w-4" />
                  Nhập vào sổ
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowPaste(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <input
                ref={nameInputRef}
                value={draft.contributorName}
                onChange={(e) => setDraft({ ...draft, contributorName: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addRow()}
                placeholder="Họ tên *"
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
              />
              <input
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addRow()}
                inputMode="numeric"
                placeholder="Số tiền *"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
              />
              <input
                type="date"
                value={draft.paidAt}
                onChange={(e) => setDraft({ ...draft, paidAt: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
              />
              <select
                value={draft.method}
                onChange={(e) => setDraft({ ...draft, method: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
              >
                <option value="">Hình thức</option>
                <option value="cash">Tiền mặt</option>
                <option value="transfer">Chuyển khoản</option>
              </select>
              <Button onClick={addRow} disabled={saving} size="sm" className="w-full">
                <Plus className="mr-1 h-4 w-4" />
                Thêm
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ===== Sổ đóng góp ===== */}
      <Card className="!p-0">
        {fund.contributions.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Chưa có ai đóng góp trong đợt này.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Hàng tiêu đề chỉ hiện trên màn hình rộng */}
            <div className="hidden grid-cols-12 gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 sm:grid">
              <span className="col-span-1">STT</span>
              <span className="col-span-3">Họ tên</span>
              <span className="col-span-3 text-right">Số tiền</span>
              <span className="col-span-2 pl-3">Ngày</span>
              <span className="col-span-2 pl-2">Hình thức</span>
              <span className="col-span-1" />
            </div>

            {fund.contributions.map((row, index) =>
              editingId === row.id ? (
                <div key={row.id} className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-6">
                  <input
                    value={editDraft.contributorName}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, contributorName: e.target.value })
                    }
                    className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    value={editDraft.amount}
                    onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                    inputMode="numeric"
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    value={editDraft.paidAt}
                    onChange={(e) => setEditDraft({ ...editDraft, paidAt: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    value={editDraft.note}
                    onChange={(e) => setEditDraft({ ...editDraft, note: e.target.value })}
                    placeholder="Ghi chú"
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => saveEdit(row.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={row.id}
                  className="flex items-center gap-2 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:px-4"
                >
                  <span className="hidden text-sm text-gray-400 sm:col-span-1 sm:block">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 sm:col-span-3">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {row.contributorName}
                    </p>
                    <p className="text-xs text-gray-500 sm:hidden">
                      {row.paidAt && new Date(row.paidAt).toLocaleDateString("vi-VN")}
                      {row.method && ` · ${METHOD_LABELS[row.method] || row.method}`}
                    </p>
                    {row.note && <p className="truncate text-xs text-gray-400">{row.note}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[#8b4513] sm:col-span-3 sm:text-right">
                    {formatVnd(row.amount)}
                  </span>
                  <span className="hidden text-sm text-gray-500 sm:col-span-2 sm:block sm:pl-3">
                    {row.paidAt ? new Date(row.paidAt).toLocaleDateString("vi-VN") : "—"}
                  </span>
                  <span className="hidden whitespace-nowrap text-sm text-gray-500 sm:col-span-2 sm:block sm:pl-2">
                    {row.method ? METHOD_LABELS[row.method] || row.method : "—"}
                  </span>
                  {canEdit && (
                    <span className="flex shrink-0 gap-0.5 sm:col-span-1 sm:justify-end">
                      <button
                        onClick={() => {
                          setEditingId(row.id);
                          setEditDraft({
                            contributorName: row.contributorName,
                            amount: String(row.amount),
                            paidAt: row.paidAt || "",
                            method: row.method || "",
                            note: row.note || "",
                          });
                        }}
                        className="cursor-pointer rounded p-1.5 text-gray-400 hover:text-[#8b4513]"
                        aria-label="Sửa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeRow(row)}
                        className="cursor-pointer rounded p-1.5 text-gray-400 hover:text-red-500"
                        aria-label="Xóa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              )
            )}

            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 font-semibold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-[#8b4513]">{formatVnd(fund.total)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
