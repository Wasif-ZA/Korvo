"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function NavBar() {
  return (
    <header className="w-full h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-6 z-[50]">
      <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-xl font-bold font-mono tracking-tighter flex items-center gap-2 group"
          >
            <span className="bg-accent text-white px-1.5 py-0.5 rounded-sm text-sm">
              K
            </span>
            <span className="tracking-[0.2em]">KORVO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Pipeline", href: "/#how-it-works" },
              { label: "Engine", href: "/#capabilities" },
              { label: "Pricing", href: "/pricing" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors"
          >
            Log_In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-5 py-2 rounded-sm border border-text-primary bg-text-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent hover:border-accent transition-all active:scale-[0.98]"
          >
            Get_Started
          </Link>
        </div>
      </div>
    </header>
  );
}
