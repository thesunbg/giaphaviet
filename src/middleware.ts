import { NextRequest, NextResponse } from "next/server";
import {
  USER_COOKIE,
  VIEW_COOKIE,
  LEGACY_ADMIN_COOKIE,
  verifySession,
} from "@/lib/session";

/** Trang ai cũng vào được (chưa đăng nhập) */
const PUBLIC_PATHS = ["/dang-nhap", "/dang-ky", "/ma-xem", "/admin/login"];

/** API ai cũng gọi được (đăng nhập, đăng ký, nhập mã xem, đăng xuất) */
const PUBLIC_API_PREFIX = "/api/auth/";

/** Khu vực chỉ dành cho tài khoản thật (mã xem chỉ được xem gia phả) */
const MEMBER_ONLY_PATHS = [
  "/feed",
  "/chat",
  "/anh",
  "/quy-ho",
  "/api/feed",
  "/api/chat",
  "/api/photos",
  "/api/albums",
  "/api/funds",
  "/api/contributions",
  "/api/upload",
];

/** Khu vực quản trị */
const ADMIN_PATHS = ["/admin", "/api/admin", "/api/import", "/api/export"];

/** Token HMAC kiểu cũ (đăng nhập chỉ bằng ADMIN_PASSWORD) */
async function verifyLegacyToken(token: string): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("admin-session"));
    const expected = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (token.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < token.length; i++) {
      mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function unauthorized(request: NextRequest, pathname: string, loginPath = "/dang-nhap") {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để tiếp tục." },
      { status: 401 }
    );
  }
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith(PUBLIC_API_PREFIX)) {
    return NextResponse.next();
  }

  const userSession = await verifySession(request.cookies.get(USER_COOKIE)?.value);
  const legacyToken = request.cookies.get(LEGACY_ADMIN_COOKIE)?.value;
  const isLegacyAdmin = legacyToken ? await verifyLegacyToken(legacyToken) : false;
  const viewSession = userSession
    ? null
    : await verifySession(request.cookies.get(VIEW_COOKIE)?.value);

  const isUser = userSession?.kind === "user";
  const isViewer = viewSession?.kind === "viewer";
  const isAdmin = isLegacyAdmin || userSession?.role === "admin";
  const isEditor = isAdmin || userSession?.role === "editor";

  // Chưa đăng nhập bằng bất kỳ hình thức nào
  if (!isUser && !isViewer && !isLegacyAdmin) {
    return unauthorized(request, pathname);
  }

  // Khu vực quản trị
  if (startsWithAny(pathname, ADMIN_PATHS)) {
    if (!isEditor) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Bạn không có quyền truy cập khu vực quản trị." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/gia-pha", request.url));
    }
    return NextResponse.next();
  }

  // Khu vực tương tác nội bộ: mã xem không được vào
  if (startsWithAny(pathname, MEMBER_ONLY_PATHS) && !isUser && !isLegacyAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Tính năng này cần tài khoản cá nhân." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/gia-pha", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Bảo vệ toàn bộ site, trừ:
     * - tài nguyên tĩnh của Next.js (_next)
     * - favicon và vài file svg mặc định
     * Ảnh trong /uploads VẪN được bảo vệ: chỉ người đã đăng nhập mới xem được.
     */
    "/((?!_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)",
  ],
};
