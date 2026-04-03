import { cn } from "@/lib/utils/cn";

interface SectionIndicatorProps {
  index: string;
  total?: string;
  label: string;
  className?: string;
}

export function SectionIndicator({ index, total = "05", label, className }: SectionIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-4 mb-8", className)}>
      <div className="w-px h-8 bg-accent" />
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
        <span className="text-accent">[{index} / {total}]</span>
        <span className="text-text-muted">·</span>
        <span className="text-text-muted">{label}</span>
      </div>
    </div>
  );
}
