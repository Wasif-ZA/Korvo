"use client";

import { Search, Brain, Mail } from "lucide-react";

const STEPS = [
  {
    icon: <Search className="w-6 h-6 text-accent" />,
    title: "Find the right people",
    desc: "Apollo enrichment, role/seniority filtering, and verified email pattern detection.",
  },
  {
    icon: <Brain className="w-6 h-6 text-accent" />,
    title: "Research & personalize",
    desc: "Scrapes LinkedIn activity, blog posts, and company news for genuine personalization hooks.",
  },
  {
    icon: <Mail className="w-6 h-6 text-accent" />,
    title: "Draft & review",
    desc: "Claude generates 3 distinct drafts. You review, edit, and send. Nothing is automated.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-24">
          <span className="text-xs font-mono text-accent uppercase tracking-[0.2em] mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-display text-text-primary leading-tight">
            From company name to inbox — in 60 seconds
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="group relative bg-surface border border-border p-8 rounded-3xl transition-all duration-300 hover:border-accent/30 hover:-translate-y-1 overflow-hidden"
            >
              {/* Top Gradient Line Reveal */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-500"></div>

              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">
                {step.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
