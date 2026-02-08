import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hours = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: "asc" },
    select: { dayOfWeek: true, startMin: true, endMin: true, enabled: true },
  });
  const breaks = await prisma.breakWindow.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
    select: { dayOfWeek: true, startMin: true, endMin: true, enabled: true },
  });
  const blackouts = await prisma.blackoutDate.findMany({
    orderBy: { dateKey: "asc" },
    select: { dateKey: true, reason: true },
  });

  return NextResponse.json({ hours, breaks, blackouts });
}
