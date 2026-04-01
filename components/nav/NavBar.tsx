"use client";

// NavBar — auth-aware client component
// Per D-14/FOUND-04: reads avatar and name from profiles table via /api/me
// NEVER reads display data from user.user_metadata (bypassable JWT claims)

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface ProfileData {
  fullName: string | null;
  avatarUrl: string | null;
  plan: string;
}

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchProfile() {
      // Per D-14/FOUND-04: fetch display data from profiles table, NOT user_metadata
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = (await res.json()) as ProfileData;
        setProfile(data);
      }
    }

    // Load initial auth state
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        await fetchProfile();
      }
    });

    // Subscribe to auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAvatarDropdownOpen(false);
  }

  const displayName = profile?.fullName ?? user?.email ?? "User";
  const avatarUrl = profile?.avatarUrl ?? null;
  const avatarFallback = displayName.charAt(0).toUpperCase();

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
          {user ? (
            // Post-auth nav
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150"
              >
                Settings
              </Link>
              {/* Avatar with dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  aria-label="User menu"
                  aria-expanded={avatarDropdownOpen}
                  onClick={() => setAvatarDropdownOpen((prev) => !prev)}
                  className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-full"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                      {avatarFallback}
                    </div>
                  )}
                </button>
                {avatarDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E5E4E0] rounded-lg shadow-md py-1 z-50">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-[#1C1C1A] hover:bg-[#F4F3F0] transition-colors duration-150"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Pre-auth nav
            <>
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
            </>
          )}
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
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150 py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150 py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setMobileOpen(false);
                  }}
                  className="text-left text-sm font-semibold text-[#1C1C1A] hover:text-teal-600 transition-colors duration-150 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
