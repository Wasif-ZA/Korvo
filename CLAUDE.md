# CLAUDE.md, Korvo

Single source of truth for any Claude surface (Claude Code, Cowork, Desktop) working on this repo.
Read this entire file before making changes. Follow precisely.

---

## PROJECT IDENTITY

- **Name**: Korvo
- **One-liner**: AI-powered job outreach SaaS. Type a company + role, get 3 contacts with personalized cold emails ready to send.
- **Model**: Subscription SaaS, $29 AUD/mo Pro tier. Free tier: 5 searches/month.
- **Target user**: Graduating uni students and career changers who can't afford enterprise sales tools.
- **Primary side project**: No. Conduit is primary as of 2026-04-23. Korvo unfrozen 2026-04-25 (intent: demo-mode infra for portfolio walkthroughs; further scope pending Wasif's reconcile of `claude-context.md` Active focus list).
- **Differentiator**: Users send from their own Gmail account via OAuth, not platform-issued addresses. Gmail handles SPF/DKIM/DMARC.
- **Validated email pattern**: 5-sentence casual format, specific role mention, one project hook, company-specific reason, "quick chat" ask. Validated by 46 real cold emails (2 replies, both at Antares Solutions, led to coffee chat + CTO interview). Do not deviate without testing.

## STACK (mandatory, do not deviate without a `.planning/DECISIONS.md` entry)

| Layer         | Choice                                               | Notes                                                                                                                                                      |
| ------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | **Next.js 16** (App Router, Turbopack, React 19.2)   | `proxy.ts` for auth guards, NOT `middleware.ts`. Node 20.9+.                                                                                               |
| UI            | TailwindCSS 4.2 + shadcn/ui                          | Native CSS config, no `tailwind.config.js`.                                                                                                                |
| Auth + DB     | **Supabase** (Postgres + RLS + Auth)                 | JWT enforces RLS. Use `@supabase/ssr`, NOT `@supabase/auth-helpers-nextjs`.                                                                                |
| AI            | **@anthropic-ai/sdk** (direct, v0.81.0)              | Manual tool-use loops for the 4 specialized agents. Haiku 4.5 for high-volume, Sonnet 4.6 for deep prep briefs only. NOT `@anthropic-ai/claude-agent-sdk`. |
| Queue         | **BullMQ 5** + ioredis                               | FlowProducer DAG: Contact Finder → (Email Guesser + Research, parallel) → Drafter. Runs on Railway Redis.                                                  |
| Payments      | **Stripe**                                           | Checkout Sessions + webhooks + Customer Portal. AUD pricing.                                                                                               |
| Email send    | **googleapis** (Gmail API OAuth)                     | Pro tier only. Scope: `https://www.googleapis.com/auth/gmail.send`. Send-only, minimal permissions.                                                        |
| Hosting       | Vercel (web) + Railway (worker + Redis + Bull Board) | `REDIS_FAMILY=6` for IPv6 private networking on Railway.                                                                                                   |
| Observability | PostHog + Sentry                                     | `instrumentation-client.ts` for PostHog (Next.js 16 pattern). Sentry source maps + session replay.                                                         |

### Stack rules

- **Direct Anthropic SDK only** for the 4 agents (Contact Finder, Email Guesser, Research, Drafter). Agent SDK loops are harder to interrupt for per-user quota enforcement.
- **Haiku 4.5 for high-volume tasks**, Sonnet 4.6 only for deep research / prep briefs (V2). Cost discipline is non-negotiable; broke uni grads pay $29.
- **No LinkedIn scraping, no LinkedIn API.** Legal posture: hostile to cold outreach automation, hostile to platform terms. Use public web sources + email pattern detection only.
- **Human-in-the-loop always.** No auto-send, ever. Drafts are drafts until the user clicks send.
- **Workers run on Railway, NOT Vercel.** Vercel functions can't host long-lived BullMQ workers.

## FOLDER STRUCTURE (target)

```
Korvo/
├── .planning/
│   ├── PROJECT.md              What Korvo is, validated/active requirements
│   ├── ROADMAP.md              Phase plan (v1 complete, v2 reset in progress)
│   ├── DECISIONS.md            Architecture decisions (DEC-001 ... DEC-N)
│   ├── REQUIREMENTS.md         Per-feature requirements
│   ├── SPEC.md                 Spec doc
│   ├── STATE.md                GSD-managed state file
│   ├── PROGRESS.md             v2 phase checklist
│   ├── AGENTS.md               4-agent architecture spec
│   ├── phases/                 Per-phase plan files
│   └── research/               Research output (STACK.md verbose version, etc.)
├── app/                        Next.js 16 App Router pages + API routes
│   ├── (app)/                  Authenticated routes
│   ├── api/                    Route handlers
│   └── page.tsx                Public landing (chat-style demo as of 2026-04-25)
├── components/                 React components
│   ├── app/                    Authenticated-app components
│   ├── chat/                   Chat-UI components (the conversational rebuild)
│   ├── pricing/                Pricing UI
│   └── ui/                     shadcn primitives
├── lib/                        Shared utilities (db, auth, demo, email, etc.)
├── worker/                     BullMQ worker process (Railway-deployed)
│   ├── agents/                 The 4 specialized agents
│   ├── orchestrator/           Pipeline DAG
│   └── lib/                    Worker-only helpers
├── tests/                      Vitest unit + integration suites
├── e2e/                        Playwright e2e
├── prisma/                     DB schema + migrations
├── generated/                  Prisma client output (gitignored, ESLint must ignore)
├── scripts/                    One-off scripts (env:check, etc.)
├── docs/                       Public-facing docs
├── proxy.ts                    Auth guards (Next.js 16 replaces middleware.ts)
├── README.md
├── STATUS.md                   Weekly status, build-in-public log (when applicable)
├── TODOS.md                    Prioritized work queue
├── CLAUDE.md                   This file
└── GEMINI_FRONTEND.md          Gemini-specific context for the frontend
```

## REVENUE + PRICING

- **Free**: 5 searches / month, no Gmail send.
- **Pro**: $29 AUD/mo, unlimited searches, unlimited drafts, Gmail API send, pipeline tracking, deliverability ramp.
- Self-serve only. No support contracts.
- Stripe Checkout Sessions + Customer Portal for self-service cancel.

## CONVENTIONS

- **Dates are ISO + Sydney offset** (`+10:00` AEST, `+11:00` AEDT). No naked `YYYY-MM-DD HH:MM`.
- **No em dashes anywhere.** Use commas, semicolons, colons, parentheses, periods.
- **File paths are repo-relative.**
- **Commits**: conventional commit messages (`feat:`, `fix:`, `chore:`, etc.). One feature per PR.
- **Tests**: Vitest unit + integration; Playwright for e2e. Contract tests for any external API integration (Gmail, Stripe, Supabase) with recorded fixtures.
- **No secrets in repo.** Env vars validated by `scripts/check-env.ts` (`predev` + `prebuild` hooks).
- **Tidy folders by default.** When a new file does not fit an existing folder, create a neat subfolder; never scatter loose files at repo root. Match the FOLDER STRUCTURE above.
- **Generated code is generated.** `generated/`, `.next/`, `node_modules/` are out of scope for lint, typecheck, and review. Audit failures from these dirs are a config bug, not a code bug.

## HEALTH STACK

(Used by `/gstack-health`. Last audit: 2026-04-26, composite 4.1/10. See STATUS.md for the dashboard.)

```
- typecheck: tsc --noEmit
- lint: eslint .
- test: vitest run
- e2e: playwright test
- format: prettier --check .
- envcheck: tsx scripts/check-env.ts --mode=runtime
```

`deadcode` (knip) and `shell` (shellcheck) are not configured; the audit redistributes their weight.

## DO NOT DO

- Do not auto-send emails. Ever. Drafts are drafts until the user clicks send.
- Do not scrape LinkedIn or call the LinkedIn API. Public web sources only.
- Do not use `@anthropic-ai/claude-agent-sdk` for the 4 specialized agents. Direct SDK only.
- Do not use `@supabase/auth-helpers-nextjs`. Use `@supabase/ssr`.
- Do not use `middleware.ts` for auth in Next.js 16. Use `proxy.ts`.
- Do not host BullMQ workers on Vercel. Railway only.
- Do not call Sonnet 4.6 from high-volume agent paths. Cost ceiling is per-user budget; Sonnet is for deep prep briefs only.
- Do not commit `generated/`, `.next/`, `.env*`, or anything in `node_modules/`.
- Do not bypass `scripts/check-env.ts`. The pre-hook exists for a reason.

## CODEX SECOND OPINION (mandatory for non-trivial decisions)

In this repo, Codex is the cross-model second opinion. Claude does not lock in a non-trivial decision alone.

**When Codex must be consulted (blocking before commit/PR):**

- **Stack or library changes.** Adding, swapping, or removing anything in the STACK table; pulling in a new runtime dependency.
- **Schema changes / RLS policy edits.** Anything that would land in `.planning/DECISIONS.md` as a new DEC entry.
- **Agent prompt changes.** The 4 agents are core product. A prompt change is a behavior change.
- **Auth flows.** Supabase Auth, Google OAuth (login), Gmail OAuth (send). Two distinct OAuth flows; do not conflate them.
- **Branch before PR.** Run `/codex:review` (or gstack `/codex`) on the diff. For high-stakes branches (auth, billing, agent loops), also run `/codex:adversarial-review`.
- **When Claude is uncertain.** If you would hedge in a comment ("I think", "this should work"), consult Codex first instead of shipping the hedge.

**Decision discipline:**

- Record the Codex verdict (pass / fail / disagreement) in the relevant `.planning/DECISIONS.md` entry alongside Claude's reasoning. Both opinions stay in the record, even when they agree.
- If Codex disagrees, do not silently override. Either resolve the disagreement, or write down explicitly why Claude is overruling Codex and what risk is being accepted.

## GSD WORKFLOW ENFORCEMENT

Korvo uses GSD (`get-shit-done`) for planning and phase work. Before using `Edit`, `Write`, or other file-changing tools for non-trivial work, route through a GSD command so planning artifacts and execution context stay in sync.

Entry points:

- `/gsd:quick` for small fixes, doc updates, ad-hoc tasks.
- `/gsd:debug` for investigation and bug fixing.
- `/gsd:execute-phase` for planned phase work (currently v2 reset Phase 0 triage; see `.planning/PROGRESS.md`).

Direct edits outside a GSD workflow are allowed for routine work (typo fixes, dependency bumps, lint cleanups), but anything that changes product behavior or schema goes through GSD.

## ACTIVITY LOG

After any meaningful action in this repo (commits, gitignore changes, branch / worktree cleanup, dependency bumps, schema migrations, GSD phase work), append one line to `../../05 Meta/activity-log.md` via the locked helper, before ending the turn.

```bash
"$VAULT/05 Meta/scripts/activity-log-append.sh" \
  "- $(date '+%Y-%m-%dT%H:%M+10:00') | claude-code | korvo-{action-slug} | {one-line outcome with concrete numbers/paths}"
```

Rules:

- Surface is always `claude-code` from this repo.
- Action slug is short and prefixed `korvo-` so the vault can grep Korvo-only history.
- Outcome should include numbers (files changed, commits made), commit SHAs when relevant, and any follow-up the user still owes.
- Never write to `activity-log.md` with `>>` directly; use the helper. The lock prevents the cross-surface clobber documented in the 2026-04-25 21:05 incident.
- ISO + Sydney offset, never naked dates.

Skip the log only for read-only sessions (pure exploration, status checks, questions answered without edits).

## gstack

Use `/gstack-browse` from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills (the gstack fleet, same as the vault root): `/gstack-office-hours`, `/gstack-plan-ceo-review`, `/gstack-plan-eng-review`, `/gstack-plan-design-review`, `/gstack-design-consultation`, `/gstack-design-shotgun`, `/gstack-design-html`, `/gstack-review`, `/gstack-ship`, `/gstack-land-and-deploy`, `/gstack-canary`, `/gstack-benchmark`, `/gstack-browse`, `/gstack-qa`, `/gstack-qa-only`, `/gstack-design-review`, `/gstack-setup-browser-cookies`, `/gstack-setup-deploy`, `/gstack-retro`, `/gstack-investigate`, `/gstack-document-release`, `/gstack-codex`, `/gstack-cso`, `/gstack-autoplan`, `/gstack-plan-devex-review`, `/gstack-devex-review`, `/gstack-careful`, `/gstack-freeze`, `/gstack-guard`, `/gstack-unfreeze`, `/gstack-upgrade`, `/gstack-learn`, `/gstack-health`.

### Korvo sprint rhythm (gstack mapping)

- Branch before PR: `/gstack-review` + `/gstack-codex` for cross-model second opinion.
- Schema or RLS change: `/gstack-cso` first, then code.
- New agent prompt: `/gstack-codex` adversarial mode against the prompt diff.
- Investigating a regression: `/gstack-investigate` for root-cause analysis.
- Code-quality dashboard: `/gstack-health` (uses the HEALTH STACK section above).
- Visual / design audit: `/gstack-design-review`.
- Pre-deploy: `/gstack-qa` against the deployed preview.
- `/gstack-learn` accumulates Korvo-specific patterns (Prisma quirks, BullMQ flow gotchas, agent JSON drift) across sessions.

### Skill routing

- Use gstack skills when the question matches the sprint-rhythm map above.
- Use GSD entry points (`/gsd:quick`, `/gsd:debug`, `/gsd:execute-phase`) for planning + phase work.
- Prefer gstack `/gstack-review` over generic code review for branch-level review; auto-fix is the differentiator.

## LINKS

- Project source of truth: `.planning/PROJECT.md`
- Roadmap: `.planning/ROADMAP.md`
- Architecture decisions: `.planning/DECISIONS.md`
- v2 reset progress: `.planning/PROGRESS.md`
- 4-agent spec: `.planning/AGENTS.md`
- Stack research (verbose): `.planning/research/`
- Vault claude-context: `../../05 Meta/claude-context.md`
- Vault decisions: `../../05 Meta/decisions.md`
- Vault activity log: `../../05 Meta/activity-log.md`
- Anthropic SDK: https://docs.anthropic.com
- BullMQ flows: https://docs.bullmq.io/guide/flows
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side
- gstack docs: https://github.com/garrytan/gstack
