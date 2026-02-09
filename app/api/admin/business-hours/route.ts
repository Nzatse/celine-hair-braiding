import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";
import type { Prisma } from "@prisma/client";

type HoursRow = {
  dayOfWeek: number; // 1-7
  startMin: number;
  endMin: number;
  enabled: boolean;
};

type Body = { hours?: HoursRow[] };

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

  const hours = body.hours;
  if (!Array.isArray(hours)) {
    return NextResponse.json({ error: "Missing hours[]" }, { status: 400 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.businessHours.deleteMany({});
    if (hours.length > 0) {
      await tx.businessHours.createMany({ data: hours });
    }
  });

  return NextResponse.json({ ok: true });
}
