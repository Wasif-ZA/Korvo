"use client";

import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "running" | "complete" | "failed";
  detail?: string;
}

interface PipelineTrackerProps {
  steps: PipelineStep[];
}

export function PipelineTracker({ steps }: PipelineTrackerProps) {
  return (
    <div className="w-full max-w-lg bg-surface border border-border-card rounded-xl p-8 shadow-sm">
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-lg font-serif font-semibold text-text-primary uppercase tracking-tight">
          Pipeline <span className="italic-accent">Execution</span>
        </h3>
        <p className="text-sm text-text-muted font-mono tracking-tight opacity-70 uppercase">
          [ STATUS: {steps.some(s => s.status === "running") ? "PROCESSING_PAYLOAD" : "CALIBRATING_SEQUENCE"} ]
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, idx) => {
          const isComplete = step.status === "complete";
          const isRunning = step.status === "running";
          const isPending = step.status === "pending";
          const isFailed = step.status === "failed";

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className={cn(
                  "absolute left-[11px] top-[26px] bottom-[-22px] w-px transition-colors duration-500",
                  isComplete ? "bg-success" : "bg-border"
                )} />
              )}

              <div className="flex items-start gap-5">
                <div className="mt-1 relative z-10 bg-surface">
                  {isComplete && <CheckCircle2 className="w-[22px] h-[22px] text-success fill-success/10" />}
                  {isRunning && <Loader2 className="w-[22px] h-[22px] text-accent animate-spin" />}
                  {isPending && <div className="w-[22px] h-[22px] rounded-full border-2 border-border-card" />}
                  {isFailed && <div className="w-[22px] h-[22px] rounded-full bg-error flex items-center justify-center text-white text-[10px] font-bold">!</div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={cn(
                      "text-sm font-mono font-bold uppercase tracking-widest transition-colors",
                      isComplete ? "text-success" : isRunning ? "text-accent" : "text-text-muted"
                    )}>
                      {step.label}
                    </h4>
                    {isRunning && (
                      <span className="text-[10px] font-mono text-accent animate-pulse">RUNNING...</span>
                    )}
                  </div>
                  {step.detail && (
                    <p className="text-xs text-text-body mt-1 leading-relaxed opacity-60">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-border-card">
        <p className="text-[11px] text-text-muted font-mono text-center uppercase tracking-[0.2em] opacity-50">
          Estimated completion: 15-30 seconds
        </p>
      </div>
    </div>
  );
}
