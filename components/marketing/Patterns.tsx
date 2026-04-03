"use client";

import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  index: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ index, title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-16 reveal", className)}>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-2 py-1 border border-accent/30 bg-accent/5 rounded text-[10px] font-mono font-bold text-accent">
          <span>SEC_{index}</span>
          <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
      <h2 className="text-[32px] md:text-[48px] font-serif font-semibold text-text-primary leading-[1.1] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 text-[14px] font-mono text-text-secondary opacity-70 uppercase tracking-widest leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function BlueprintBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold text-text-muted border border-border px-3 py-1 rounded-sm bg-white/50 shadow-sm uppercase tracking-[0.2em]">
      <span className="opacity-30">#</span> {text}
    </div>
  );
}

export function ConnectorLine({ className }: { className?: string }) {
  return (
    <div className={cn("absolute left-1/2 -translate-x-1/2 w-px h-20 bg-border flex items-center justify-center", className)}>
      <div className="w-2 h-2 border border-border bg-background rotate-45" />
    </div>
  );
}
