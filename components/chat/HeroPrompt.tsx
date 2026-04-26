"use client";

import { Search, Sparkles, Zap } from "lucide-react";

interface HeroPromptProps {
  onSelectExample: (text: string) => void;
}

const EXAMPLES = [
  "Find contacts at Stripe for Engineering Manager",
  "Find contacts at Figma for Product Designer",
  "Find contacts at Notion for Software Engineer",
];

export function HeroPrompt({ onSelectExample }: HeroPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <Sparkles className="w-7 h-7 text-accent" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-text-primary mb-2 font-serif">
        Find your next connection
      </h1>
      <p className="text-[14px] text-text-muted max-w-md mb-10 leading-relaxed">
        Tell Korvo which company and role you&apos;re targeting. We&apos;ll find
        the right people and draft personalized emails.
      </p>

      {/* Example prompts */}
      <div className="space-y-3 w-full max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3">
          Try an example
        </p>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => onSelectExample(example)}
            className="w-full text-left px-4 py-3 bg-surface border border-border rounded-xl text-[13px] text-text-body hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0" />
            <span className="group-hover:text-text-primary transition-colors">
              {example}
            </span>
            <Zap className="w-3.5 h-3.5 text-text-light group-hover:text-accent ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
