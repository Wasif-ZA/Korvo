"use client";

import { useState } from "react";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PromoCodeInput } from "@/components/pricing/PromoCodeInput";

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

export function PricingPageClient() {
  const [interval, setInterval] = useState<"monthly" | "annually">("monthly");
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);

  function handleCodeApplied(code: string) {
    setAppliedCode(code);
  }

  function handleProCheckout() {
    const priceId = interval === "monthly" ? "monthly" : "annual";
    const body: Record<string, string> = { priceId };
    if (appliedCode) {
      body.promoCode = appliedCode;
    }
    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    window.location.href = "/";
  }

  const proPrice = interval === "annually" ? "AUD $149" : "AUD $19";
  const proInterval = interval === "annually" ? "/year" : "/month";
  const proSavings = interval === "annually" ? "Save 35%" : undefined;

  return (
    <main className="flex-1">
      <section className="py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <h1 className="text-5xl font-semibold text-center text-[#1C1C1A] leading-none">
            Pricing
          </h1>
          <p className="text-base text-gray-500 text-center mt-4">
            Free to start. Pro when you mean business.
          </p>

          {/* Toggle */}
          <div className="flex justify-center mt-8">
            <PricingToggle interval={interval} onToggle={setInterval} />
          </div>

          {/* Pricing cards */}
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

          {/* Promo code */}
          <div className="mt-8 max-w-sm mx-auto">
            <PromoCodeInput onCodeApplied={handleCodeApplied} />
          </div>
        </div>
      </section>
    </main>
  );
}
