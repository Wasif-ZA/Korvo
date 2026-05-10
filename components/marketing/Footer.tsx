import Link from "next/link";

const links = [
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-white px-6 py-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">Korvo</p>
          <p className="mt-1 text-sm text-text-muted">
            A demo-first job outreach workspace.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-muted transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
