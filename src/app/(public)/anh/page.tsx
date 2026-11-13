import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { GalleryClient } from "@/components/photos/gallery-client";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/gia-pha");

  return <GalleryClient currentUser={{ id: user.id, name: user.name, role: user.role }} />;
}
