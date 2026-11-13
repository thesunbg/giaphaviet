import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { FeedClient } from "@/components/feed/feed-client";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getCurrentUser();

  // Mã xem (chỉ xem gia phả) không vào được feed
  if (!user) redirect("/gia-pha");

  return <FeedClient currentUser={{ id: user.id, name: user.name, role: user.role }} />;
}
