import { Suspense } from "react";
import { SearchClient } from "@/components/search/search-client";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <Suspense fallback={null}>
      <SearchClient initialQuery={q || ""} />
    </Suspense>
  );
}
