"use client";

import Link from "next/link";
import { useReveal } from "@/lib/hooks/use-reveal";
import { SectionHeader, BlueprintBadge } from "./Patterns";
import { cn } from "@/lib/utils/cn";

const TIERS = [
  {
    name: "FREE_PLAN",
    price: "$0",
    features: ["5 searches per month", "Basic email drafting", "Verified email detection"],
    cta: "ACCESS_FREE",
    href: "/#start",
  },
  {
    name: "PRO_PROTOCOL",
    price: "$29",
    features: ["50 searches per month", "Advanced hooks logic", "Coffee chat briefs", "Priority node access"],
    cta: "UPGRADE_TO_PRO",
    href: "/pricing",
    popular: true,
  },
  {
    name: "TEAMS_MATRIX",
    price: "$79",
    features: ["Unlimited searches", "Team dashboard access", "White-label drafts", "Bulk node processing"],
    cta: "CONTACT_FOR_ACCESS",
    href: "mailto:sales@korvo.ai",
  },
];

export function Pricing() {
  useReveal();

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-white border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeader 
          index="06" 
          title="Transparent investment tiers" 
          subtitle="QUOTA_ALLOCATION_MATRIX" 
        />

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={cn(
                "reveal relative bg-white border p-12 flex flex-col transition-all duration-500 hover:shadow-2xl group",
                tier.popular ? "border-accent ring-1 ring-accent/20 scale-105 z-20 shadow-xl" : "border-border"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-accent text-white text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 shadow-sm">
                  RECOMMENDED_NODE
                </div>
              )}

              <h3 className="text-[12px] font-mono font-bold text-text-muted uppercase tracking-[0.3em] mb-6">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-12">
                <span className="text-[48px] font-serif font-bold text-text-primary">{tier.price}</span>
                <span className="text-text-light text-[12px] font-mono">/mo</span>
              </div>

              <ul className="space-y-6 mb-16 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4 text-[13px] font-mono text-text-secondary group-hover:text-text-primary transition-colors">
                    <div className="w-1.5 h-1.5 bg-accent/30 rounded-full mt-1.5 shrink-0 group-hover:bg-accent transition-colors" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={cn(
                  "w-full py-4 rounded-sm text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-center transition-all active:scale-[0.98]",
                  tier.popular
                    ? "bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-accent/40"
                    : "bg-text-primary text-white hover:bg-accent"
                )}
              >
                EXEC_{tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
