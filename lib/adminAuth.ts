import { NextRequest } from "next/server";

const COOKIE_NAME = "admin";

export function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET is not set");
  }
  return secret;
}

export function isAdminRequest(req: NextRequest) {
  const secret = getAdminSecret();
  const headerSecret = req.headers.get("x-admin-secret");
  const cookieSecret = req.cookies.get(COOKIE_NAME)?.value;
  return headerSecret === secret || cookieSecret === secret;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
