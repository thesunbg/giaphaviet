import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { ChatClient } from "@/components/chat/chat-client";

import { NeedAccount } from "@/components/layout/need-account";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) {
    const viewer = await getViewer();
    return (
      <NeedAccount feature="Trò chuyện dòng họ" isLegacyAdmin={viewer?.kind === "legacy-admin"} />
    );
  }

  return <ChatClient currentUser={{ id: user.id, name: user.name }} />;
}
