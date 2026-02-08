export const metadata = {
  title: "Gallery | Celine Hair Braiding",
};

export default function GalleryPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Gallery</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add photos in a future step (20–40 recommended). For now, this page is a placeholder.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-zinc-200/70 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10"
          />
        ))}
      </div>
    </div>
  );
}
