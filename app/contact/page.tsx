export const metadata = {
  title: "Contact | Celine Hair Braiding",
};

export default function ContactPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Replace these details with the salon’s real address/phone/email.
        </p>
      </header>

      <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <div className="grid gap-1">
          <div className="text-sm font-medium">Phone</div>
          <a className="text-sm text-zinc-700 underline dark:text-zinc-300" href="tel:+15555555555">
            (555) 555-5555
          </a>
        </div>
        <div className="grid gap-1">
          <div className="text-sm font-medium">Email</div>
          <a className="text-sm text-zinc-700 underline dark:text-zinc-300" href="mailto:hello@example.com">
            hello@example.com
          </a>
        </div>
        <div className="grid gap-1">
          <div className="text-sm font-medium">Location</div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">Chicago, IL</div>
        </div>
      </div>
    </div>
  );
}
