import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "default" | "success" | "warning" | "error";
}

export function StatCard({ label, value, trend, color = "default" }: StatCardProps) {
  const valueColors = {
    default: "text-text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  };

  return (
    <Card className="bg-surface border-border-card p-6">
      <p className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-[0.2em] mb-3">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className={cn("text-3xl font-bold tracking-tight", valueColors[color])}>
          {value}
        </h3>
        {trend && (
          <span className={cn(
            "text-[11px] font-mono font-bold uppercase tracking-wider mb-1",
            trend.isPositive ? "text-success" : "text-error"
          )}>
            {trend.isPositive ? "+" : "-"}{trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}
