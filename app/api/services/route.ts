import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      durationMin: true,
      bufferMin: true,
      priceStartingAtCents: true,
    },
  });

  return NextResponse.json({ services });
}
