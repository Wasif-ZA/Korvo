"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-16 bg-[#FAFAF8] border-b border-[#E5E4E0]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150"
        >
          Korvo
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150"
          >
            Pricing
          </Link>
          <Link
            href="/"
            className={cn(
              "inline-flex items-center justify-center rounded-lg font-semibold",
              "h-11 px-4 text-sm",
              "bg-teal-600 text-white hover:bg-teal-700",
              "transition-colors duration-150 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
              "active:scale-[0.97]"
            )}
          >
            Get started
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg text-[#1C1C1A] hover:bg-[#F4F3F0] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E4E0] bg-[#FAFAF8]">
          <nav className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150 py-2"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "inline-flex items-center justify-center rounded-lg font-semibold w-full",
                "h-11 px-4 text-sm",
                "bg-teal-600 text-white hover:bg-teal-700",
                "transition-colors duration-150 ease-in-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
                "active:scale-[0.97]"
              )}
            >
              Get started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
