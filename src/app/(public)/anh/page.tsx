import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { AlbumsClient } from "@/components/photos/albums-client";
import { NeedAccount } from "@/components/layout/need-account";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const user = await getCurrentUser();

  if (!user) {
    const viewer = await getViewer();
    return (
      <NeedAccount feature="Album ảnh dòng họ" isLegacyAdmin={viewer?.kind === "legacy-admin"} />
    );
  }

  return <AlbumsClient />;
}
