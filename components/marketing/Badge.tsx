import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted",
      className
    )}>
      <span className="opacity-30">//</span>
      {children}
      <span className="opacity-30">\\</span>
    </div>
  );
}
