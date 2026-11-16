"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Images, Calendar, ChevronRight, X } from "lucide-react";
import toast from "react-hot-toast";

interface AlbumItem {
  id: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  coverUrl: string | null;
  photoCount: number;
  createdBy: { id: string; name: string } | null;
}

export function AlbumsClient() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loosePhotos, setLoosePhotos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", eventDate: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.data);
        setLoosePhotos(data.loosePhotos);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên album");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không tạo được album");
        return;
      }
      toast.success("Đã tạo album");
      setForm({ name: "", eventDate: "", description: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Album Ảnh Dòng Họ</h1>
          <p className="text-sm text-gray-500">
            Ảnh giỗ chạp, họp họ, nhà thờ họ... do con cháu đóng góp
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          {showForm ? (
            <>
              <X className="mr-1.5 h-4 w-4" /> Đóng
            </>
          ) : (
            <>
              <FolderPlus className="mr-1.5 h-4 w-4" /> Tạo album
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={createAlbum} className="space-y-3">
            <Input
              label="Tên album *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Giỗ tổ năm 2026"
              autoFocus
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Ngày diễn ra"
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
              <Input
                label="Mô tả"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Vài dòng về dịp này..."
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang tạo..." : "Tạo album"}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-gray-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/anh/${album.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors active:bg-gray-50"
            >
              <div className="aspect-[4/3] bg-gray-100">
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <Images className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium text-gray-900">{album.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                  <span>{album.photoCount} ảnh</span>
                  {album.eventDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(album.eventDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          ))}

          {/* Ảnh chưa xếp vào album nào */}
          <Link
            href="/anh/chua-xep"
            className="flex flex-col justify-between rounded-xl border border-dashed border-gray-300 bg-white p-3 transition-colors active:bg-gray-50"
          >
            <Images className="h-7 w-7 text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-700">Ảnh lẻ</p>
              <p className="flex items-center justify-between text-[11px] text-gray-500">
                {loosePhotos} ảnh chưa xếp album
                <ChevronRight className="h-3.5 w-3.5" />
              </p>
            </div>
          </Link>
        </div>
      )}

      {!loading && albums.length === 0 && loosePhotos === 0 && (
        <Card className="flex flex-col items-center py-10 text-center text-gray-500">
          <Images className="mb-3 h-10 w-10 text-gray-300" />
          <p className="mb-4 text-sm">Chưa có ảnh nào. Tạo album đầu tiên cho dòng họ!</p>
          <Button onClick={() => setShowForm(true)} size="sm">
            <FolderPlus className="mr-1.5 h-4 w-4" />
            Tạo album
          </Button>
        </Card>
      )}
    </div>
  );
}
