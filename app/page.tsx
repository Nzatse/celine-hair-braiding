export default function Home() {
  return (
    <div className="grid gap-10">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <div className="grid gap-4">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Protective styles • Braids • Cornrows
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Beautiful braids, booked online.</h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            View services and real-time availability, then book instantly—no third-party booking platforms.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/book"
              className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Book an appointment
            </a>
            <a
              href="/services"
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              Browse services
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Real-time availability", desc: "See open slots by service and date." },
          { title: "No double-booking", desc: "Concurrency-safe booking with DB-level protection." },
          { title: "Owner admin tools", desc: "Hours, breaks, blackouts, and cancellations." },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10"
          >
            <h2 className="font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{c.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
