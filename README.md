# Korvo

**AI-powered cold outreach for job seekers.** Type a company and target role, get three researched contacts with guessed emails, response-probability scores, and ready-to-send personalised cold emails — all from a single pipeline of four specialised Claude agents.

> **For recruiters / reviewers:** this repo ships with a zero-keys **demo mode**. See [Run the demo in 60 seconds](#run-the-demo-in-60-seconds) below.

---

## Table of contents

- [Run the demo in 60 seconds](#run-the-demo-in-60-seconds)
- [What you'll see in the demo](#what-youll-see-in-the-demo)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Repo tour](#repo-tour)
- [What I built vs. off-the-shelf](#what-i-built-vs-off-the-shelf)
- [Running the real pipeline](#running-the-real-pipeline)
- [Design decisions worth calling out](#design-decisions-worth-calling-out)

---

## Run the demo in 60 seconds

```bash
git clone <this-repo>
cd korvo
npm install
npm run demo
```

Then open **http://localhost:3000** (or whichever port next.js prints — usually 3001 if 3000 is taken).

That's it. No Supabase, no Redis, no Claude API key, no Stripe, no Gmail OAuth. Everything is mocked at the API layer with realistic 300–1200 ms delays so the UI feels like the production flow.

**What `npm run demo` actually does:**

1. Copies `.env.demo` → `.env.local`, which sets `NEXT_PUBLIC_DEMO_MODE=true`
2. Starts `next dev`
3. Every API route checks `isDemoMode()` and short-circuits to seed data in `lib/demo/` instead of calling Supabase / Prisma / BullMQ / Anthropic / Gmail / Stripe

You can click around for as long as you like — nothing leaves your machine.

---

## What you'll see in the demo

Try these searches to exercise the three seeded companies:

- `Find me contacts at Linear for Product Engineer`
- `Canva engineering manager`
- `SWE at Atlassian`

Any other company name falls back to the Linear seed so the flow still completes.

**Expected flow:**

1. You type the search → `POST /api/search` returns a `searchId` (400–900 ms simulated latency)
2. The UI polls `GET /api/search/[id]` → returns a `pipeline_status: "complete"` payload with 3 contacts + 3 drafts
3. Contact cards animate in one by one with name, title, guessed email, confidence, score, research hooks
4. Click **Draft Email** on any contact → slide-in panel with subject/body — you can edit, regenerate (demo returns a freshly-styled mock), copy, or "send" (toast confirms, no real send)
5. Sidebar shows fake search history, usage (`3/50 searches, Pro plan`), and dashboard stats
6. **Pipeline** tab lets you drag contacts between stages (`identified → contacted → responded → interviewing`)
7. **Settings** tab shows a fake connected Gmail account (`demo@korvo.local`, 2/20 sent today)
8. **Pricing** tab — Stripe checkout is wired up but blocked in demo mode

**Things that intentionally won't work in demo mode:** real Google OAuth login (there's no Supabase to auth against), Stripe checkout redirect, real Gmail send. They'll either toast a success or silently no-op, which keeps the flow clickable.

---

## How it works

### The pipeline

```
User search (company + role)
        │
        ▼
┌─────────────────────────┐
│ Contact Finder  (Haiku) │   finds 3 contacts via public web
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌──────────┐  ┌─────────────┐
│ Email    │  │ Research    │  run in parallel
│ Guesser  │  │ Agent       │  (BullMQ FlowProducer)
│ (Haiku)  │  │ (Haiku)     │
└────┬─────┘  └──────┬──────┘
     └──────┬────────┘
            ▼
    ┌───────────────┐
    │ Scoring       │   title × email confidence × activity
    │ engine        │
    └───────┬───────┘
            ▼
    ┌───────────────┐
    │ Email Drafter │   tone-aware personalised drafts
    │ (Sonnet)      │
    └───────┬───────┘
            ▼
        Supabase
```

### AI cost model

| Agent          | Model          | Why                                   |
| -------------- | -------------- | ------------------------------------- |
| Contact Finder | Haiku 4.5      | High-volume, structured output        |
| Email Guesser  | Haiku 4.5      | Pattern-matching, very short prompts  |
| Research Agent | Haiku 4.5      | Summarising public-web snippets       |
| Email Drafter  | **Sonnet 4.6** | The only place quality really matters |

Estimated cost per search: ~$0.05–0.10. Prompt caching reuses research context across the drafter stage.

### Orchestration

BullMQ `FlowProducer` with a parent/child/grandchild DAG: Contact Finder is the parent, Email Guesser + Research Agent run as children in parallel, Email Drafter waits for both, then persists. Redis-backed on Railway; jobs retry 3× with exponential backoff.

---

## Tech stack

| Layer         | Choice                                           | Notes                                                                                      |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Framework     | **Next.js 16** (App Router, Turbopack)           | Uses the new `proxy.ts` over `middleware.ts`, React 19.2, `"use cache"` opt-in caching     |
| UI            | **React 19.2** + TailwindCSS 4 + framer-motion   | Motion for message streaming, dnd-kit for the Kanban                                       |
| AI            | **@anthropic-ai/sdk** (direct)                   | Deliberately _not_ `claude-agent-sdk` — I need fine control over the per-user rate budgets |
| Queue         | **BullMQ 5** + ioredis                           | FlowProducer DAG, Bull Board for ops                                                       |
| DB + Auth     | **Supabase** (Postgres + RLS + Auth)             | JWT IS the RLS enforcer                                                                    |
| Payments      | **Stripe** (Checkout Sessions + Customer Portal) | Webhook-driven subscription lifecycle                                                      |
| Email send    | **Gmail API** (user's own OAuth)                 | Pro-tier feature: users send from their own inbox                                          |
| Observability | **PostHog** + **Sentry**                         | Funnels + error tracking                                                                   |
| Hosting       | **Vercel** (web) + **Railway** (Redis + workers) | Workers can't live on Vercel (no long-running processes)                                   |

Full stack rationale (and what was _not_ picked, with reasons) is in [CLAUDE.md](./CLAUDE.md).

---

## Repo tour

```
korvo/
├── app/
│   ├── api/
│   │   ├── search/              POST enqueues pipeline, GET polls for results
│   │   ├── contacts/            list + stage-move (drag/drop target)
│   │   ├── drafts/[id]/         edit + regenerate (calls Claude Haiku)
│   │   ├── gmail/               OAuth connect, status, send, disconnect
│   │   ├── stripe/              checkout, portal, webhooks
│   │   └── ...
│   └── page.tsx                 main chat-style UI
├── worker/
│   ├── orchestrator/pipeline.ts FlowProducer wiring
│   ├── agents/                  the 4 Claude agents
│   └── scoring/                 response-probability scorer
├── lib/
│   ├── demo/                    ◀── demo-mode guards + seed data + fixtures
│   ├── queue/                   BullMQ setup
│   ├── supabase/                server + browser clients (@supabase/ssr)
│   ├── gmail/                   OAuth, token encryption, send quota
│   └── stripe/                  client + webhook verification
├── prisma/schema.prisma         DB schema (RLS, soft deletes, guest sessions)
├── .env.example                 full set of real-mode env vars
├── .env.demo                    minimal vars for demo mode
└── CLAUDE.md                    stack-decision record
```

---

## What I built vs. off-the-shelf

| I built                                                                                            | Used existing |
| -------------------------------------------------------------------------------------------------- | ------------- |
| 4-agent pipeline (prompt design, tool schemas, retry/backoff)                                      | Anthropic SDK |
| BullMQ FlowProducer DAG with progress streaming                                                    | BullMQ        |
| Supabase RLS schema + soft-delete trail + guest-session adoption                                   | Supabase Auth |
| Email-pattern confidence scorer + response-probability model                                       | —             |
| Gmail send-quota state machine (warm-up ramp 5 → 10 → 20/day, jitter, bounce-rate circuit breaker) | googleapis    |
| Stripe webhook handler with signature verification + idempotency                                   | stripe-node   |
| Demo-mode layer (guards, seed, synthesized fallbacks)                                              | —             |

---

## Running the real pipeline

The demo covers the UX. For the real product, follow [docs/SETUP.md](docs/SETUP.md):

1. Create a free Supabase project → copy DB URLs + anon/service keys
2. Create Anthropic API key
3. Stand up Redis (Railway free tier template)
4. `cp .env.example .env.local`, fill in real values
5. `npm run db:push` (applies Prisma schema + RLS)
6. `npm run dev` (web) + `npm run dev:worker` (BullMQ worker) in two terminals

Stripe, Gmail OAuth, and PostHog/Sentry are optional for local dev.

---

## Design decisions worth calling out

**1. No LinkedIn scraping.** LinkedIn ToS prohibits it, and the legal risk is incompatible with a student-priced product. Contact discovery uses public web + GitHub + personal blogs, which is both safer and often richer.

**2. Users send from their own Gmail.** The Pro-tier differentiator isn't "we email for you" (that's Outreach.io territory). It's "your own inbox, your own domain reputation, your own threading." That's what graduating students actually want, and it's the reason the whole Gmail-OAuth + warm-up-ramp subsystem exists.

**3. Human-in-the-loop, always.** No auto-send. Every draft requires a click. This is a product/legal constraint, not a tech limitation — and it's why the UI is optimised around _reviewing_ drafts fast, not firing them off.

**4. Haiku everywhere except drafting.** 3 of the 4 agents run on Haiku 4.5. Only the final drafting pass uses Sonnet 4.6, because that's the one place a user actually _reads_ the output. This is what keeps per-search cost around $0.05–0.10.

**5. Next.js 16 + `proxy.ts`.** Moved from the deprecated `middleware.ts` pattern for auth guards. The rewrite surface is smaller and plays better with Turbopack.

**6. Demo mode as a first-class feature.** Every API route has an `isDemoMode()` short-circuit. Seed data lives in `lib/demo/seed.ts`, with four JSON fixtures (`lib/demo/fixtures/*.json`) mirroring the real agent outputs. The demo mode is there _specifically_ so reviewers can evaluate the UX without setup friction.

---

## License

MIT — fork, remix, use for your own job search or sell it commercially.

---

Questions? Open an issue or reach out: **wasif.zaman1@gmail.com**
