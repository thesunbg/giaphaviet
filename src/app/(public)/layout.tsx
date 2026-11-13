import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getViewer } from "@/lib/user-auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  const isMember = viewer?.kind === "user" || viewer?.kind === "legacy-admin";

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mobile-nav-pad flex-1">{children}</main>
      <Footer />
      <MobileNav isMember={isMember} />
    </div>
  );
}
