"use client";

import posthog from "posthog-js";
import { useState } from "react";

export function AnalyticsOptOutSection() {
  // Lazy initializer: read posthog opt-out state once on mount (client-side only)
  const [isOptedOut, setIsOptedOut] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return posthog.has_opted_out_capturing();
  });

  const handleToggle = () => {
    if (isOptedOut) {
      posthog.opt_in_capturing();
      setIsOptedOut(false);
    } else {
      posthog.opt_out_capturing();
      setIsOptedOut(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">
            Analytics Tracking
          </p>
          <p className="text-xs text-text-muted max-w-md">
            We use anonymous analytics to improve Korvo. No personal data is
            shared. See our{" "}
            <a href="/privacy" className="text-accent underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <button
          onClick={handleToggle}
          aria-pressed={!isOptedOut}
          aria-label={
            isOptedOut
              ? "Enable analytics tracking"
              : "Disable analytics tracking"
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isOptedOut ? "bg-border" : "bg-accent"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isOptedOut ? "translate-x-1" : "translate-x-6"
            }`}
          />
        </button>
      </div>
      {isOptedOut && (
        <p className="text-xs text-text-muted italic">
          Analytics disabled. We respect your choice.
        </p>
      )}
    </div>
  );
}
