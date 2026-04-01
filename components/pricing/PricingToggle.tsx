"use client";

import { cn } from "@/lib/utils/cn";

type Interval = "monthly" | "annually";

interface PricingToggleProps {
  interval: Interval;
  onToggle: (interval: Interval) => void;
}

export function PricingToggle({ interval, onToggle }: PricingToggleProps) {
  return (
    <div className="bg-[#F4F3F0] border border-[#E5E4E0] rounded-xl p-1.5 inline-flex" role="group" aria-label="Billing interval">
      <button
        type="button"
        onClick={() => onToggle("monthly")}
        className={cn(
          "px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
          interval === "monthly"
            ? "bg-white text-[#1C1C1A] shadow-sm"
            : "text-[#9B9B98] hover:text-[#6B6B68]"
        )}
        aria-pressed={interval === "monthly"}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onToggle("annually")}
        className={cn(
          "px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
          interval === "annually"
            ? "bg-white text-[#1C1C1A] shadow-sm"
            : "text-[#9B9B98] hover:text-[#6B6B68]"
        )}
        aria-pressed={interval === "annually"}
      >
        Annually
      </button>
    </div>
  );
}
