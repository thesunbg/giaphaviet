import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { AlbumDetailClient } from "@/components/photos/album-detail-client";
import { NeedAccount } from "@/components/layout/need-account";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    const viewer = await getViewer();
    return (
      <NeedAccount feature="Album ảnh dòng họ" isLegacyAdmin={viewer?.kind === "legacy-admin"} />
    );
  }

  const { id } = await params;

  return (
    <AlbumDetailClient
      albumId={id === "chua-xep" ? null : id}
      currentUser={{ id: user.id, name: user.name, role: user.role }}
    />
  );
}
