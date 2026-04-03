"use client";

import { useState, useEffect } from "react";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "@/components/ui/Button";

const EXAMPLES = [
  "Canva, Junior Software Engineer",
  "Atlassian, Frontend Engineer",
  "SafetyCulture, Grad Role",
];

export function Hero() {
  const [placeholder, setPlaceholder] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentExample = EXAMPLES[exampleIndex];
    const typeSpeed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentExample.length) {
        setPlaceholder(currentExample.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentExample.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (!isDeleting && charIndex === currentExample.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, exampleIndex]);

  return (
    <section className="relative pt-32 pb-24 overflow-hidden border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <Badge className="mb-8">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent" />
              Outreach Engine v3.0
            </span>
          </Badge>
          
          <h1 className="text-[48px] md:text-[72px] font-serif font-bold leading-[1.1] tracking-tight text-text-primary max-w-4xl mb-8">
            Land interviews with <br className="hidden md:block" />
            <span className="italic-accent">personalized</span> outreach
          </h1>
          
          <p className="text-lg md:text-xl text-text-body max-w-[640px] mx-auto leading-relaxed mb-16">
            A technical outreach engine that finds the right people, researches their activity, and drafts emails worth reading.
          </p>

          {/* Precision Search Bar */}
          <div className="w-full max-w-[800px] bg-surface border border-border-card rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.04)] group focus-within:border-accent/30 transition-all">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 flex items-center gap-4 px-4 w-full">
                <Search className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full bg-transparent border-none focus:ring-0 text-base md:text-lg text-text-primary placeholder:text-text-muted font-sans h-12"
                  readOnly
                />
              </div>
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto min-w-[180px] font-mono font-bold uppercase tracking-[0.1em]"
              >
                EXEC_PIPELINE
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-8 text-[11px] font-mono font-bold text-text-muted uppercase tracking-[0.2em] opacity-60">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Direct_Access
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Real_Time_Hooks
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Calibrated_Tone
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
