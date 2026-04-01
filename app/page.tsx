"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { GuestLimitModal } from "@/components/auth/GuestLimitModal";
import { MonthlyLimitModal } from "@/components/auth/MonthlyLimitModal";

const FREE_FEATURES = [
  "5 searches per month",
  "5 email drafts per month",
  "Copy-to-clipboard send",
  "Pipeline tracker",
];

const PRO_FEATURES = [
  "50 searches per month",
  "Unlimited email drafts",
  "Send via Gmail from Korvo",
  "Pipeline tracker",
  "Priority support",
  "More coming soon",
];

export default function LandingPage() {
  const [interval, setInterval] = useState<"monthly" | "annually">("monthly");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim(), role: role.trim(), location: location.trim() || undefined }),
      });
      const data = (await res.json()) as {
        limitReached?: boolean;
        limitType?: string;
        searchId?: string | null;
        error?: string;
      };

      if (data.limitReached && data.limitType === "guest") {
        setShowGuestModal(true);
      } else if (data.limitReached && data.limitType === "monthly") {
        setShowMonthlyModal(true);
      }
      // If !limitReached: search accepted — results UI comes in Phase 3
    } catch {
      // Network error — silently fail for now, Phase 3 adds error toasts
    } finally {
      setIsSearching(false);
    }
  }

  function scrollToHowItWorks() {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleProCheckout() {
    const priceId = interval === "monthly" ? "monthly" : "annual";
    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
      .then((r) => r.json())
      .then((d: { url?: string }) => {
        if (d.url) window.location.href = d.url;
      })
      .catch(() => {
        // Error handling done at Plan 05 integration
      });
  }

  function handleFreeCheckout() {
    document.getElementById("search-bar")?.scrollIntoView({ behavior: "smooth" });
  }

  const proPrice = interval === "annually" ? "AUD $149" : "AUD $19";
  const proInterval = interval === "annually" ? "/year" : "/month";
  const proSavings = interval === "annually" ? "Save 35%" : undefined;

  return (
    <main className="flex-1">
      {/* ── Hero ── */}
      <section className="py-16 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-semibold leading-none text-[#1C1C1A]">
            Land interviews with one search.
          </h1>
          <p className="text-base text-gray-500 mt-4 max-w-xl">
            Type a company name. Get 3 contacts with personalized cold emails ready to send.
          </p>

          {/* Search bar */}
          <form
            id="search-bar"
            onSubmit={handleSearch}
            className="mt-8"
            noValidate
          >
            <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row gap-3 lg:items-start">
              <Input
                heroVariant
                placeholder="e.g. Atlassian"
                aria-label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
              <Input
                heroVariant
                placeholder="e.g. Software Engineer"
                aria-label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
              <Input
                heroVariant
                placeholder="e.g. Sydney"
                aria-label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="h-[52px] shrink-0"
                isLoading={isSearching}
              >
                Start for free
              </Button>
            </div>
          </form>

          {/* Secondary CTA */}
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={scrollToHowItWorks}
            >
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="py-16 lg:py-24"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-center text-[#1C1C1A]">
            Three steps to your next coffee chat
          </h2>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Search a company",
                description: "Enter the company name and the role you're targeting.",
              },
              {
                step: "2",
                title: "Get 3 contacts with emails",
                description:
                  "We find the right people and guess their email address. High, medium, or low confidence shown.",
              },
              {
                step: "3",
                title: "Send a personalized email",
                description:
                  "Each contact gets a ready-to-edit cold email. Copy it, tweak it, hit send.",
              },
            ].map(({ step, title, description }) => (
              <Card key={step}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-semibold">
                  {step}
                </div>
                <h3 className="text-lg font-semibold mt-4 text-[#1C1C1A]">{title}</h3>
                <p className="text-sm text-gray-500 mt-2">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-16 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-center text-[#1C1C1A]">
            Simple pricing. No surprises.
          </h2>
          <p className="text-base text-gray-500 text-center mt-2">
            Start free. Upgrade when you&apos;re ready.
          </p>

          {/* Toggle */}
          <div className="flex justify-center mt-6">
            <PricingToggle interval={interval} onToggle={setInterval} />
          </div>

          {/* Cards */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <PricingCard
              planName="Free"
              tagline="Get a feel for it"
              price="AUD $0"
              interval="/month"
              features={FREE_FEATURES}
              ctaText="Get started for free"
              ctaAction={handleFreeCheckout}
              ctaVariant="secondary"
            />
            <PricingCard
              planName="Pro"
              tagline="For serious outreach"
              price={proPrice}
              interval={proInterval}
              features={PRO_FEATURES}
              ctaText="Start Pro"
              ctaAction={handleProCheckout}
              highlighted
              badge="Most popular"
              savingsBadge={proSavings}
            />
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <p className="text-sm text-gray-500 text-center mt-8 px-4">
        Built by a UTS student who landed 12 coffee chats.
      </p>

      {/* ── Footer CTA ── */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-[#1C1C1A]">
            Start your outreach for free
          </h2>
          <div className="mt-4">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() =>
                document
                  .getElementById("search-bar")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get started
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-[#E5E4E0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; 2026 Korvo</p>
          <nav className="flex items-center gap-6">
            <a
              href="/pricing"
              className="text-sm text-gray-500 hover:text-[#1C1C1A] transition-colors duration-150"
            >
              Pricing
            </a>
            <a
              href="/settings"
              className="text-sm text-gray-500 hover:text-[#1C1C1A] transition-colors duration-150"
            >
              Settings
            </a>
          </nav>
        </div>
      </footer>

      {/* Auth modals */}
      <GuestLimitModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
      <MonthlyLimitModal
        open={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
      />
    </main>
  );
}
