"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { SectionHeader, BlueprintBadge, ConnectorLine } from "./Patterns";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { id: "01", title: "IDENT_TARGET", desc: "Surface verified decision makers via Apollo v2.1." },
  { id: "02", title: "ANALYZE_SIGNAL", desc: "Extract activity hooks from LinkedIn and recent blog posts." },
  { id: "03", title: "TONE_CALIBRATE", desc: "Map recipient seniority to drafting engine parameters." },
  { id: "04", title: "EXEC_COMPLETE", desc: "Pipeline successful. Variants ready for manual review." },
];

export function DemoCard() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(stepInterval);
  }, []);

  return (
    <section id="how-it-works" className="relative py-32 bg-white/50 border-b border-border">
      <ConnectorLine className="-top-10" />
      
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader 
          index="02" 
          title="From company name to verified draft" 
          subtitle="REAL_TIME_EXECUTION_SEQUENCE" 
        />

        <div className="w-full max-w-[1040px] mx-auto border border-text-primary/10 bg-white shadow-2xl overflow-hidden reveal active">
          {/* Chrome */}
          <div className="bg-bg-page border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
            <div className="flex gap-4">
              {["PIPELINE_OUTPUT", "PAYLOAD_STABLE"].map((tab, i) => (
                <div key={tab} className={cn(
                  "px-3 py-1 font-mono text-[9px] font-bold tracking-widest",
                  i === 0 ? "bg-accent text-white" : "text-text-muted border border-border"
                )}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="w-12" />
          </div>

          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Steps Left */}
            <div className="flex-1 p-10 bg-white relative">
              <div className="space-y-12">
                {STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex gap-8 transition-all duration-500",
                      idx < activeStep ? "opacity-100" : "opacity-20 grayscale"
                    )}
                  >
                    <div className="font-mono text-[10px] font-bold text-accent pt-1">
                      [{step.id}]
                    </div>
                    <div>
                      <h4 className="text-[14px] font-mono font-bold text-text-primary uppercase tracking-wider mb-2">
                        {step.title}
                      </h4>
                      <p className="text-[12px] text-text-secondary leading-relaxed font-sans opacity-80">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Inner sidebar labels to fill space */}
              <div className="absolute bottom-4 left-10 text-[8px] font-mono text-text-muted opacity-30 uppercase tracking-[0.4em]">
                INTERNAL_PROCESS_MONITOR_ACTIVE
              </div>
            </div>

            {/* Code Right */}
            <div className="flex-[1.4] p-10 bg-[#1A1A1A] text-white relative">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-text-light/50 uppercase tracking-[0.2em]">STRUCTURED_LOG</span>
                </div>
                <button className="flex items-center gap-2 text-[9px] font-mono text-text-light hover:text-white border border-white/10 px-2 py-1 rounded">
                  <Copy className="w-3 h-3" /> COPY_REF
                </button>
              </div>

              <div className="font-mono text-[13px] leading-relaxed text-[#93C5FD] space-y-4">
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">01</span>
                  <span>{'{'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">02</span>
                  <span className="pl-4">&quot;target&quot;: <span className="text-[#86EFAC]">&quot;sarah.chen@canva.com&quot;</span>,</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">03</span>
                  <span className="pl-4">&quot;hook_source&quot;: <span className="text-[#86EFAC]">&quot;config_2025_talk&quot;</span>,</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">04</span>
                  <span className="pl-4">&quot;resonance_index&quot;: <span className="text-accent">0.982</span>,</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">05</span>
                  <span className="pl-4">&quot;engine_status&quot;: <span className="text-[#86EFAC]">&quot;verified&quot;</span></span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">06</span>
                  <span>{'}'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-text-light/30 select-none">07</span>
                  <span className="animate-pulse text-accent">|</span>
                </div>
              </div>

              {/* Decorative corner inside dark box */}
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <rect x="0" y="0" width="60" height="1" fill="currentColor" />
                  <rect x="59" y="0" width="1" height="60" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
