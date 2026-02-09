import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";
import type { Prisma } from "@prisma/client";

type BreakRow = {
  dayOfWeek: number; // 1-7
  startMin: number;
  endMin: number;
  enabled: boolean;
};

type Body = { breaks?: BreakRow[] };

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

  const breaks = body.breaks;
  if (!Array.isArray(breaks)) {
    return NextResponse.json({ error: "Missing breaks[]" }, { status: 400 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.breakWindow.deleteMany({});
    if (breaks.length > 0) {
      await tx.breakWindow.createMany({ data: breaks });
    }
  });

  return NextResponse.json({ ok: true });
}
