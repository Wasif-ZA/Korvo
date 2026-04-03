"use client";

import { cn } from "@/lib/utils/cn";

export function SchematicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen blueprint-grid selection:bg-accent selection:text-white">
      {/* Page Scanline */}
      <div className="scan-line" />

      {/* Top Coordinate Bar */}
      <div className="fixed top-0 left-0 right-0 h-6 border-b border-border bg-background/80 backdrop-blur-sm z-[60] flex items-center px-4 overflow-hidden">
        <div className="flex gap-40 font-mono text-[9px] font-bold text-text-muted opacity-40 uppercase tracking-[0.5em] whitespace-nowrap">
          {Array(10).fill(0).map((_, i) => (
            <span key={i}>GRID_COORD_REF_0{i + 1}_X_AXIS</span>
          ))}
        </div>
      </div>

      {/* Left Line Numbers */}
      <div className="fixed top-0 left-0 bottom-0 w-10 border-r border-border bg-background/80 backdrop-blur-sm z-[60] hidden lg:flex flex-col items-center py-20 gap-8 overflow-hidden pointer-events-none">
        {Array(30).fill(0).map((_, i) => (
          <span key={i} className="font-mono text-[9px] font-bold text-text-muted opacity-30">
            {(i * 10).toString().padStart(3, '0')}
          </span>
        ))}
      </div>

      {/* Background Decor Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[12%] font-mono text-[10px] opacity-[0.03] rotate-12">
          ┌ ── ┐<br />│    │<br />└ ── ┘<br />STATUS: STABLE
        </div>
        <div className="absolute bottom-[20%] right-[15%] font-mono text-[10px] opacity-[0.03] -rotate-12">
          · · · · ·<br />· · · · ·<br />· · · · ·<br />ID: KORVO_ENG_V1
        </div>
        <div className="absolute top-[40%] right-[8%] font-mono text-[10px] opacity-[0.02]">
          + + + + +<br />+ + + + +<br />+ + + + +
        </div>
      </div>

      <div className="relative z-10 lg:pl-10 pt-6">
        {children}
      </div>
    </div>
  );
}
