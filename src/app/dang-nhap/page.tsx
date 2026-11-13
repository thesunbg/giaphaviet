"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TreePine, Eye, EyeOff, KeyRound } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/gia-pha";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8b4513]/10">
          <TreePine className="h-7 w-7 text-[#8b4513]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Đăng Nhập</h1>
        <p className="text-sm text-gray-500">
          Gia phả dòng họ chỉ dành cho người trong họ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="phone"
          label="Số điện thoại"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0912345678"
          autoFocus
        />

        <div className="relative">
          <Input
            id="password"
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
        </Button>
      </form>

      <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-center text-sm">
        <p className="text-gray-600">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="font-medium text-[#8b4513] hover:underline">
            Đăng ký bằng mã mời
          </Link>
        </p>
        <Link
          href="/ma-xem"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
        >
          <KeyRound className="h-4 w-4" />
          Xem gia phả bằng mã (cho các cụ)
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
