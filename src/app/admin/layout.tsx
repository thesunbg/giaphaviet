import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getViewer, isEditor } from "@/lib/user-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewer, editor] = await Promise.all([getViewer(), isEditor()]);

  // Trang đăng nhập (và người chưa có quyền) hiển thị không có sidebar
  if (!editor) {
    return <>{children}</>;
  }

  const currentName =
    viewer?.kind === "user" ? viewer.user.name : viewer?.kind === "legacy-admin" ? "Quản trị" : "";
  const isAdmin = viewer?.kind === "legacy-admin" || viewer?.kind === "user" && viewer.user.role === "admin";

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <AdminSidebar userName={currentName} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">{children}</main>
    </div>
  );
}
