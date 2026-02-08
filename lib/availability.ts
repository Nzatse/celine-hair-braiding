import { DateTime } from "luxon";

export type MinuteInterval = { startMin: number; endMin: number };

export function assertValidDateKey(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("Invalid date. Expected YYYY-MM-DD.");
  }
  const dt = DateTime.fromISO(dateKey, { zone: "utc" });
  if (!dt.isValid) throw new Error("Invalid date.");
}

export function utcRangeForLocalDay(dateKey: string, zone: string) {
  assertValidDateKey(dateKey);
  const startLocal = DateTime.fromISO(dateKey, { zone }).startOf("day");
  const endLocal = startLocal.plus({ days: 1 });
  return {
    startUtc: startLocal.toUTC().toJSDate(),
    endUtc: endLocal.toUTC().toJSDate(),
    startLocal,
  };
}

export function weekdayForDateKey(dateKey: string, zone: string) {
  assertValidDateKey(dateKey);
  return DateTime.fromISO(dateKey, { zone }).weekday; // 1=Mon ... 7=Sun
}

export function parseTimeHHMM(time: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) throw new Error("Invalid time. Expected HH:MM (24h). ");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour * 60 + minute;
}

export function formatTimeHHMM(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function clampIntervalToDay(interval: MinuteInterval): MinuteInterval | null {
  const startMin = Math.max(0, Math.min(1440, interval.startMin));
  const endMin = Math.max(0, Math.min(1440, interval.endMin));
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

function normalizeIntervals(intervals: MinuteInterval[]) {
  const cleaned = intervals
    .map(clampIntervalToDay)
    .filter((x): x is MinuteInterval => x !== null)
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const merged: MinuteInterval[] = [];
  for (const cur of cleaned) {
    const last = merged.at(-1);
    if (!last || cur.startMin > last.endMin) {
      merged.push({ ...cur });
    } else {
      last.endMin = Math.max(last.endMin, cur.endMin);
    }
  }
  return merged;
}

function subtractOne(available: MinuteInterval[], block: MinuteInterval) {
  const result: MinuteInterval[] = [];
  for (const a of available) {
    // No overlap
    if (block.endMin <= a.startMin || block.startMin >= a.endMin) {
      result.push(a);
      continue;
    }

    // Left remainder
    if (block.startMin > a.startMin) {
      result.push({ startMin: a.startMin, endMin: Math.min(block.startMin, a.endMin) });
    }

    // Right remainder
    if (block.endMin < a.endMin) {
      result.push({ startMin: Math.max(block.endMin, a.startMin), endMin: a.endMin });
    }
  }
  return result;
}

export function subtractIntervals(available: MinuteInterval[], blocks: MinuteInterval[]) {
  let cur = normalizeIntervals(available);
  const normalizedBlocks = normalizeIntervals(blocks);
  for (const b of normalizedBlocks) cur = normalizeIntervals(subtractOne(cur, b));
  return cur;
}

export function appointmentToLocalMinuteInterval(params: {
  appointmentStartUtc: Date;
  appointmentEndUtc: Date;
  dateKey: string;
  zone: string;
}): MinuteInterval | null {
  assertValidDateKey(params.dateKey);
  const dayStartLocal = DateTime.fromISO(params.dateKey, { zone: params.zone }).startOf("day");
  const startLocal = DateTime.fromJSDate(params.appointmentStartUtc, { zone: "utc" }).setZone(params.zone);
  const endLocal = DateTime.fromJSDate(params.appointmentEndUtc, { zone: "utc" }).setZone(params.zone);

  const startMin = Math.floor(startLocal.diff(dayStartLocal, "minutes").minutes);
  const endMin = Math.ceil(endLocal.diff(dayStartLocal, "minutes").minutes);

  return clampIntervalToDay({ startMin, endMin });
}

export function generateSlots(params: {
  openWindows: MinuteInterval[];
  breakWindows: MinuteInterval[];
  bookedWindows: MinuteInterval[];
  stepMin: number;
  serviceDurationMin: number;
  serviceBufferMin: number;
}): string[] {
  const busyLen = params.serviceDurationMin + params.serviceBufferMin;
  if (busyLen <= 0) return [];

  const openMinusBreaks = subtractIntervals(params.openWindows, params.breakWindows);
  const remaining = subtractIntervals(openMinusBreaks, params.bookedWindows);

  const slots: string[] = [];
  for (const w of remaining) {
    // Round up to the next step boundary within the day.
    const first = Math.ceil(w.startMin / params.stepMin) * params.stepMin;
    for (let start = first; start + busyLen <= w.endMin; start += params.stepMin) {
      slots.push(formatTimeHHMM(start));
    }
  }
  return slots;
}
