import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminCookieOptions, getAdminSecret } from "@/lib/adminAuth";

type Body = { secret?: string };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secret = (body.secret ?? "").trim();
  if (!secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 });
  }

  if (secret !== getAdminSecret()) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, secret, adminCookieOptions());
  return res;
}
