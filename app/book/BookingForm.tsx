"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  bufferMin: number;
  priceStartingAtCents: number | null;
};

type ServicesResponse = { services: Service[] };

type AvailabilityResponse = {
  timezone: string;
  date: string;
  serviceId: string;
  slots: string[];
  reason?: string;
};

export function BookingForm() {
  const fetcher = (url: string) =>
    fetch(url, { cache: "no-store" }).then(async (r) => {
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error ?? "Request failed");
      return json;
    });

  const {
    data: servicesData,
    isLoading: loadingServices,
    error: servicesError,
  } = useSWR<ServicesResponse>("/api/services", fetcher);
  const services = useMemo(() => servicesData?.services ?? [], [servicesData]);

  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string>("");

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  const availabilityKey = serviceId && date ? `/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}` : null;
  const {
    data: availability,
    isLoading: loadingSlots,
    error: slotsError,
  } = useSWR<AvailabilityResponse>(availabilityKey, fetcher);

  const slots = availability?.slots ?? [];
  const slotsStatus: "idle" | "loading" | "ready" | "error" =
    !availabilityKey ? "idle" : loadingSlots ? "loading" : slotsError ? "error" : "ready";

  async function submit() {
    setSubmitStatus("submitting");
    setSubmitError("");

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          time: selectedTime,
          customerName,
          phone,
          email: email || undefined,
          notes: notes || undefined,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        setSubmitStatus("error");
        setSubmitError(json.error ?? "Booking failed");
        return;
      }

      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Booking failed");
    }
  }

  const canSubmit =
    !!serviceId &&
    !!date &&
    !!selectedTime &&
    customerName.trim().length > 0 &&
    phone.trim().length > 0 &&
    submitStatus !== "submitting";

  if (submitStatus === "success") {
    return (
      <div className="grid gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-900">
          <div className="font-semibold">You’re booked.</div>
          <div className="mt-1 text-sm opacity-90">
            We’ll see you on <span className="font-medium">{date}</span> at{" "}
            <span className="font-medium">{selectedTime}</span>.
          </div>
        </div>
        <button
          className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          onClick={() => {
            setSubmitStatus("idle");
            setSubmitError("");
          }}
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Service</label>
        <select
          className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            setSelectedTime("");
          }}
          disabled={loadingServices || !!servicesError}
        >
          <option value="">Select a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMin}m)
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Date</label>
        <input
          type="date"
          className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedTime("");
          }}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-sm font-medium">Time</label>
          {selectedService ? (
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              Duration {selectedService.durationMin}m
              {selectedService.bufferMin ? ` + ${selectedService.bufferMin}m buffer` : ""}
            </div>
          ) : null}
        </div>

        {slotsStatus === "idle" ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Select a service and date to see availability.</div>
        ) : null}
        {slotsStatus === "loading" ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading slots…</div>
        ) : null}
        {slotsStatus === "error" ? (
          <div className="text-sm text-red-600">Couldn’t load availability.</div>
        ) : null}
        {slotsStatus === "ready" && slots.length === 0 ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">No openings for that day.</div>
        ) : null}

        {slotsStatus === "ready" && slots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {slots.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTime(t)}
                className={
                  "h-10 rounded-full px-4 text-sm ring-1 transition " +
                  (selectedTime === t
                    ? "bg-black text-white ring-black dark:bg-white dark:text-black dark:ring-white"
                    : "bg-white ring-black/10 hover:bg-zinc-50 dark:bg-zinc-950 dark:ring-white/10 dark:hover:bg-zinc-900")
                }
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-black/5 dark:bg-black/40 dark:ring-white/10">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Name</label>
          <input
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Phone</label>
          <input
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email (optional)</label>
          <input
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Notes (optional)</label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hair length, preferred style details, etc."
          />
        </div>
      </div>

      {submitStatus === "error" ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900">
          {submitError || "Booking failed"}
        </div>
      ) : null}

      <button
        className={
          "h-12 rounded-full px-6 text-sm font-medium transition " +
          (canSubmit
            ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            : "cursor-not-allowed bg-black/20 text-black/60 dark:bg-white/20 dark:text-white/60")
        }
        onClick={submit}
        disabled={!canSubmit}
      >
        {submitStatus === "submitting" ? "Booking…" : "Confirm booking"}
      </button>
    </div>
  );
}
