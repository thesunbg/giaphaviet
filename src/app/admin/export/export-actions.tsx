"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export function ExportActions() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchJson(): Promise<string | null> {
    const res = await fetch("/api/export?format=json&download=0");
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Không thể tải dữ liệu" }));
      toast.error(data.error || "Không thể tải dữ liệu");
      return null;
    }
    return res.text();
  }

  async function handlePreview() {
    if (preview) {
      setPreview(null);
      return;
    }
    setLoading(true);
    const text = await fetchJson();
    if (text) setPreview(text);
    setLoading(false);
  }

  async function handleCopy() {
    setLoading(true);
    const text = await fetchJson();
    setLoading(false);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy JSON vào clipboard");
    } catch {
      setPreview(text);
      toast.error("Trình duyệt không cho copy. Hãy copy thủ công từ ô bên dưới.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handlePreview} disabled={loading}>
          {preview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {preview ? "Ẩn xem trước" : loading ? "Đang tải..." : "Xem trước JSON"}
        </Button>
        <Button variant="outline" onClick={handleCopy} disabled={loading}>
          <Copy className="mr-2 h-4 w-4" />
          Copy JSON
        </Button>
      </div>

      {preview && (
        <textarea
          readOnly
          value={preview}
          onClick={(e) => e.currentTarget.select()}
          className="h-80 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs"
        />
      )}
    </div>
  );
}
