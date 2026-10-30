export default function LocaleLoading() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-background">
      <div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
