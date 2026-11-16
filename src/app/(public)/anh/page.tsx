import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { GalleryClient } from "@/components/photos/gallery-client";

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

  return <GalleryClient currentUser={{ id: user.id, name: user.name, role: user.role }} />;
}
