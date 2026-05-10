import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            K
          </span>
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            Korvo
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-text-muted transition hover:text-text-primary"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-text-muted transition hover:text-text-primary"
          >
            Pricing
          </Link>
          <Link
            href="/demo"
            className="text-sm font-medium text-text-muted transition hover:text-text-primary"
          >
            Demo
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-text-muted transition hover:text-text-primary sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-lg bg-text-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
          >
            Open demo
          </Link>
        </div>
      </div>
    </header>
  );
}
