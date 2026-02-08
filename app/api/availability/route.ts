import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SALON_TIMEZONE, SLOT_STEP_MIN } from "@/lib/config";
import {
  appointmentToLocalMinuteInterval,
  generateSlots,
  utcRangeForLocalDay,
  weekdayForDateKey,
} from "@/lib/availability";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const dateKey = url.searchParams.get("date") ?? "";

  if (!serviceId) {
    return NextResponse.json({ error: "Missing serviceId" }, { status: 400 });
  }
  if (!dateKey) {
    return NextResponse.json({ error: "Missing date (YYYY-MM-DD)" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, durationMin: true, bufferMin: true, active: true },
  });
  if (!service || !service.active) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const blackout = await prisma.blackoutDate.findUnique({ where: { dateKey } });
  if (blackout) {
    return NextResponse.json({
      timezone: SALON_TIMEZONE,
      date: dateKey,
      serviceId,
      slots: [],
      reason: blackout.reason ?? "Closed",
    });
  }

  let weekday: number;
  try {
    weekday = weekdayForDateKey(dateKey, SALON_TIMEZONE);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const hours = await prisma.businessHours.findMany({
    where: { dayOfWeek: weekday, enabled: true },
    select: { startMin: true, endMin: true },
  });

  if (hours.length === 0) {
    return NextResponse.json({ timezone: SALON_TIMEZONE, date: dateKey, serviceId, slots: [] });
  }

  const breaks = await prisma.breakWindow.findMany({
    where: { dayOfWeek: weekday, enabled: true },
    select: { startMin: true, endMin: true },
  });

  const { startUtc, endUtc } = utcRangeForLocalDay(dateKey, SALON_TIMEZONE);
  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      startAt: { lt: endUtc },
      endAt: { gt: startUtc },
    },
    select: { startAt: true, endAt: true },
  });

  const bookedWindows = appointments
    .map((a) =>
      appointmentToLocalMinuteInterval({
        appointmentStartUtc: a.startAt,
        appointmentEndUtc: a.endAt,
        dateKey,
        zone: SALON_TIMEZONE,
      }),
    )
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const slots = generateSlots({
    openWindows: hours,
    breakWindows: breaks,
    bookedWindows,
    stepMin: SLOT_STEP_MIN,
    serviceDurationMin: service.durationMin,
    serviceBufferMin: service.bufferMin,
  });

  return NextResponse.json({ timezone: SALON_TIMEZONE, date: dateKey, serviceId, slots });
}
