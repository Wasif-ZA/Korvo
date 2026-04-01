"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { GuestLimitModal } from "@/components/auth/GuestLimitModal";
import { MonthlyLimitModal } from "@/components/auth/MonthlyLimitModal";
import { getOrCreateGuestSessionId } from "@/lib/guest";
import { Search, Mail, Layout, ArrowRight, ShieldCheck, Zap, Terminal } from "lucide-react";

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

  const proPrice = interval === "annually" ? "AUD $149" : "AUD $19";
  const proInterval = interval === "annually" ? "/year" : "/month";
  const proSavings = interval === "annually" ? "Save 35%" : undefined;

  return (
    <div className="min-h-screen bg-bg-primary selection:bg-accent/30 selection:text-accent">
      {/* ── Background Grid ── */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed inset-0 bg-radial-at-t from-accent-muted/20 via-transparent to-transparent pointer-events-none" />

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent-muted border border-border-accent mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap className="h-3 w-3 text-accent fill-accent" />
              <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.1em]">Build v1.0.4</span>
            </div>
            
            <h1 className="text-5xl lg:text-[5.5rem] font-bold tracking-[-0.03em] text-text-primary mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
              Land interviews with one search.
            </h1>
            
            <p className="text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto mb-14 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              The AI-powered pipeline for the modern job hunter. Type a company, 
              get 3 verified contacts, and ready-to-send personalized emails.
            </p>

            {/* Search bar container */}
            <div className="max-w-4xl mx-auto p-1.5 rounded-xl bg-bg-secondary border border-white/[0.06] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <form
                id="search-bar"
                onSubmit={handleSearch}
                className="flex flex-col md:flex-row gap-1.5"
                noValidate
              >
                <div className="flex-1 flex flex-col md:flex-row gap-1.5">
                  <Input
                    heroVariant
                    placeholder="Company (e.g. Atlassian)"
                    className="border-none bg-transparent focus:ring-0"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                  <div className="hidden md:block w-px h-6 self-center bg-white/[0.06]" />
                  <Input
                    heroVariant
                    placeholder="Role (e.g. Software Engineer)"
                    className="border-none bg-transparent focus:ring-0"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="md:w-auto w-full px-8 gap-2 font-bold tracking-tight"
                  isLoading={isSearching}
                >
                  <Search className="h-4 w-4 stroke-[2.5px]" />
                  Search
                </Button>
              </form>
            </div>

            <div className="mt-12 flex items-center justify-center gap-10">
              <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-text-tertiary">DEPLOYED AT</span>
              <div className="flex gap-8 text-sm font-bold text-text-tertiary/60 tracking-tighter">
                <span className="hover:text-text-primary transition-colors cursor-default">UTS_SYS</span>
                <span className="hover:text-text-primary transition-colors cursor-default">USYD_NET</span>
                <span className="hover:text-text-primary transition-colors cursor-default">UNSW_ENG</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-24 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-16">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <h2 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-[0.3em]">Execution Flow</h2>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Terminal,
                  title: "Target Discovery",
                  description: "Our agents scan public datasets to identify high-probability contacts for your specific role.",
                },
                {
                  icon: ShieldCheck,
                  title: "Pattern Detection",
                  description: "We verify email formats using multi-layer validation and assign cryptographic confidence scores.",
                },
                {
                  icon: Zap,
                  title: "Intelligence Layer",
                  description: "Generate deep-research hooks and personalized cold emails tailored to their background.",
                },
              ].map(({ icon: Icon, title, description }, i) => (
                <Card key={title} className="group hover:bg-bg-hover transition-colors">
                  <div className="w-10 h-10 rounded-md bg-bg-tertiary border border-white/[0.06] flex items-center justify-center mb-6 group-hover:border-accent/30 transition-colors">
                    <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3 tracking-tight">{title}</h3>
                  <p className="text-text-secondary leading-relaxed text-sm">
                    {description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Preview ── */}
        <section className="py-24 border-y border-white/[0.06] bg-bg-secondary/30">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="inline-block px-2 py-0.5 rounded bg-violet-muted border border-violet/20 mb-6">
                  <span className="text-[10px] font-mono font-bold text-violet uppercase tracking-wider">System Components</span>
                </div>
                <h2 className="text-4xl font-bold text-text-primary mb-8 tracking-[-0.02em] leading-tight">
                  A complete command center <br />for your job search.
                </h2>
                <div className="space-y-8">
                  {[
                    { icon: Layout, title: "Pipeline Board", desc: "Drag-and-drop Kanban interface to track every interaction." },
                    { icon: Zap, title: "Response Scoring", desc: "0-100 probability scores driven by seniority and activity match." },
                    { icon: Mail, title: "Gmail Integration", desc: "Send secure, tracked emails directly via Google OAuth (Pro)." },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex gap-4">
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <Icon className="h-full w-full text-accent/80" strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary text-sm tracking-tight">{title}</h4>
                        <p className="text-text-tertiary text-sm leading-relaxed mt-1">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-accent/5 rounded-[2rem] blur-[100px]" />
                <div className="relative rounded-xl border border-white/[0.06] bg-bg-primary p-1 shadow-2xl overflow-hidden aspect-[4/3]">
                  <div className="bg-bg-secondary rounded-lg h-full border border-white/[0.06] p-4 font-mono text-[10px] text-text-tertiary overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                        <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                        <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                      </div>
                      <span className="uppercase tracking-widest text-accent/50">Pipeline_Service v1.0</span>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-1/2 bg-white/[0.03] rounded" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-20 bg-accent-muted rounded border border-accent/10 p-2">
                          <div className="h-2 w-3/4 bg-accent/20 rounded mb-2" />
                          <div className="h-2 w-1/2 bg-accent/10 rounded" />
                        </div>
                        <div className="h-20 bg-white/[0.02] rounded border border-white/[0.06] p-2">
                          <div className="h-2 w-3/4 bg-white/[0.06] rounded mb-2" />
                          <div className="h-2 w-1/2 bg-white/[0.03] rounded" />
                        </div>
                      </div>
                      <div className="h-32 bg-white/[0.01] rounded border border-white/[0.03] p-4 space-y-2">
                        <div className="h-2 w-full bg-white/[0.04] rounded" />
                        <div className="h-2 w-full bg-white/[0.04] rounded" />
                        <div className="h-2 w-2/3 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="py-32">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-4">Transparent Tiers</h2>
              <p className="text-text-secondary mb-10">Choose the capacity that matches your search intensity.</p>
              <PricingToggle interval={interval} onToggle={setInterval} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <PricingCard
                planName="Free"
                tagline="Initial testing and basic outreach."
                price="AUD $0"
                interval="/month"
                features={FREE_FEATURES}
                ctaText="Deploy Free"
                ctaAction={handleFreeCheckout}
                ctaVariant="secondary"
              />
              <PricingCard
                planName="Pro"
                tagline="Full pipeline capacity for active job seekers."
                price={proPrice}
                interval={proInterval}
                features={PRO_FEATURES}
                ctaText="Unlock Pro Access"
                ctaAction={handleProCheckout}
                highlighted
                badge="Recommended"
                savingsBadge={proSavings}
              />
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-40 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-5xl font-bold text-text-primary mb-10 tracking-tight leading-tight">
              Ready to automate <br />your networking?
            </h2>
            <Button
              size="lg"
              className="px-10 gap-2.5 font-bold"
              onClick={() => document.getElementById("search-bar")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4 stroke-[2.5px]" />
            </Button>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Built by engineers for engineers.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-16 border-t border-white/[0.06] bg-bg-secondary/20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-accent flex items-center justify-center font-bold text-text-inverse tracking-tighter">K</div>
                <span className="font-bold text-text-primary tracking-tight text-lg">KORVO</span>
              </div>
              <nav className="flex items-center gap-10">
                <a href="/pricing" className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors">Pricing</a>
                <a href="/settings" className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors">Settings</a>
                <a href="#" className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors">Documentation</a>
                <a href="#" className="text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors">Privacy</a>
              </nav>
              <p className="text-sm font-mono text-text-tertiary">&copy; 2026 KORVO_OUTREACH_SYS</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
