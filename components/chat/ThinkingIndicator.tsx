"use client";

export function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-surface border border-border rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-[12px] font-mono font-bold uppercase tracking-widest text-text-muted animate-pulse">
            Searching...
          </span>
        </div>
      </div>
    </div>
  );
}
