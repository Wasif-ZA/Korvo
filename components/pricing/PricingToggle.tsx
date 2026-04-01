"use client";

import { cn } from "@/lib/utils/cn";

type Interval = "monthly" | "annually";

interface PricingToggleProps {
  interval: Interval;
  onToggle: (interval: Interval) => void;
}

export function PricingToggle({ interval, onToggle }: PricingToggleProps) {
  return (
    <div className="bg-[#F4F3F0] rounded-full p-1 inline-flex" role="group" aria-label="Billing interval">
      <button
        type="button"
        onClick={() => onToggle("monthly")}
        className={cn(
          "px-4 py-2 rounded-full text-sm transition-colors duration-150",
          interval === "monthly"
            ? "bg-white shadow-sm text-[#1C1C1A] font-semibold"
            : "text-gray-500 font-normal hover:text-[#1C1C1A]"
        )}
        aria-pressed={interval === "monthly"}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onToggle("annually")}
        className={cn(
          "px-4 py-2 rounded-full text-sm transition-colors duration-150",
          interval === "annually"
            ? "bg-white shadow-sm text-[#1C1C1A] font-semibold"
            : "text-gray-500 font-normal hover:text-[#1C1C1A]"
        )}
        aria-pressed={interval === "annually"}
      >
        Annually
      </button>
    </div>
  );
}
