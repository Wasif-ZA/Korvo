"use client";

import { useReveal } from "@/lib/hooks/use-reveal";
import { SectionHeader, BlueprintBadge } from "./Patterns";
import { Search, Brain, PenTool } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const FEATURES = [
  {
    index: "01",
    title: "Discovery Node",
    desc: "We look past general HR to find the exact hiring manager or team lead for your target role.",
    detail: "apollo.v2 + custom_scrapers",
    icon: <Search className="w-5 h-5" />,
  },
  {
    index: "02",
    title: "Semantic Analysis",
    desc: "Analyze recent blog posts, conference talks, and LinkedIn activity to find genuine connection points.",
    detail: "claude-3-5-sonnet_extraction",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    index: "03",
    title: "Drafting Logic",
    desc: "Not AI-slop. We draft three distinct versions of each email, ranging from casual to professional.",
    detail: "tone_calibrator_v1.2",
    icon: <PenTool className="w-5 h-5" />,
  },
];

export function FeaturesGrid() {
  useReveal();

  return (
    <section id="capabilities" className="relative py-32 border-b border-border bg-bg-page/20">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader 
          index="03" 
          title="The capabilities of the outreach engine" 
          subtitle="CORE_SYSTEM_CAPABILITIES" 
        />

        <div className="grid md:grid-cols-3 gap-1 relative border border-border bg-border shadow-sm">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.index}
              className="reveal bg-white p-12 transition-all duration-500 group relative overflow-hidden"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Background index number to fill space */}
              <div className="absolute top-4 right-6 font-mono text-[40px] font-black opacity-[0.03] select-none tracking-tighter">
                {feature.index}
              </div>

              <div className="w-10 h-10 rounded bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-10 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              
              <h3 className="text-[18px] font-mono font-bold text-text-primary uppercase tracking-tight mb-6">
                {feature.title}
              </h3>
              
              <p className="text-[14px] text-text-secondary leading-relaxed font-sans opacity-80 mb-12">
                {feature.desc}
              </p>

              <div className="pt-6 border-t border-dashed border-border flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">
                  {feature.detail}
                </span>
                <div className="w-1 h-1 rounded-full bg-success opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
