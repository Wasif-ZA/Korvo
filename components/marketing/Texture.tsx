"use client";

import { cn } from "@/lib/utils/cn";

export function DotMatrixCluster({ className }: { className?: string }) {
  return (
    <div className={cn("dot-matrix absolute z-0", className)}>
      · · · · ·<br />
      · · · · ·<br />
      · · · · ·<br />
      · · · · ·
    </div>
  );
}

export function BoxConnector({ className }: { className?: string }) {
  return (
    <div className={cn("dot-matrix absolute z-0", className)}>
      ┌ ── ┐<br />
      │    │<br />
      └ ── ┘
    </div>
  );
}

export function PlusPattern({ className }: { className?: string }) {
  return (
    <div className={cn("dot-matrix absolute z-0", className)}>
      + + +<br />
      + + +<br />
      + + +
    </div>
  );
}

export function SectionConnector({ className }: { className?: string }) {
  return (
    <div className={cn("absolute left-1/2 -translate-x-1/2 w-px h-24 bg-border z-0 opacity-50", className)}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-border" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-border" />
    </div>
  );
}
