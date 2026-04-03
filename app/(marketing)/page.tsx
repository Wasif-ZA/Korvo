"use client";

import { useReveal } from "@/lib/hooks/use-reveal";
import { Hero } from "@/components/marketing/Hero";
import { DemoCard } from "@/components/marketing/DemoCard";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { Architecture } from "@/components/marketing/Architecture";
import { Comparison } from "@/components/marketing/Comparison";
import { Pricing } from "@/components/marketing/Pricing";
import { FinalCTA } from "@/components/marketing/FinalCTA";

export default function LandingPage() {
  useReveal();

  return (
    <>
      <Hero />
      <div className="reveal">
        <DemoCard />
      </div>
      <div className="reveal">
        <FeaturesGrid />
      </div>
      <div className="reveal">
        <Architecture />
      </div>
      <div className="reveal">
        <Comparison />
      </div>
      <div className="reveal">
        <Pricing />
      </div>
      <div className="reveal">
        <FinalCTA />
      </div>
    </>
  );
}
