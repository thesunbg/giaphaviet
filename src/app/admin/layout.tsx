import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { isAuthenticated } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">{children}</main>
    </div>
  );
}
