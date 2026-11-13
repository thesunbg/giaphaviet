"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/utils";

interface ChatMessageItem {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

interface ChatClientProps {
  currentUser: { id: string; name: string };
}

const POLL_MS = 5000;

export function ChatClient({ currentUser }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.data);
      if (data.data.length > 0) {
        lastAtRef.current = data.data[data.data.length - 1].createdAt;
      }
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Hỏi lại máy chủ định kỳ để lấy tin mới
  useEffect(() => {
    const timer = setInterval(async () => {
      if (document.hidden || !lastAtRef.current) return;
      const res = await fetch(`/api/chat?after=${encodeURIComponent(lastAtRef.current)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.data.length === 0) return;

      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...data.data.filter((m: ChatMessageItem) => !seen.has(m.id))];
      });
      lastAtRef.current = data.data[data.data.length - 1].createdAt;
      setTimeout(() => scrollToBottom(), 50);
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [scrollToBottom]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không gửi được tin nhắn");
        return;
      }
      setDraft("");
      setMessages((prev) => [...prev, data.data]);
      lastAtRef.current = data.data.createdAt;
      setTimeout(() => scrollToBottom(), 50);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-3xl flex-col px-4 py-4 md:h-[calc(100dvh-9rem)]">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900">Trò chuyện dòng họ</h1>
        <p className="text-sm text-gray-500">
          Phòng chung cho con cháu trong họ — tin nhắn hiển thị cho mọi thành viên.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        {loading ? (
          <p className="py-10 text-center text-gray-500">Đang tải...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-gray-500">
            Chưa có tin nhắn nào. Hãy gửi lời chào đến cả họ!
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.author.id === currentUser.id;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${mine ? "text-right" : ""}`}>
                  {!mine && (
                    <p className="mb-0.5 text-xs font-medium text-gray-500">
                      {message.author.name}
                    </p>
                  )}
                  <div
                    className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                      mine ? "bg-[#8b4513] text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(message.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Nhập tin nhắn..."
          className="max-h-32 flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-[#8b4513] focus:outline-none"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="cursor-pointer rounded-full bg-[#8b4513] p-3 text-white transition-colors hover:bg-[#6d350f] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Gửi"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
