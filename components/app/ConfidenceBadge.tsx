import { cn } from "@/lib/utils/cn";

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
  showLabel?: boolean;
}

export function ConfidenceBadge({ confidence, showLabel = true }: ConfidenceBadgeProps) {
  const styles = {
    high: "bg-success",
    medium: "bg-warning",
    low: "bg-error",
  };

  const labels = {
    high: "High Confidence",
    medium: "Medium Confidence",
    low: "Low Confidence",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", styles[confidence])} />
      {showLabel && (
        <span className="text-[12px] font-mono font-bold text-text-muted uppercase tracking-wider">
          {labels[confidence]}
        </span>
      )}
    </div>
  );
}
