"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, X, Images, ChevronLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/utils";

interface PhotoItem {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
  member: { id: string; fullName: string } | null;
  uploadedBy: { id: string; name: string } | null;
}

interface AlbumInfo {
  id: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  createdById: string | null;
}

interface Props {
  /** null = trang "Ảnh lẻ" (ảnh chưa thuộc album nào) */
  albumId: string | null;
  currentUser: { id: string; name: string; role: string };
}

export function AlbumDetailClient({ albumId, currentUser }: Props) {
  const router = useRouter();
  const [album, setAlbum] = useState<AlbumInfo | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<PhotoItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (albumId) {
        const res = await fetch(`/api/albums/${albumId}`);
        if (res.ok) {
          const { data } = await res.json();
          setAlbum(data);
          setPhotos(data.photos);
        } else {
          toast.error("Không tìm thấy album");
        }
      } else {
        const res = await fetch("/api/photos?albumId=none");
        if (res.ok) setPhotos((await res.json()).data);
      }
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      const urls: string[] = [];
      let failed = 0;

      for (const [index, file] of files.entries()) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
        if (!res.ok) {
          failed++;
          toast.error(`${file.name}: ${data.error || "không tải lên được"}`);
        } else {
          urls.push(data.url);
        }
        setProgress({ done: index + 1, total: files.length });
      }

      if (urls.length === 0) return;

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, caption, albumId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không lưu được ảnh");
        return;
      }

      toast.success(
        `Đã thêm ${urls.length} ảnh${failed > 0 ? `, ${failed} ảnh lỗi` : ""}`
      );
      setCaption("");
      load();
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(photo: PhotoItem) {
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

  async function removeAlbum() {
    if (!album) return;
    if (
      !confirm(
        `Xóa album "${album.name}"? Ảnh trong album không bị xóa, sẽ chuyển về mục "Ảnh lẻ".`
      )
    )
      return;

    const res = await fetch(`/api/albums/${album.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Không xóa được album");
      return;
    }
    toast.success("Đã xóa album");
    router.push("/anh");
  }

  const canDeletePhoto = (photo: PhotoItem) =>
    photo.uploadedBy?.id === currentUser.id || currentUser.role !== "member";

  const canManageAlbum =
    album && (album.createdById === currentUser.id || currentUser.role !== "member");

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:py-6">
      <Link
        href="/anh"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#8b4513]"
      >
        <ChevronLeft className="h-4 w-4" />
        Tất cả album
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {albumId ? album?.name || "Album" : "Ảnh lẻ"}
          </h1>
          <p className="text-sm text-gray-500">
            {photos.length} ảnh
            {album?.eventDate && ` · ${new Date(album.eventDate).toLocaleDateString("vi-VN")}`}
            {album?.description && ` · ${album.description}`}
            {!albumId && " · chưa xếp vào album nào"}
          </p>
        </div>
        {canManageAlbum && (
          <Button variant="ghost" size="sm" onClick={removeAlbum}>
            <Trash2 className="mr-1.5 h-4 w-4 text-red-500" />
            Xóa album
          </Button>
        )}
      </div>

      <Card className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Chú thích chung cho đợt ảnh này (tùy chọn)
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="VD: Lễ giỗ tổ tại từ đường"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải {progress.done}/{progress.total}
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                Chọn nhiều ảnh
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Chọn được nhiều ảnh một lần. Ảnh JPEG/PNG/WebP, tối đa 5MB mỗi ảnh.
        </p>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Đang tải...</p>
      ) : photos.length === 0 ? (
        <Card className="flex flex-col items-center py-10 text-center text-sm text-gray-500">
          <Images className="mb-3 h-10 w-10 text-gray-300" />
          Chưa có ảnh nào trong {albumId ? "album này" : "mục này"}.
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setPreview(photo)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || ""}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-full w-full max-w-3xl overflow-hidden rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {preview.caption || "Ảnh dòng họ"}
                </p>
                <p className="text-xs text-gray-500">
                  {preview.uploadedBy ? `${preview.uploadedBy.name} · ` : ""}
                  {timeAgo(preview.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {canDeletePhoto(preview) && (
                  <button
                    onClick={() => removePhoto(preview)}
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
            <img
              src={preview.url}
              alt={preview.caption || ""}
              className="max-h-[75dvh] w-full bg-gray-50 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
