"use client";

import { useReveal } from "@/lib/hooks/use-reveal";
import { SectionHeader, BlueprintBadge } from "./Patterns";
import { Database, Network, Layers, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Architecture() {
  useReveal();

  return (
    <section className="relative py-32 border-b border-border bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeader 
          index="04" 
          title="The technical core of the system" 
          subtitle="ENGINE_ARCHITECTURE_OVERVIEW" 
        />

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Block */}
          <div className="lg:col-span-8 space-y-8">
            <div className="reveal bg-bg-page border border-border p-12 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-mono text-[10px] tracking-[0.5em] select-none group-hover:opacity-20 transition-opacity">
                KORVO_CORE_V1.0
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded bg-accent/10 flex items-center justify-center text-accent">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">Protocol Integrity</h3>
              </div>
              <p className="text-[15px] text-text-secondary leading-relaxed font-sans max-w-2xl mb-10 opacity-80">
                Our extraction logic is built on top of verified activity signals. We ignore generic profile data and focus on what managers are actually doing: blog posts, team expansions, and conference activity.
              </p>
              <div className="grid sm:grid-cols-2 gap-10 pt-10 border-t border-border/50">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Data Source</span>
                  <p className="text-[13px] font-mono font-bold text-text-primary">Apollo v2.1 + Scrapers</p>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Logic Engine</span>
                  <p className="text-[13px] font-mono font-bold text-text-primary">Custom Tone Calibrator</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="reveal bg-white border border-border p-10 rounded-xl hover:border-accent/30 transition-colors" style={{ transitionDelay: "100ms" }}>
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-4 h-4 text-accent" />
                  <h4 className="text-[12px] font-mono font-bold uppercase tracking-widest">Low Latency</h4>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed opacity-80">
                  Searches are processed in real-time with an average completion of 0.4s per node.
                </p>
              </div>
              <div className="reveal bg-white border border-border p-10 rounded-xl hover:border-accent/30 transition-colors" style={{ transitionDelay: "200ms" }}>
                <div className="flex items-center gap-3 mb-6">
                  <Layers className="w-4 h-4 text-accent" />
                  <h4 className="text-[12px] font-mono font-bold uppercase tracking-widest">Concurrency</h4>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed opacity-80">
                  Async BullMQ + Redis allows for thousands of simultaneous pipeline executions.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Matrix */}
          <div className="lg:col-span-4 reveal" style={{ transitionDelay: "300ms" }}>
            <div className="bg-text-primary text-white p-10 rounded-xl h-full relative overflow-hidden">
              <h3 className="text-[10px] font-mono font-bold text-text-light/40 uppercase tracking-[0.3em] mb-12 border-b border-white/5 pb-4">
                Integration Matrix
              </h3>
              <div className="space-y-10">
                {[
                  { label: "Enrichment", status: "Active", val: "Apollo_v2" },
                  { label: "Semantic", status: "Active", val: "Claude_3.5" },
                  { label: "Storage", status: "Stable", val: "Supabase_PG" },
                  { label: "Queue", status: "Ready", val: "Redis_Node" },
                ].map((row) => (
                  <div key={row.label} className="space-y-2 group">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-widest text-text-light/40">
                      <span>{row.label}</span>
                      <span className="text-success group-hover:text-accent transition-colors">{row.status}</span>
                    </div>
                    <div className="text-[13px] font-mono font-bold text-white tracking-wider border-l-2 border-white/10 pl-4 py-1">
                      {row.val}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="absolute bottom-6 left-10 right-10 text-[8px] font-mono text-white/5 leading-tight select-none uppercase tracking-[0.2em]">
                {Array(5).fill("SYSTEM_PROTOCOL_STABLE_").join(" ")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
