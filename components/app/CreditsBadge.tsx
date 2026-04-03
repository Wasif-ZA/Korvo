"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UsageData {
  used: number;
  limit: number;
}

export function CreditsBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    }
    fetchUsage();
  }, []);

  if (!usage) return <div className="h-8 w-32 bg-border/20 rounded-full animate-pulse" />;

  const isLow = usage.used >= usage.limit;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] font-semibold transition-colors",
      isLow 
        ? "bg-error-bg border-error text-error" 
        : "bg-accent-bg border-accent/20 text-accent"
    )}>
      <Zap className={cn("w-3.5 h-3.5 fill-current", isLow ? "text-error" : "text-accent")} />
      <span>
        {usage.used} <span className="opacity-50 font-normal">/</span> {usage.limit}
      </span>
      <span className="hidden sm:inline opacity-70 font-normal ml-1">searches</span>
    </div>
  );
}
