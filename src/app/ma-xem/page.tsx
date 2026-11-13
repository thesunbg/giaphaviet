"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TreePine } from "lucide-react";

/**
 * Trang nhập "mã xem gia phả" dành cho các cụ / người không lập tài khoản.
 * Chữ to, ô nhập to, bàn phím số — con cháu nhập hộ một lần, máy nhớ 1 năm.
 */
export default function ViewCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/view-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi");
        return;
      }

      router.push("/gia-pha");
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8b4513]/10">
            <TreePine className="h-9 w-9 text-[#8b4513]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Xem Gia Phả</h1>
          <p className="text-base text-gray-600">
            Nhập mã do con cháu trong họ cung cấp
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="● ● ● ● ● ●"
            autoFocus
            className="w-full rounded-xl border-2 border-gray-300 px-4 py-5 text-center text-3xl font-bold tracking-[0.4em] text-gray-900 placeholder-gray-300 focus:border-[#8b4513] focus:outline-none"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-base text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full cursor-pointer rounded-xl bg-[#8b4513] py-4 text-lg font-bold text-white transition-colors hover:bg-[#6d350f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Đang mở..." : "Xem Gia Phả"}
          </button>
        </form>

        <p className="mt-6 text-center text-base text-gray-500">
          Nhập một lần, lần sau mở là xem được ngay.
        </p>

        <p className="mt-4 text-center text-sm text-gray-500">
          Có tài khoản riêng?{" "}
          <Link href="/dang-nhap" className="font-medium text-[#8b4513] hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>
      </Card>
    </div>
  );
}
