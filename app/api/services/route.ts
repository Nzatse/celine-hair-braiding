import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const hasDb = Boolean(
      process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
    );
    const safeMessage = hasDb
      ? "Failed to load services"
      : "Database is not configured (missing DATABASE_URL).";
    return NextResponse.json({ error: safeMessage, details: msg }, { status: 500 });
  }
}
