"use client";

import { useReveal } from "@/lib/hooks/use-reveal";
import { SectionHeader, BlueprintBadge } from "./Patterns";
import { cn } from "@/lib/utils/cn";

const STATS = [
  { label: "REPLY_RATE_RESONANCE", legacy: "2%", korvo: "38%", width: "38%" },
  { label: "PIPELINE_LATENCY", legacy: "20m", korvo: "60s", width: "100%", inverse: true },
];

export function Comparison() {
  useReveal();

  return (
    <section className="relative py-32 border-b border-border bg-bg-page/50 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeader 
          index="05" 
          title="The difference between noise and resonance" 
          subtitle="SYSTEM_BENCHMARKING_REPORTS" 
        />

        <div className="max-w-4xl mx-auto space-y-20">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="reveal" style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="flex justify-between items-end mb-8">
                <h3 className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-[0.3em]">{stat.label}</h3>
                <span className="text-[9px] font-mono font-bold text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-sm">BENCHMARK_STABLE</span>
              </div>
              
              <div className="space-y-8">
                {/* Legacy */}
                <div className="group relative">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-text-light/60 uppercase tracking-widest mb-3">
                    <span>LEGACY_MANUAL_SEARCH</span>
                    <span>{stat.legacy}</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-text-light/20 w-[5%] group-hover:bg-text-light/40 transition-all duration-700" />
                  </div>
                </div>

                {/* Korvo */}
                <div className="group relative">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-accent uppercase tracking-widest mb-3">
                    <span>KORVO_ENGINE_PIPELINE</span>
                    <span>{stat.korvo}</span>
                  </div>
                  <div className="h-2 bg-accent/10 rounded-full overflow-hidden border border-accent/20">
                    <div 
                      className="h-full bg-accent shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-1000 ease-out" 
                      style={{ width: stat.width }}
                    />
                  </div>
                  {/* Decorative dot at the end of the bar */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: stat.width }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-32 pt-16 border-t border-border flex flex-col md:flex-row justify-between items-center gap-12 reveal">
          <div className="flex-1">
            <blockquote className="text-[26px] font-serif italic text-text-primary leading-tight max-w-xl">
              &quot;The emails didn&apos;t sound like another template — they sounded like me on a good day.&quot;
            </blockquote>
            <cite className="mt-8 block text-[11px] font-mono font-bold uppercase tracking-widest text-text-muted not-italic flex items-center gap-4">
              <div className="w-8 h-px bg-border" />
              Junior developer, Sydney
            </cite>
          </div>
          <div className="w-full md:w-auto grid grid-cols-2 gap-4">
            <div className="bg-white border border-border p-6 rounded-lg flex flex-col gap-2 min-w-[160px]">
              <span className="text-[9px] font-mono font-bold text-text-light uppercase tracking-widest">Resonance_Scan</span>
              <span className="text-[15px] font-mono font-bold text-success uppercase">98% Match</span>
            </div>
            <div className="bg-white border border-border p-6 rounded-lg flex flex-col gap-2 min-w-[160px]">
              <span className="text-[9px] font-mono font-bold text-text-light uppercase tracking-widest">Protocol_Time</span>
              <span className="text-[15px] font-mono font-bold text-accent uppercase">0.4s / Node</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
