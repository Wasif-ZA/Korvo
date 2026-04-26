"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";

interface SystemMessageProps {
  children: ReactNode;
}

export function SystemMessage({ children }: SystemMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] flex items-start gap-3 bg-accent/5 border border-accent/10 rounded-2xl px-4 py-3">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-[14px] text-text-body leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
