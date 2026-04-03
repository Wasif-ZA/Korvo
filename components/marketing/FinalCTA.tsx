"use client";

import { useReveal } from "@/lib/hooks/use-reveal";
import { SectionHeader, BlueprintBadge } from "./Patterns";

export function FinalCTA() {
  useReveal();

  return (
    <section id="start" className="relative py-32 bg-accent text-white overflow-hidden border-b border-white/10">
      {/* Decorative Text background */}
      <div className="absolute inset-0 opacity-10 font-mono text-[8px] leading-tight select-none pointer-events-none p-4 break-all overflow-hidden uppercase tracking-widest">
        {Array(20).fill("KORVO_PIPELINE_INITIATED_NODE_STABLE_").join(" ")}
      </div>
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="flex items-center gap-4 mb-16 opacity-50">
          <div className="px-2 py-1 border border-white/30 rounded text-[10px] font-mono font-bold">
            SEC_07
          </div>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <div className="flex flex-col items-center text-center reveal">
          <h2 className="text-[48px] md:text-[72px] font-serif font-bold leading-[1] mb-12 max-w-4xl mx-auto">
            Ready to send emails that<br />
            <span className="italic opacity-60">actually get read?</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto w-full mb-10">
            <input
              type="email"
              placeholder="Enter your work email"
              className="flex-1 bg-white/10 border border-white/30 rounded-sm px-6 py-5 focus:outline-none focus:bg-white/20 transition-all font-mono text-sm placeholder:text-white/40"
            />
            <button className="bg-white text-accent px-10 py-5 rounded-sm font-bold font-mono uppercase tracking-widest text-sm transition-all hover:bg-white/90 active:scale-[0.98] shadow-2xl">
              DEPLOY_NODE
            </button>
          </div>
          
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] opacity-60">
            [ STATUS ] NO_CREDIT_CARD_REQUIRED · 5_SEARCHES_FREE
          </p>
        </div>
      </div>
    </section>
  );
}
