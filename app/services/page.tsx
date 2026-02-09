import { prisma } from "@/lib/prisma";
import { formatPriceFromCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Services | Celine Hair Braiding",
};

export default async function ServicesPage() {
  let services: Array<{
    id: string;
    name: string;
    durationMin: number;
    bufferMin: number;
    priceStartingAtCents: number | null;
  }> = [];
  let loadError: string | null = null;

  try {
    services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMin: true, bufferMin: true, priceStartingAtCents: true },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    loadError = process.env.DATABASE_URL ? msg : "Database is not configured (missing DATABASE_URL).";
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Prices are “starting at” and may vary by length and add-ons.
        </p>
      </header>

      <div className="grid gap-3">
        {loadError ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-zinc-700 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-white/10">
            <div className="font-medium">Services temporarily unavailable</div>
            <div className="mt-2 text-zinc-600 dark:text-zinc-400">{loadError}</div>
          </div>
        ) : null}

        {services.map((s) => (
          <div
            key={s.id}
            className="flex flex-col justify-between gap-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10 sm:flex-row"
          >
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Duration: {s.durationMin} min
                {s.bufferMin ? ` • Buffer: ${s.bufferMin} min` : ""}
              </div>
            </div>
            <div className="text-sm font-medium">
              {s.priceStartingAtCents ? `${formatPriceFromCents(s.priceStartingAtCents)}+` : ""}
            </div>
          </div>
        ))}

        {!loadError && services.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-zinc-700 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-white/10">
            No services are currently listed.
          </div>
        ) : null}
      </div>

      <div>
        <a
          href="/book"
          className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}
