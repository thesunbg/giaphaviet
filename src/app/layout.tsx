import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Gia Phả Việt - Quản Trị Gia Phả Dòng Họ",
  description: "Hệ thống quản trị gia phả dòng họ Việt Nam",
  appleWebApp: { capable: true, title: "Gia Phả Việt", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
        <Toaster position="top-center" toastOptions={{ style: { fontSize: "14px" } }} />
      </body>
    </html>
  );
}
