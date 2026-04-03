"use client";

const STEPS = [
  {
    num: "01",
    title: "Find the right people",
    desc: "Not HR. Not recruiters. The engineering manager who'll actually read your email. Korvo uses public hiring data and team signals to surface 3 decision-makers.",
  },
  {
    num: "02",
    title: "Research what matters to them",
    desc: "Their recent blog post. The conference talk. The team milestone. Every hook is sourced from real activity — never fabricated.",
  },
  {
    num: "03",
    title: "Draft something worth reading",
    desc: "Claude writes a cold email that references something specific. You review everything before it goes anywhere.",
  },
];

export function Pipeline() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="flex flex-col gap-16 relative">
          {/* Vertical Line */}
          <div className="absolute left-[20px] top-4 bottom-4 w-px bg-border hidden md:block"></div>
          
          {STEPS.map((step) => (
            <div key={step.num} className="flex flex-col md:flex-row gap-8 md:gap-16 relative z-10">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border text-accent font-mono text-sm font-bold shrink-0">
                {step.num}
              </div>
              <div className="max-w-2xl">
                <h3 className="text-2xl md:text-3xl font-serif text-text-primary mb-4 leading-tight">
                  {step.title}
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed font-sans">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
