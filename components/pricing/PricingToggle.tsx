"use client";

import { cn } from "@/lib/utils/cn";

type Interval = "monthly" | "annually";

interface PricingToggleProps {
  interval: Interval;
  onToggle: (interval: Interval) => void;
}

export function PricingToggle({ interval, onToggle }: PricingToggleProps) {
  return (
    <div className="bg-surface rounded-lg p-1 inline-flex border border-border" role="group" aria-label="Billing interval">
      <button
        type="button"
        onClick={() => onToggle("monthly")}
        className={cn(
          "px-4 py-2 rounded-lg text-sm transition-all duration-150",
          interval === "monthly"
            ? "bg-white shadow-sm text-text-primary font-semibold"
            : "text-gray-500 font-normal hover:text-text-primary"
        )}
        aria-pressed={interval === "monthly"}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onToggle("annually")}
        className={cn(
          "px-4 py-2 rounded-lg text-sm transition-all duration-150",
          interval === "annually"
            ? "bg-white shadow-sm text-text-primary font-semibold"
            : "text-gray-500 font-normal hover:text-text-primary"
        )}
        aria-pressed={interval === "annually"}
      >
        Annually
      </button>
    </div>
  );
}
