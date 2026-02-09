import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { SALON_TIMEZONE, SLOT_STEP_MIN } from "@/lib/config";
import type { Prisma } from "@prisma/client";
import {
  appointmentToLocalMinuteInterval,
  generateSlots,
  parseTimeHHMM,
  utcRangeForLocalDay,
  weekdayForDateKey,
} from "@/lib/availability";

type BookRequest = {
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h) in salon timezone
  customerName: string;
  phone: string;
  email?: string;
  notes?: string;
};

class SlotTakenError extends Error {
  readonly name = "SlotTakenError";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: BookRequest;
  try {
    body = (await req.json()) as BookRequest;
  } catch {
    return jsonError("Invalid JSON");
  }

  const serviceId = (body.serviceId ?? "").trim();
  const dateKey = (body.date ?? "").trim();
  const time = (body.time ?? "").trim();
  const customerName = (body.customerName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim() || undefined;
  const notes = (body.notes ?? "").trim() || undefined;

  if (!serviceId) return jsonError("Missing serviceId");
  if (!dateKey) return jsonError("Missing date (YYYY-MM-DD)");
  if (!time) return jsonError("Missing time (HH:MM)");
  if (!customerName) return jsonError("Missing customerName");
  if (!phone) return jsonError("Missing phone");

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, durationMin: true, bufferMin: true, active: true },
  });
  if (!service || !service.active) return jsonError("Service not found", 404);

  // Validate date+time and compute UTC range
  let startLocal: DateTime;
  let startUtc: Date;
  let endUtc: Date;
  try {
    const startMin = parseTimeHHMM(time);
    const startHour = Math.floor(startMin / 60);
    const startMinute = startMin % 60;

    startLocal = DateTime.fromISO(dateKey, { zone: SALON_TIMEZONE }).set({
      hour: startHour,
      minute: startMinute,
      second: 0,
      millisecond: 0,
    });
    if (!startLocal.isValid) throw new Error("Invalid date/time");

    // IMPORTANT: endAt is stored as the *busy end* (service duration + buffer)
    const busyLen = service.durationMin + service.bufferMin;
    const endLocal = startLocal.plus({ minutes: busyLen });

    startUtc = startLocal.toUTC().toJSDate();
    endUtc = endLocal.toUTC().toJSDate();
  } catch (e) {
    return jsonError((e as Error).message);
  }

  // Validate against current availability (hours, breaks, existing appts)
  const blackout = await prisma.blackoutDate.findUnique({ where: { dateKey } });
  if (blackout) return jsonError("Selected date is not available", 409);

  let weekday: number;
  try {
    weekday = weekdayForDateKey(dateKey, SALON_TIMEZONE);
  } catch (e) {
    return jsonError((e as Error).message);
  }

  const hours = await prisma.businessHours.findMany({
    where: { dayOfWeek: weekday, enabled: true },
    select: { startMin: true, endMin: true },
  });
  if (hours.length === 0) return jsonError("Selected date is not available", 409);

  const breaks = await prisma.breakWindow.findMany({
    where: { dayOfWeek: weekday, enabled: true },
    select: { startMin: true, endMin: true },
  });

  const { startUtc: dayStartUtc, endUtc: dayEndUtc } = utcRangeForLocalDay(dateKey, SALON_TIMEZONE);
  const existing = await prisma.appointment.findMany({
    where: { status: "CONFIRMED", startAt: { lt: dayEndUtc }, endAt: { gt: dayStartUtc } },
    select: { startAt: true, endAt: true },
  });

  const bookedWindows = existing
    .map((a) =>
      appointmentToLocalMinuteInterval({
        appointmentStartUtc: a.startAt,
        appointmentEndUtc: a.endAt,
        dateKey,
        zone: SALON_TIMEZONE,
      }),
    )
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const availableSlots = generateSlots({
    openWindows: hours,
    breakWindows: breaks,
    bookedWindows,
    stepMin: SLOT_STEP_MIN,
    serviceDurationMin: service.durationMin,
    serviceBufferMin: service.bufferMin,
  });

  if (!availableSlots.includes(time)) {
    return jsonError("Slot is not available", 409);
  }

  try {
    const appt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          status: "CONFIRMED",
          startAt: { lt: endUtc },
          endAt: { gt: startUtc },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new SlotTakenError("Slot Taken");
      }

      return tx.appointment.create({
        data: {
          serviceId,
          customerName,
          phone,
          email,
          notes,
          startAt: startUtc,
          endAt: endUtc,
          status: "CONFIRMED",
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
        },
      });
    });

    return NextResponse.json({ ok: true, appointment: appt });
  } catch (e) {
    if (e instanceof SlotTakenError) {
      return jsonError("Slot Taken", 409);
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Appointment_no_overlap_confirmed")) {
      return jsonError("Slot Taken", 409);
    }
    return jsonError("Booking failed", 500);
  }
}
