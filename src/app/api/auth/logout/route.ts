import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { USER_COOKIE, VIEW_COOKIE } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true });

  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  // Xóa cả phiên tài khoản, phiên mã xem và phiên admin cũ
  response.cookies.set(USER_COOKIE, "", expired);
  response.cookies.set(VIEW_COOKIE, "", expired);
  response.cookies.set(COOKIE_NAME, "", expired);

  return response;
}
