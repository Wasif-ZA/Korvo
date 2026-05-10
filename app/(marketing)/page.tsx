import Link from "next/link";
import {
  ArrowRight,
  Check,
  Mail,
  MousePointer2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find three relevant people",
    body: "Start with a company and role. Korvo returns a short list of people worth contacting, not a giant spreadsheet.",
  },
  {
    icon: Sparkles,
    title: "Use real research hooks",
    body: "Each contact gets a concise reason to reach out, grounded in public company and role context.",
  },
  {
    icon: Mail,
    title: "Review the draft yourself",
    body: "Korvo writes the first pass. You edit, copy, or send manually. Nothing leaves without your click.",
  },
];

const proof = [
  "Demo mode runs with no API keys",
  "Human review before every email",
  "Pipeline board for follow-up state",
  "Built for students and career changers",
];

export default function MarketingHomePage() {
  return (
    <>
      <section className="border-b border-border bg-background px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-[1fr_480px]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-text-muted">
              <span className="h-2 w-2 rounded-full bg-success" />
              Portfolio demo, no credentials needed
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-text-primary md:text-7xl">
              Job outreach that feels researched, not automated.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-text-body">
              Korvo helps students and early-career builders find relevant
              contacts, draft specific cold emails, and track follow-ups from
              one focused workspace.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
              >
                Open interactive demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-text-primary transition hover:border-accent hover:text-accent"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
              {proof.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-text-body"
                >
                  <Check className="h-4 w-4 text-success" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-card bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="rounded-xl border border-border bg-surface-alt p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Search
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    Canva, Junior Software Engineer
                  </p>
                </div>
                <div className="rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success">
                  Complete
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["Sarah Chen", "Engineering Manager", "High"],
                  ["Marcus Rodriguez", "Frontend Lead", "Medium"],
                  ["Lisa Zhang", "Product Engineer", "Medium"],
                ].map(([name, role, confidence]) => (
                  <div
                    key={name}
                    className="rounded-xl border border-border-card bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {name}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">{role}</p>
                      </div>
                      <span className="rounded-full bg-accent-bg px-2.5 py-1 text-xs font-semibold text-accent">
                        {confidence}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-text-body">
                      Hook: recent team hiring post and public design-system
                      work.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-text-primary md:text-5xl">
              A short workflow for better warm and semi-warm outreach.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border-card bg-background p-7"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-bg text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-4 leading-7 text-text-body">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface-alt px-6 py-20">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[420px_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Demo first
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-text-primary">
              Built to be inspected, not just described.
            </h2>
            <p className="mt-5 leading-8 text-text-body">
              The demo uses seeded data and mocked integrations so reviewers can
              see the workflow without setting up Supabase, Redis, Claude,
              Gmail, or Stripe.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: MousePointer2,
                title: "Click-through demo",
                body: "Search history, drafts, pricing, settings, and pipeline are navigable.",
              },
              {
                icon: ShieldCheck,
                title: "No real sends",
                body: "Demo mode never emails anyone or charges anything.",
              },
              {
                icon: Search,
                title: "Seeded companies",
                body: "Try Canva, Atlassian, Linear, or Notion for complete paths.",
              },
              {
                icon: Mail,
                title: "Manual sending posture",
                body: "The product is built around review, editing, and consent.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-4 font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-body">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-20">
        <div className="mx-auto flex max-w-[980px] flex-col items-center text-center">
          <h2 className="text-4xl font-semibold leading-tight text-text-primary md:text-5xl">
            Try the working version.
          </h2>
          <p className="mt-5 max-w-2xl leading-8 text-text-body">
            The best way to judge Korvo is to click through the product. The
            demo is safe, seeded, and local.
          </p>
          <Link
            href="/demo"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
          >
            Open demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
