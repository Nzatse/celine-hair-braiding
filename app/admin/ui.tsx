"use client";

import { useEffect, useMemo, useState } from "react";

type HoursRow = { dayOfWeek: number; startMin: number; endMin: number; enabled: boolean };
type BreakRow = { dayOfWeek: number; startMin: number; endMin: number; enabled: boolean };
type BlackoutRow = { dateKey: string; reason: string | null };

type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  startAt: string;
  endAt: string;
  status: string;
  service: { name: string };
  createdAt: string;
};

const weekdayLabels: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

function parseTimeToMinutes(time: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) throw new Error("Invalid time. Use HH:MM");
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function localDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

type ConfigResponse = { hours: HoursRow[]; breaks: BreakRow[]; blackouts: BlackoutRow[] };

type Props = { authed: boolean };

export function AdminClient({ authed }: Props) {
  const [secret, setSecret] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggedIn, setLoggedIn] = useState(authed);

  async function login() {
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      setLoginError(json.error ?? "Login failed");
      return;
    }
    setLoggedIn(true);
    // Refresh server state/cookies
    window.location.reload();
  }

  if (!loggedIn) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <div className="max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
          <label className="text-sm font-medium">Admin secret</label>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            type="password"
            placeholder="Enter ADMIN_SECRET"
          />
          {loginError ? (
            <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900">
              {loginError}
            </div>
          ) : null}
          <button
            className="mt-4 h-11 w-full rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={login}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [actionMsg, setActionMsg] = useState<string>("");

  const hoursByDay = useMemo(() => {
    const map = new Map<number, HoursRow>();
    for (const d of [1, 2, 3, 4, 5, 6, 7]) {
      map.set(d, { dayOfWeek: d, startMin: 9 * 60, endMin: 18 * 60, enabled: d !== 7 });
    }
    for (const h of config?.hours ?? []) map.set(h.dayOfWeek, h);
    return map;
  }, [config]);

  const [hourForm, setHourForm] = useState<Record<number, { enabled: boolean; start: string; end: string }>>({});

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        setStatus("loading");
        const [cfgRes, apptRes] = await Promise.all([
          fetch("/api/admin/config", { cache: "no-store" }),
          fetch("/api/admin/appointments", { cache: "no-store" }),
        ]);
        if (!cfgRes.ok || !apptRes.ok) throw new Error("Unauthorized or error");

        const cfgJson = (await cfgRes.json()) as ConfigResponse;
        const apptJson = (await apptRes.json()) as { appointments: Appointment[] };
        if (canceled) return;

        setConfig(cfgJson);
        setAppointments(apptJson.appointments ?? []);
        setStatus("ready");
      } catch {
        if (!canceled) setStatus("error");
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const next: Record<number, { enabled: boolean; start: string; end: string }> = {};
    for (const d of [1, 2, 3, 4, 5, 6, 7]) {
      const h = hoursByDay.get(d)!;
      next[d] = { enabled: h.enabled, start: formatMinutes(h.startMin), end: formatMinutes(h.endMin) };
    }
    setHourForm(next);
  }, [hoursByDay]);

  async function saveHours() {
    setActionMsg("");
    try {
      const hours: HoursRow[] = [1, 2, 3, 4, 5, 6, 7].map((d) => {
        const row = hourForm[d];
        return {
          dayOfWeek: d,
          enabled: !!row.enabled,
          startMin: parseTimeToMinutes(row.start),
          endMin: parseTimeToMinutes(row.end),
        };
      });

      const res = await fetch("/api/admin/business-hours", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) throw new Error("Failed");
      setActionMsg("Saved business hours.");
    } catch (e) {
      setActionMsg((e as Error).message || "Failed to save.");
    }
  }

  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutReason, setBlackoutReason] = useState("");

  async function addBlackout() {
    setActionMsg("");
    const res = await fetch("/api/admin/blackouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "add", dateKey: blackoutDate, reason: blackoutReason }),
    });
    if (!res.ok) {
      setActionMsg("Failed to add blackout.");
      return;
    }
    setActionMsg("Blackout saved.");
  }

  async function removeBlackout(dateKey: string) {
    setActionMsg("");
    const res = await fetch("/api/admin/blackouts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "remove", dateKey }),
    });
    if (!res.ok) {
      setActionMsg("Failed to remove blackout.");
      return;
    }
    setActionMsg("Blackout removed.");
  }

  async function cancelAppointment(appointmentId: string) {
    setActionMsg("");
    const res = await fetch("/api/admin/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appointmentId }),
    });
    if (!res.ok) {
      setActionMsg("Failed to cancel appointment.");
      return;
    }
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    setActionMsg("Cancelled appointment.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  if (status === "loading") {
    return <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading admin…</div>;
  }

  if (status === "error") {
    return (
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900">
          Couldn’t load admin data (check `ADMIN_SECRET`).
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <button
          className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          onClick={logout}
        >
          Log out
        </button>
      </div>

      {actionMsg ? (
        <div className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700 ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10">
          {actionMsg}
        </div>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Business hours</h2>
          <button
            className="h-10 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={saveHours}
          >
            Save
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div key={d} className="grid grid-cols-1 gap-2 rounded-2xl bg-zinc-50 p-4 ring-1 ring-black/5 dark:bg-black/40 dark:ring-white/10 sm:grid-cols-4 sm:items-center">
              <div className="font-medium">{weekdayLabels[d]}</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hourForm[d]?.enabled ?? false}
                  onChange={(e) => setHourForm((p) => ({ ...p, [d]: { ...p[d], enabled: e.target.checked } }))}
                />
                Enabled
              </label>
              <input
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={hourForm[d]?.start ?? "09:00"}
                onChange={(e) => setHourForm((p) => ({ ...p, [d]: { ...p[d], start: e.target.value } }))}
                placeholder="09:00"
              />
              <input
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={hourForm[d]?.end ?? "18:00"}
                onChange={(e) => setHourForm((p) => ({ ...p, [d]: { ...p[d], end: e.target.value } }))}
                placeholder="18:00"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <h2 className="text-lg font-semibold">Blackout dates</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="date"
            className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
            value={blackoutDate}
            onChange={(e) => setBlackoutDate(e.target.value)}
          />
          <input
            className="h-11 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950"
            placeholder="Reason (optional)"
            value={blackoutReason}
            onChange={(e) => setBlackoutReason(e.target.value)}
          />
          <button
            className="h-11 rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={addBlackout}
          >
            Add
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {(config?.blackouts ?? []).length === 0 ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">No blackout dates.</div>
          ) : null}
          {(config?.blackouts ?? []).map((b) => (
            <div key={b.dateKey} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-black/5 dark:bg-black/40 dark:ring-white/10">
              <div>
                <div className="text-sm font-medium">{b.dateKey}</div>
                {b.reason ? <div className="text-xs text-zinc-600 dark:text-zinc-400">{b.reason}</div> : null}
              </div>
              <button
                className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                onClick={() => removeBlackout(b.dateKey)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <h2 className="text-lg font-semibold">Upcoming appointments</h2>
        <div className="mt-4 grid gap-2">
          {appointments.length === 0 ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">No upcoming appointments.</div>
          ) : null}
          {appointments.map((a) => (
            <div key={a.id} className="grid gap-2 rounded-2xl bg-zinc-50 p-4 ring-1 ring-black/5 dark:bg-black/40 dark:ring-white/10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="font-medium">{a.service?.name}</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">{localDateTime(a.startAt)}</div>
              </div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {a.customerName} • {a.phone}
                {a.email ? ` • ${a.email}` : ""}
              </div>
              {a.notes ? <div className="text-xs text-zinc-600 dark:text-zinc-400">Notes: {a.notes}</div> : null}
              <div>
                <button
                  className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  onClick={() => cancelAppointment(a.id)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
