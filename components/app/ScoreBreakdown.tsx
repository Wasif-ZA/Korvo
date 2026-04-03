import { cn } from "@/lib/utils/cn";
import type { ScoringSignals } from "@/shared/types/agents";

interface ScoreBreakdownProps {
  score: number;
  breakdown: ScoringSignals | null;
}

export function ScoreBreakdown({ score, breakdown }: ScoreBreakdownProps) {
  const getScoreColor = (val: number) => {
    if (val >= 75) return "text-success";
    if (val >= 45) return "text-warning";
    return "text-error";
  };

  const getBgColor = (val: number) => {
    if (val >= 75) return "bg-success";
    if (val >= 45) return "bg-warning";
    return "bg-error";
  };

  const signals = [
    { label: "Title Match", value: breakdown?.titleMatchScore || 0, max: 30 },
    { label: "Seniority", value: breakdown?.seniorityScore || 0, max: 20 },
    {
      label: "Public Activity",
      value: breakdown?.publicActivityScore || 0,
      max: 20,
    },
    {
      label: "Email Confidence",
      value: breakdown?.emailConfidenceScore || 0,
      max: 15,
    },
    {
      label: "Hiring Signal",
      value: breakdown?.hiringSignalScore || 0,
      max: 15,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <p className="text-[11px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">
            {"// Probability_Score \\"}
          </p>
          <h3
            className={cn(
              "text-4xl font-bold tracking-tight font-sans",
              getScoreColor(score),
            )}
          >
            {score}
            <span className="text-xl opacity-50 font-medium">/100</span>
          </h3>
        </div>
        <div className="text-right pb-1">
          <span
            className={cn(
              "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
              score >= 75
                ? "bg-success-bg text-success border-success/20"
                : score >= 45
                  ? "bg-warning-bg text-warning border-warning/20"
                  : "bg-error-bg text-error border-error/20",
            )}
          >
            {score >= 75
              ? "High Resonance"
              : score >= 45
                ? "Moderate Signal"
                : "Low Calibration"}
          </span>
        </div>
      </div>

      <div className="space-y-4 bg-surface border border-border-card rounded-2xl p-6 shadow-sm">
        {signals.map((sig) => {
          const percent = sig.max > 0 ? (sig.value / sig.max) * 100 : 0;
          return (
            <div key={sig.label} className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="text-text-muted">{sig.label}</span>
                <span className="text-text-primary">
                  {sig.value}
                  <span className="opacity-30">/</span>
                  {sig.max}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden border border-border-card/50">
                <div
                  className={cn(
                    "h-full transition-all duration-1000",
                    getBgColor(score),
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
