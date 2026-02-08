import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const datasourceUrl = process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: datasourceUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const services = [
    { name: "Knotless Braids (Small)", durationMin: 240, bufferMin: 15, priceStartingAtCents: 25000 },
    { name: "Knotless Braids (Medium)", durationMin: 210, bufferMin: 15, priceStartingAtCents: 20000 },
    { name: "Knotless Braids (Large)", durationMin: 180, bufferMin: 15, priceStartingAtCents: 16000 },
    { name: "Box Braids (Medium)", durationMin: 240, bufferMin: 15, priceStartingAtCents: 22000 },
    { name: "Feed-In Cornrows", durationMin: 120, bufferMin: 15, priceStartingAtCents: 12000 },
    { name: "Take Down / Removal", durationMin: 60, bufferMin: 0, priceStartingAtCents: 6000 },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: {
        durationMin: s.durationMin,
        bufferMin: s.bufferMin,
        priceStartingAtCents: s.priceStartingAtCents,
        active: true,
      },
      create: {
        name: s.name,
        durationMin: s.durationMin,
        bufferMin: s.bufferMin,
        priceStartingAtCents: s.priceStartingAtCents,
        active: true,
      },
    });
  }

  // Luxon-style weekday: 1=Mon ... 7=Sun
  const defaultHours = [
    { dayOfWeek: 1, startMin: 9 * 60, endMin: 18 * 60, enabled: true },
    { dayOfWeek: 2, startMin: 9 * 60, endMin: 18 * 60, enabled: true },
    { dayOfWeek: 3, startMin: 9 * 60, endMin: 18 * 60, enabled: true },
    { dayOfWeek: 4, startMin: 9 * 60, endMin: 18 * 60, enabled: true },
    { dayOfWeek: 5, startMin: 9 * 60, endMin: 18 * 60, enabled: true },
    { dayOfWeek: 6, startMin: 9 * 60, endMin: 16 * 60, enabled: true },
    { dayOfWeek: 7, startMin: 0, endMin: 0, enabled: false },
  ];

  // Replace existing default rows for each day (simple MVP)
  for (const h of defaultHours) {
    await prisma.businessHours.deleteMany({ where: { dayOfWeek: h.dayOfWeek } });
    await prisma.businessHours.create({ data: h });
  }

  // Lunch break weekdays
  const defaultBreaks = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    startMin: 12 * 60,
    endMin: 13 * 60,
    enabled: true,
  }));

  await prisma.breakWindow.deleteMany({});
  for (const b of defaultBreaks) {
    await prisma.breakWindow.create({ data: b });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
