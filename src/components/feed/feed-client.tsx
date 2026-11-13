"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Send,
  ImagePlus,
  Trash2,
  Pin,
  X,
  CalendarHeart,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/utils";

interface Author {
  id: string;
  name: string;
  avatarUrl: string | null;
  role?: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface PostItem {
  id: string;
  content: string;
  images: string[];
  type: string;
  pinned: boolean;
  createdAt: string;
  author: Author;
  onBehalfOf: { id: string; fullName: string } | null;
  comments: CommentItem[];
  reactionCount: number;
  reactedByMe: boolean;
}

interface UpcomingItem {
  type: "anniversary" | "birthday" | "event";
  memberId: string;
  memberName: string;
  label: string;
  rawDate: string;
  calendarType: string;
  solarDate: string;
  daysUntil: number;
}

interface FeedClientProps {
  currentUser: { id: string; name: string; role: string };
}

const TYPE_STYLES: Record<string, string> = {
  anniversary: "bg-amber-50 text-amber-800 border-amber-200",
  birthday: "bg-sky-50 text-sky-800 border-sky-200",
  event: "bg-violet-50 text-violet-800 border-violet-200",
};

const TYPE_LABELS: Record<string, string> = {
  anniversary: "Ngày giỗ",
  birthday: "Sinh nhật",
  event: "Sự kiện",
};

/** Chữ cái đầu của tên gọi (người Việt gọi theo tên cuối): "Nguyễn Văn Cháu" -> "C" */
function initial(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] || "?").toUpperCase();
}

function describeDays(days: number): string {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  return `Còn ${days} ngày`;
}

