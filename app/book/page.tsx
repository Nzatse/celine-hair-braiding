import { SALON_TIMEZONE } from "@/lib/config";
import { BookingForm } from "./BookingForm";

export const metadata = {
  title: "Book | Celine Hair Braiding",
};

export default function BookPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Book an appointment</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Times are shown in <span className="font-medium">{SALON_TIMEZONE}</span>.
        </p>
      </header>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <BookingForm />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        By booking, you agree to the salon’s cancellation and late policies.
      </p>
    </div>
  );
}
