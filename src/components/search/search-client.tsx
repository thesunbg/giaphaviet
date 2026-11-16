"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, UserRound, MapPin, Users, Heart, Loader2 } from "lucide-react";

interface SearchHit {
  id: string;
  fullName: string;
  gender: string;
  generation: number;
  birthDate: string | null;
  deathDate: string | null;
  isAlive: boolean;
  occupation: string | null;
  address: string | null;
  province: string | null;
  photoUrl: string | null;
  parents: string[];
  spouses: string[];
  childrenCount: number;
  matchedBy: string;
}

function lifeSpan(hit: SearchHit): string {
  if (hit.birthDate && hit.deathDate) return `${hit.birthDate} – ${hit.deathDate}`;
  if (hit.birthDate) return hit.isAlive ? `Sinh ${hit.birthDate}` : `${hit.birthDate} – ?`;
  if (hit.deathDate) return `? – ${hit.deathDate}`;
  return ""; // đã có thẻ "Đã mất" bên cạnh tên
}

export function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery || searchParams.get("q") || "");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setHits([]);
      setSearched(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = await res.json();
      // bỏ qua kết quả của lần gõ cũ
      if (id !== requestId.current) return;
      setHits(data.data);
      setSearched(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // gõ xong 250ms mới tìm
  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  // giữ từ khóa trên URL để chia sẻ / quay lại
  useEffect(() => {
    const trimmed = query.trim();
    const current = searchParams.get("q") || "";
    if (trimmed === current) return;
    const timer = setTimeout(() => {
      router.replace(trimmed ? `/tim-kiem?q=${encodeURIComponent(trimmed)}` : "/tim-kiem", {
        scroll: false,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Ô tìm kiếm dính trên cùng */}
      <div className="sticky top-14 z-30 bg-[#faf9f6] px-4 pb-3 pt-4 md:top-16">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên trong dòng họ..."
            autoFocus
            enterKeyHint="search"
            className="w-full rounded-full border border-gray-300 bg-white py-3.5 pl-12 pr-11 text-base shadow-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-gray-400 active:bg-gray-100"
              aria-label="Xóa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="mt-2 px-1 text-xs text-gray-500">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Đang tìm...
            </span>
          ) : searched ? (
            `${hits.length} kết quả${hits.length === 30 ? " đầu tiên" : ""}`
          ) : (
            "Gõ không dấu cũng được, ví dụ: nguyen van do"
          )}
        </p>
      </div>

      <div className="space-y-2 px-4 pb-6">
        {!searched && !loading && (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Nhập tên để tra cứu người trong dòng họ.
            <br />
            Kết quả hiện kèm đời, năm sinh/mất, cha mẹ và vợ/chồng.
          </div>
        )}

        {searched && !loading && hits.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Không tìm thấy ai khớp với <strong>{query}</strong>.
            <br />
            Thử gõ ít chữ hơn, ví dụ chỉ tên gọi.
          </div>
        )}

        {hits.map((hit) => (
          <Link
            key={hit.id}
            href={`/thanh-vien/${hit.id}`}
            className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors active:bg-gray-50"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                hit.gender === "female" ? "bg-pink-50 text-pink-500" : "bg-blue-50 text-blue-500"
              }`}
            >
              {hit.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hit.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-6 w-6" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-gray-900">{hit.fullName}</span>
                <span className="rounded-full bg-[#8b4513]/10 px-2 py-0.5 text-[11px] font-medium text-[#8b4513]">
                  Đời {hit.generation}
                </span>
                {!hit.isAlive && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                    Đã mất
                  </span>
                )}
              </div>

              {lifeSpan(hit) && (
                <p className="mt-0.5 text-xs text-gray-500">{lifeSpan(hit)}</p>
              )}

              <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                {hit.parents.length > 0 && (
                  <p className="truncate">
                    <span className="text-gray-400">Con của:</span> {hit.parents.join(", ")}
                  </p>
                )}
                {hit.spouses.length > 0 && (
                  <p className="flex items-center gap-1 truncate">
                    <Heart className="h-3 w-3 shrink-0 text-gray-400" />
                    {hit.spouses.join(", ")}
                  </p>
                )}
                <p className="flex flex-wrap items-center gap-x-3 text-gray-500">
                  {hit.childrenCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      {hit.childrenCount} người con
                    </span>
                  )}
                  {(hit.province || hit.address) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {hit.province || hit.address}
                    </span>
                  )}
                  {hit.occupation && <span>{hit.occupation}</span>}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
