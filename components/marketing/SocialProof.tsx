"use client";

export function SocialProof() {
  return (
    <section className="py-24 border-y border-border">
      <div className="max-w-[1080px] mx-auto px-6">
        {/* Testimonial */}
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <blockquote className="text-3xl md:text-4xl font-serif italic text-text-primary leading-tight">
            &quot;I booked 4 coffee chats in my first week. The emails didn&apos;t sound AI-generated — they sounded like me on a good day.&quot;
          </blockquote>
          <cite className="mt-8 block text-sm font-sans font-bold uppercase tracking-widest text-text-secondary not-italic">
            — Junior developer, Sydney
          </cite>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="py-8 md:py-0 md:px-8 text-center">
            <p className="text-4xl font-serif text-text-primary mb-2">3</p>
            <p className="text-sm font-sans font-medium uppercase tracking-widest text-text-muted">
              Contacts found
            </p>
          </div>
          <div className="py-8 md:py-0 md:px-8 text-center">
            <p className="text-4xl font-serif text-text-primary mb-2">38%</p>
            <p className="text-sm font-sans font-medium uppercase tracking-widest text-text-muted">
              Avg reply rate
            </p>
          </div>
          <div className="py-8 md:py-0 md:px-8 text-center">
            <p className="text-4xl font-serif text-text-primary mb-2">60s</p>
            <p className="text-sm font-sans font-medium uppercase tracking-widest text-text-muted">
              Per company
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
