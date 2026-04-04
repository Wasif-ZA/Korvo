"use client";

import { Send } from "lucide-react";

interface GmailStatusBadgeProps {
  dailySent: number;
  dailyLimit: number;
  suspended: boolean;
}

export function GmailStatusBadge({
  dailySent,
  dailyLimit,
  suspended,
}: GmailStatusBadgeProps) {
  if (suspended) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-mono">
        <Send className="w-3 h-3 text-red-400" />
        <span className="text-red-400 font-bold">Sending paused</span>
      </div>
    );
  }

  if (dailySent >= dailyLimit) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-mono">
        <Send className="w-3 h-3 text-amber-400" />
        <span className="text-amber-400 font-bold">
          {dailySent}/{dailyLimit} — limit reached
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono">
      <Send className="w-3 h-3 text-emerald-400" />
      <span className="text-emerald-400 font-bold">
        {dailySent}/{dailyLimit} sent today
      </span>
    </div>
  );
}
