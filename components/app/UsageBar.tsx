import { cn } from "@/lib/utils/cn";

interface UsageBarProps {
  used: number;
  limit: number;
}

export function UsageBar({ used, limit }: UsageBarProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isHigh = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono font-bold tracking-widest uppercase">
        <span className="text-text-muted">Monthly Usage</span>
        <span className={cn(isHigh ? "text-error" : "text-text-primary")}>
          {used} / {limit} searches
        </span>
      </div>
      <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden border border-border-card">
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            isHigh ? "bg-error" : "bg-accent"
          )} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