export function FeedClient({ currentUser }: FeedClientProps) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const isStaff = currentUser.role === "admin" || currentUser.role === "editor";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, upcomingRes] = await Promise.all([
        fetch("/api/feed"),
        fetch("/api/anniversaries?days=45"),
      ]);
      if (feedRes.ok) setPosts((await feedRes.json()).data);
      if (upcomingRes.ok) setUpcoming((await upcomingRes.json()).data);
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
      const uploaded: string[] = [];
      for (const file of files.slice(0, 10)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Không tải được ảnh");
          continue;
        }
        uploaded.push(data.url);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 10));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submitPost(type: "post" | "announcement") {
    if (!content.trim() && images.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc chọn ảnh");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          images,
          type,
          pinned: type === "announcement",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không đăng được bài");
        return;
      }
      setContent("");
      setImages([]);
      toast.success(type === "announcement" ? "Đã đăng thông báo" : "Đã đăng bài");
      load();
    } finally {
      setPosting(false);
    }
  }

  async function toggleReaction(post: PostItem) {
    // cập nhật ngay trên giao diện cho mượt
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              reactedByMe: !p.reactedByMe,
              reactionCount: p.reactionCount + (p.reactedByMe ? -1 : 1),
            }
          : p
      )
    );
    const res = await fetch(`/api/feed/${post.id}/reactions`, { method: "POST" });
    if (!res.ok) load();
  }

  async function submitComment(postId: string) {
    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;

    const res = await fetch(`/api/feed/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Không gửi được bình luận");
      return;
    }
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, data.data] } : p))
    );
  }

  async function deletePost(post: PostItem) {
    if (!confirm("Xóa bài đăng này?")) return;
    const res = await fetch(`/api/feed/${post.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Không xóa được");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    toast.success("Đã xóa bài");
  }

  async function deleteComment(postId: string, commentId: string) {
    const res = await fetch(`/api/feed/${postId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xóa được bình luận");
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
      )
    );
  }

  async function togglePin(post: PostItem) {
    const res = await fetch(`/api/feed/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !post.pinned }),
    });
    if (!res.ok) {
      toast.error("Không ghim được bài");
      return;
    }
    load();
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3">
      {/* ===== Cột chính: đăng bài + danh sách bài ===== */}
      <div className="space-y-5 lg:col-span-2">
        <Card className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${currentUser.name} ơi, hôm nay dòng họ có gì mới?`}
            className="h-24 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute -right-1.5 -top-1.5 cursor-pointer rounded-full bg-gray-900/80 p-1 text-white"
                    aria-label="Bỏ ảnh"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5 text-[#8b4513]" />
              {uploading ? "Đang tải ảnh..." : "Thêm ảnh"}
            </button>

            <div className="flex gap-2">
              {isStaff && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => submitPost("announcement")}
                  disabled={posting}
                >
                  <Megaphone className="mr-1 h-4 w-4" />
                  Thông báo
                </Button>
              )}
              <Button size="sm" onClick={() => submitPost("post")} disabled={posting}>
                <Send className="mr-1 h-4 w-4" />
                {posting ? "Đang đăng..." : "Đăng"}
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <p className="py-10 text-center text-gray-500">Đang tải...</p>
        ) : posts.length === 0 ? (
          <Card className="py-10 text-center text-gray-500">
            Chưa có bài đăng nào. Hãy là người đầu tiên chia sẻ với dòng họ!
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8b4513]/10 font-bold text-[#8b4513]">
                    {initial(post.author.name)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {post.author.name}
                      {post.onBehalfOf && (
                        <span className="font-normal text-gray-500">
                          {" "}
                          · đăng thay {post.onBehalfOf.fullName}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {timeAgo(post.createdAt)}
                      {post.type === "announcement" && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                          Thông báo
                        </span>
                      )}
                      {post.pinned && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[#8b4513]">
                          <Pin className="h-3 w-3" /> Đã ghim
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isStaff && (
                    <button
                      onClick={() => togglePin(post)}
                      className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-[#8b4513]"
                      aria-label="Ghim bài"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                  )}
                  {(post.author.id === currentUser.id || currentUser.role === "admin") && (
                    <button
                      onClick={() => deletePost(post)}
                      className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-red-600"
                      aria-label="Xóa bài"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {post.content && (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
                  {post.content}
                </p>
              )}

              {post.images.length > 0 && (
                <div
                  className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {post.images.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="max-h-96 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
                <button
                  onClick={() => toggleReaction(post)}
                  className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-500"
                >
                  <Heart
                    className={`h-5 w-5 ${post.reactedByMe ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {post.reactionCount > 0 && post.reactionCount}
                </button>
                <button
                  onClick={() =>
                    setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                  }
                  className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#8b4513]"
                >
                  <MessageCircle className="h-5 w-5" />
                  {post.comments.length > 0 ? post.comments.length : "Bình luận"}
                </button>
              </div>

              {(openComments[post.id] || post.comments.length > 0) && (
                <div className="space-y-3 border-t border-gray-100 pt-3">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {initial(comment.author.name)}
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">
                            {comment.author.name}
                          </span>{" "}
                          <span className="text-xs text-gray-400">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                          {comment.content}
                        </p>
                      </div>
                      {(comment.author.id === currentUser.id ||
                        currentUser.role === "admin") && (
                        <button
                          onClick={() => deleteComment(post.id, comment.id)}
                          className="cursor-pointer p-1 text-gray-300 hover:text-red-500"
                          aria-label="Xóa bình luận"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <input
                      value={commentDrafts[post.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitComment(post.id);
                        }
                      }}
                      placeholder="Viết bình luận..."
                      className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-[#8b4513] focus:outline-none"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      className="cursor-pointer rounded-full bg-[#8b4513] p-2 text-white hover:bg-[#6d350f]"
                      aria-label="Gửi bình luận"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* ===== Cột phải: ngày giỗ / sinh nhật sắp tới ===== */}
      <div className="space-y-5">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CalendarHeart className="h-5 w-5 text-[#8b4513]" />
            Sắp tới trong 45 ngày
          </h2>

          {upcoming.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Không có ngày giỗ hay sinh nhật nào sắp tới.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 12).map((item, index) => (
                <Link
                  key={`${item.memberId}-${item.type}-${index}`}
                  href={`/thanh-vien/${item.memberId}`}
                  className={`block rounded-lg border p-3 transition-colors hover:brightness-95 ${TYPE_STYLES[item.type]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                      {TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-xs font-bold">{describeDays(item.daysUntil)}</span>
                  </div>
                  <p className="mt-0.5 font-medium">{item.label}</p>
                  <p className="text-xs opacity-80">
                    {new Date(item.solarDate).toLocaleDateString("vi-VN")} (dương lịch)
                    {item.calendarType === "lunar" && ` · ${item.rawDate}`}
                  </p>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/lich"
            className="mt-3 block text-center text-sm font-medium text-[#8b4513] hover:underline"
          >
            Xem toàn bộ lịch gia đình
          </Link>
        </Card>
      </div>
    </div>
  );
}
