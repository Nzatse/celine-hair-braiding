import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      endAt: { gt: now },
    },
    orderBy: { startAt: "asc" },
    take: 200,
    select: {
      id: true,
      customerName: true,
      phone: true,
      email: true,
      notes: true,
      startAt: true,
      endAt: true,
      status: true,
      service: { select: { name: true } },
      createdAt: true,
    },
  });

  return NextResponse.json({ appointments });
}
