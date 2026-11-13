import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { ChatClient } from "@/components/chat/chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/gia-pha");

  return <ChatClient currentUser={{ id: user.id, name: user.name }} />;
}
