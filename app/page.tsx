"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { GuestLimitModal } from "@/components/auth/GuestLimitModal";
import { MonthlyLimitModal } from "@/components/auth/MonthlyLimitModal";
import { getOrCreateGuestSessionId } from "@/lib/guest";
import { Search, ArrowRight, Github } from "lucide-react";

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
    <div className="min-h-screen bg-bg-base text-text-1">
      {/* ── Nav ── */}
      <nav className="max-w-[1200px] mx-auto px-6 py-8 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-text text-lg tracking-tighter shadow-xl shadow-primary/10">K</div>
          <span className="font-display font-bold text-xl tracking-tight">Korvo</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="/pricing" className="text-[15px] font-medium text-text-2 hover:text-text-1 transition-colors">Pricing</a>
          <Button variant="secondary" size="default" onClick={() => window.location.href = "/auth"}>Sign in</Button>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7">
            <h1 className="text-6xl lg:text-[72px] leading-[1.05] font-bold tracking-tight text-text-1 mb-8">
              Land interviews with one search.
            </h1>
            
            <p className="text-xl text-text-2 max-w-lg mb-12 leading-relaxed">
              Find the right people. Get their verified emails. <br />
              Receive a custom outreach draft in seconds.
            </p>

            {/* Search bar */}
            <div className="p-1.5 rounded-xl bg-bg-raised border border-white/[0.04] shadow-2xl">
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
                  <div className="hidden md:block w-px h-6 self-center bg-white/[0.08]" />
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
                  className="px-8 gap-2 font-bold"
                  isLoading={isSearching}
                >
                  <Search className="h-4 w-4 stroke-[3px]" />
                  Get contacts
                </Button>
              </form>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-base bg-bg-raised" />
                ))}
              </div>
              <p className="text-sm text-text-3 font-medium italic">
                Joined by 400+ graduates this week
              </p>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-bg-raised to-bg-base border border-white/[0.04] p-8 shadow-inner overflow-hidden">
               {/* Real UI Preview Mockup */}
               <div className="space-y-6 opacity-40">
                  <div className="h-4 w-24 bg-text-3/20 rounded" />
                  <div className="space-y-3">
                    <div className="h-12 w-full bg-bg-hover rounded-lg border border-white/[0.04]" />
                    <div className="h-12 w-full bg-bg-hover rounded-lg border border-white/[0.04]" />
                    <div className="h-12 w-full bg-bg-hover rounded-lg border border-white/[0.04]" />
                  </div>
                  <div className="pt-6 space-y-4">
                    <div className="h-4 w-32 bg-text-3/20 rounded" />
                    <div className="h-32 w-full bg-bg-hover rounded-xl border border-white/[0.04]" />
                  </div>
               </div>
               {/* Floating Data Card */}
               <div className="absolute top-1/2 left-[-10%] right-[-10%] translate-y-[-50%] bg-bg-elevated border border-primary/20 rounded-xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-32 bg-primary/20 rounded" />
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">HIGH_CONFIDENCE</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-text-3/10 rounded" />
                    <div className="h-2 w-full bg-text-3/10 rounded" />
                    <div className="h-2 w-2/3 bg-text-3/10 rounded" />
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.04] flex justify-end">
                    <div className="h-8 w-24 bg-primary rounded-lg" />
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-bg-raised/30 border-y border-white/[0.04] section-spacer">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4">
                <h2 className="text-3xl font-bold text-text-1 mb-6">Built for depth, <br />not just volume.</h2>
                <p className="text-text-2 leading-relaxed">
                  Most tools give you a list of 1,000 names you'll never email. We give you the 3 that actually matter.
                </p>
              </div>
              
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                {[
                  {
                    num: "01",
                    title: "Precision Search",
                    desc: "Our agents don't just scrape; they research. We find contacts based on seniority and relevance to your target role."
                  },
                  {
                    num: "02",
                    title: "Verified Channels",
                    desc: "Multi-layer verification ensures your email actually hits the inbox. No bounces, no blacklists."
                  },
                  {
                    num: "03",
                    title: "Human Context",
                    desc: "We research their public activity to find a genuine hook. No more 'I'm a big fan of your work' generic openings."
                  },
                  {
                    num: "04",
                    title: "Native Sending",
                    desc: "Pro users send directly from Korvo via Gmail. We handle the deliverability ramp and jitter so you stay out of spam."
                  }
                ].map((step) => (
                  <div key={step.num}>
                    <span className="text-5xl font-bold text-text-3/20 block mb-6 leading-none">{step.num}</span>
                    <h3 className="text-xl font-bold text-text-1 mb-4">{step.title}</h3>
                    <p className="text-[15px] text-text-2 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="section-spacer">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
              <div className="max-w-xl">
                <h2 className="text-4xl font-bold text-text-1 mb-4">Pricing</h2>
                <p className="text-text-2 text-lg">Two plans. Built for every stage of the hunt.</p>
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
                ctaText="Get started"
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
        <section className="section-spacer border-t border-white/[0.04]">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <h2 className="text-5xl font-bold text-text-1 mb-10 tracking-tight leading-tight">
              Ready to land your <br />next interview?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="px-12 gap-2 font-bold" onClick={() => document.getElementById("search-bar")?.scrollIntoView({ behavior: "smooth" })}>
                Get started for free
                <ArrowRight className="h-4 w-4 stroke-[3.5px]" />
              </Button>
              <Button variant="secondary" size="lg" className="px-10 gap-2">
                <Github className="h-4 w-4" />
                View source
              </Button>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="max-w-[1200px] mx-auto px-6 py-16 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 text-text-3 font-medium">
             &copy; 2026 Korvo — Built by Wasif
          </div>
          <nav className="flex items-center gap-8">
             <a href="#" className="text-sm text-text-3 hover:text-text-2 transition-colors">Privacy</a>
             <a href="#" className="text-sm text-text-3 hover:text-text-2 transition-colors">Terms</a>
             <a href="#" className="text-sm text-text-3 hover:text-text-2 transition-colors">Twitter</a>
          </nav>
        </footer>
      </main>

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
