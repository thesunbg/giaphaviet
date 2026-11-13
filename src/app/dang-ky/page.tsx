"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TreePine, CheckCircle, Info } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi");
        return;
      }

      if (data.status === "active") {
        router.push("/gia-pha");
        router.refresh();
        return;
      }

      setDone(data.message);
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] p-4">
        <Card className="w-full max-w-sm p-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h1 className="mb-2 text-lg font-bold text-gray-900">Đã gửi đăng ký</h1>
          <p className="mb-6 text-sm text-gray-600">{done}</p>
          <Link href="/dang-nhap">
            <Button className="w-full">Về trang đăng nhập</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#faf9f6] p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8b4513]/10">
            <TreePine className="h-7 w-7 text-[#8b4513]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Đăng Ký Tài Khoản</h1>
          <p className="text-sm text-gray-500">Cần mã mời do trưởng họ cung cấp</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Họ và tên"
            value={form.name}
            onChange={update("name")}
            placeholder="Nguyễn Văn A"
            autoFocus
          />
          <Input
            id="phone"
            label="Số điện thoại"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={update("phone")}
            placeholder="0912345678"
          />
          <Input
            id="password"
            label="Mật khẩu"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            placeholder="Ít nhất 6 ký tự"
          />
          <Input
            id="inviteCode"
            label="Mã mời"
            value={form.inviteCode}
            onChange={update("inviteCode")}
            placeholder="VD: K7M2PQRS"
            className="uppercase tracking-widest"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Đang gửi..." : "Đăng Ký"}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <p>
            Chưa có mã mời? Hãy liên hệ trưởng họ hoặc người quản trị gia phả để được cấp.
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-medium text-[#8b4513] hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
