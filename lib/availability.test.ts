import { describe, expect, it } from "vitest";
import {
  formatTimeHHMM,
  generateSlots,
  parseTimeHHMM,
  subtractIntervals,
  utcRangeForLocalDay,
} from "./availability";

describe("time helpers", () => {
  it("parses and formats HH:MM", () => {
    expect(parseTimeHHMM("09:30")).toBe(570);
    expect(formatTimeHHMM(570)).toBe("09:30");
  });
});

describe("interval subtraction", () => {
  it("subtracts a block from a window", () => {
    const remaining = subtractIntervals([{ startMin: 540, endMin: 600 }], [{ startMin: 560, endMin: 570 }]);
    expect(remaining).toEqual([
      { startMin: 540, endMin: 560 },
      { startMin: 570, endMin: 600 },
    ]);
  });
});

describe("slot generation", () => {
  it("generates 15-min slots within open window", () => {
    const slots = generateSlots({
      openWindows: [{ startMin: 9 * 60, endMin: 10 * 60 }],
      breakWindows: [],
      bookedWindows: [],
      stepMin: 15,
      serviceDurationMin: 30,
      serviceBufferMin: 0,
    });
    expect(slots).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("removes break window", () => {
    const slots = generateSlots({
      openWindows: [{ startMin: 9 * 60, endMin: 12 * 60 }],
      breakWindows: [{ startMin: 10 * 60, endMin: 11 * 60 }],
      bookedWindows: [],
      stepMin: 15,
      serviceDurationMin: 60,
      serviceBufferMin: 0,
    });
    expect(slots).toContain("09:00");
    expect(slots).not.toContain("10:00");
    expect(slots).toContain("11:00");
  });

  it("enforces buffer by extending busy length", () => {
    const slots = generateSlots({
      openWindows: [{ startMin: 9 * 60, endMin: 10 * 60 }],
      breakWindows: [],
      bookedWindows: [],
      stepMin: 15,
      serviceDurationMin: 45,
      serviceBufferMin: 15,
    });
    // busy length is 60, only one slot fits
    expect(slots).toEqual(["09:00"]);
  });
});

describe("timezone UTC range", () => {
  it("returns a 24h UTC span for a local day", () => {
    const { startUtc, endUtc } = utcRangeForLocalDay("2026-02-08", "America/Chicago");
    expect(endUtc.getTime()).toBeGreaterThan(startUtc.getTime());
  });
});
