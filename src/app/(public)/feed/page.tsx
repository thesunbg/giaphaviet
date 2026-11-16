import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { FeedClient } from "@/components/feed/feed-client";

import { NeedAccount } from "@/components/layout/need-account";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getCurrentUser();

  if (!user) {
    const viewer = await getViewer();
    return (
      <NeedAccount feature="Bảng tin dòng họ" isLegacyAdmin={viewer?.kind === "legacy-admin"} />
    );
  }

  return <FeedClient currentUser={{ id: user.id, name: user.name, role: user.role }} />;
}
