"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { GuestLimitModal } from "@/components/auth/GuestLimitModal";
import { MonthlyLimitModal } from "@/components/auth/MonthlyLimitModal";
import { getOrCreateGuestSessionId } from "@/lib/guest";
import { Search, ArrowRight } from "lucide-react";

const FREE_FEATURES = [
  "5 searches per month",
  "5 email drafts per month",
  "Copy-to-clipboard send",
  "Pipeline tracker",
];

const PRO_FEATURES = [
  "50 searches per month",
  "Unlimited email drafts",
  "Direct Gmail send",
  "Priority search queue",
  "Coffee chat prep (V2)",
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
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          location: location.trim() || undefined,
          guestSessionId: getOrCreateGuestSessionId(),
        }),
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
    } catch {
      // Network error
    } finally {
      setIsSearching(false);
    }
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
      .catch(() => {});
  }

  function handleFreeCheckout() {
    document.getElementById("search-bar")?.scrollIntoView({ behavior: "smooth" });
  }

  const proPrice = interval === "annually" ? "$149" : "$19";
  const proInterval = interval === "annually" ? "/year" : "/month";
  const proSavings = interval === "annually" ? "Save 35%" : undefined;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1C1C1A]">
      {/* ── Hero ── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl lg:text-[48px] leading-[1.1] font-semibold tracking-tight mb-6">
            Land interviews with one search.
          </h1>

          <p className="text-lg text-[#6B6B68] max-w-lg mb-10 leading-relaxed">
            Enter a company name. Get 3 contacts with personalized cold emails ready to send.
          </p>

          {/* Search bar */}
          <div className="p-1.5 rounded-xl bg-white border border-[#E5E4E0] shadow-sm">
            <form
              id="search-bar"
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-2"
              noValidate
            >
              <div className="flex-1 flex flex-col md:flex-row gap-2">
                <Input
                  heroVariant
                  placeholder="Atlassian"
                  className="border-none bg-transparent focus:ring-0"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
                <div className="hidden md:block w-px h-6 self-center bg-[#E5E4E0]" />
                <Input
                  heroVariant
                  placeholder="Software Engineer"
                  className="border-none bg-transparent focus:ring-0"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="px-8 gap-2 font-semibold"
                isLoading={isSearching}
              >
                <Search className="h-4 w-4" />
                Start for free
              </Button>
            </form>
          </div>

          <p className="mt-4 text-sm text-[#9B9B98]">
            No signup required for your first search.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#F4F3F0] py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-4">How it works</h2>
          <p className="text-[#6B6B68] mb-16 max-w-lg">
            Three steps. No LinkedIn scraping. No stitching tools together.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                title: "Search",
                desc: "Enter a company name and target role. Our agents find 3 relevant contacts via public data.",
              },
              {
                num: "2",
                title: "Review",
                desc: "See each contact with their email, confidence score, and a personalized research card.",
              },
              {
                num: "3",
                title: "Send",
                desc: "Copy the AI-drafted email or send directly via Gmail. Track your pipeline in one place.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-xl border border-[#E5E4E0] p-8"
              >
                <span className="text-sm font-semibold text-teal-600 mb-4 block">
                  Step {step.num}
                </span>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-[#6B6B68] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <h2 className="text-3xl font-semibold mb-4">Pricing</h2>
              <p className="text-[#6B6B68]">
                Two plans. Built for every stage of the job hunt.
              </p>
            </div>
            <PricingToggle interval={interval} onToggle={setInterval} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
            <PricingCard
              planName="Free"
              tagline="Perfect for testing the waters."
              price="$0"
              interval="/month"
              features={FREE_FEATURES}
              ctaText="Get started for free"
              ctaAction={handleFreeCheckout}
            />
            <PricingCard
              planName="Pro"
              tagline="Everything you need to land the role."
              price={proPrice}
              interval={proInterval}
              features={PRO_FEATURES}
              ctaText="Start Pro"
              ctaAction={handleProCheckout}
              highlighted
              badge="Popular"
              savingsBadge={proSavings}
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 border-t border-[#E5E4E0]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold mb-8 tracking-tight">
            Ready to land your next interview?
          </h2>
          <Button
            size="lg"
            className="px-12 gap-2 font-semibold"
            onClick={() =>
              document
                .getElementById("search-bar")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Get started for free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-[1200px] mx-auto px-6 py-16 border-t border-[#E5E4E0] flex flex-col md:flex-row items-center justify-between gap-8">
        <p className="text-sm text-[#9B9B98]">&copy; 2026 Korvo</p>
        <nav className="flex items-center gap-8">
          <a href="#" className="text-sm text-[#9B9B98] hover:text-[#6B6B68] transition-colors">Privacy</a>
          <a href="#" className="text-sm text-[#9B9B98] hover:text-[#6B6B68] transition-colors">Terms</a>
        </nav>
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
    </div>
  );
}
