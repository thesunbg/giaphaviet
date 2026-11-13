"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, X, Images } from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/utils";

interface PhotoItem {
  id: string;
  url: string;
  caption: string | null;
  takenAt: string | null;
  createdAt: string;
  member: { id: string; fullName: string } | null;
  uploadedBy: { id: string; name: string } | null;
}

interface GalleryClientProps {
  currentUser: { id: string; name: string; role: string };
}

export function GalleryClient({ currentUser }: GalleryClientProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<PhotoItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photos");
      if (res.ok) setPhotos((await res.json()).data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 20)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Không tải được ảnh");
          continue;
        }
        urls.push(data.url);
      }

      if (urls.length === 0) return;

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, caption }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không lưu được ảnh");
        return;
      }

      toast.success(`Đã thêm ${urls.length} ảnh`);
      setCaption("");
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(photo: PhotoItem) {
    if (!confirm("Xóa ảnh này?")) return;
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Không xóa được ảnh");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setPreview(null);
    toast.success("Đã xóa ảnh");
  }

  const canDelete = (photo: PhotoItem) =>
    photo.uploadedBy?.id === currentUser.id || currentUser.role !== "member";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Album Ảnh Dòng Họ</h1>
        <p className="text-sm text-gray-500">
          Ảnh giỗ chạp, họp họ, nhà thờ họ... do con cháu trong họ đóng góp.
        </p>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Chú thích cho ảnh sắp tải lên (tùy chọn)
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="VD: Giỗ tổ năm 2025 tại nhà thờ họ"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {uploading ? "Đang tải lên..." : "Tải ảnh lên"}
          </Button>
        </div>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Đang tải...</p>
      ) : photos.length === 0 ? (
        <Card className="flex flex-col items-center py-12 text-center text-gray-500">
          <Images className="mb-3 h-10 w-10 text-gray-300" />
          <p>Chưa có ảnh nào. Hãy là người đầu tiên đóng góp ảnh cho dòng họ!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setPreview(photo)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || ""}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              {photo.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white">
                  {photo.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Xem ảnh lớn */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-full w-full max-w-3xl overflow-hidden rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {preview.caption || "Ảnh dòng họ"}
                </p>
                <p className="text-xs text-gray-500">
                  {preview.uploadedBy ? `${preview.uploadedBy.name} · ` : ""}
                  {timeAgo(preview.createdAt)}
                  {preview.member && (
                    <>
                      {" · "}
                      <Link
                        href={`/thanh-vien/${preview.member.id}`}
                        className="text-[#8b4513] hover:underline"
                      >
                        {preview.member.fullName}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {canDelete(preview) && (
                  <button
                    onClick={() => remove(preview)}
                    className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-600"
                    aria-label="Xóa ảnh"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-50"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.caption || ""} className="max-h-[75dvh] w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
