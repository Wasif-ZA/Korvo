"use client";

import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils/cn";

interface PipelineColumnProps {
  id: string;
  label: string;
  count: number;
  children: ReactNode;
}

export function PipelineColumn({
  id,
  label,
  count,
  children,
}: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-56 min-w-[224px] shrink-0 rounded-xl border transition-colors",
        isOver
          ? "border-accent/40 bg-accent/5"
          : "border-border bg-surface-alt/50",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
          {label}
        </span>
        <span className="text-[10px] font-mono text-text-light bg-background border border-border px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">{children}</div>
    </div>
  );
}
