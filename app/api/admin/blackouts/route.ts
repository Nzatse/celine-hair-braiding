import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

type Body = { dateKey?: string; reason?: string; action?: "add" | "remove" };

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dateKey = (body.dateKey ?? "").trim();
  const reason = (body.reason ?? "").trim() || undefined;
  const action = body.action ?? "add";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "Invalid dateKey (YYYY-MM-DD)" }, { status: 400 });
  }

  if (action === "remove") {
    await prisma.blackoutDate.deleteMany({ where: { dateKey } });
    return NextResponse.json({ ok: true });
  }

  await prisma.blackoutDate.upsert({
    where: { dateKey },
    update: { reason },
    create: { dateKey, reason },
  });

  return NextResponse.json({ ok: true });
}
