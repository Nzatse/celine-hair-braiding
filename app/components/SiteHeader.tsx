import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Celine Hair Braiding
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
          <Link className="hover:text-black dark:hover:text-white" href="/services">
            Services
          </Link>
          <Link className="hover:text-black dark:hover:text-white" href="/gallery">
            Gallery
          </Link>
          <Link className="hover:text-black dark:hover:text-white" href="/contact">
            Contact
          </Link>
          <Link
            className="rounded-full bg-black px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            href="/book"
          >
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
