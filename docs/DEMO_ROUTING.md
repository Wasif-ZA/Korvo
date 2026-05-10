# Demo routing

Korvo now separates the public marketing surface from the interactive demo.

## Routes

| Route               | Purpose                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `/`                 | Marketing homepage. Uses the existing marketing sections and points visitors toward the demo. |
| `/demo`             | Interactive zero-key demo app. This is the former root chat experience.                       |
| `/pricing`          | Public pricing page. The in-demo pricing view still lives inside `/demo?view=pricing`.        |
| `/login`, `/signup` | Auth pages for real mode. Demo mode does not require these.                                   |

## Why

The old root path opened the demo immediately, which made the project feel like an internal app rather than a portfolio-ready product. The current root page is intentionally quieter: clear headline, honest demo-first CTA, simple workflow explanation, and no fake terminal/changelog styling. Reviewers get a normal landing page first, then a clear path into the working demo.

## Demo mode

Run:

```bash
npm run demo
```

Then open:

```text
http://localhost:3000
```

Use the marketing page CTA or go directly to:

```text
http://localhost:3000/demo
```

The demo still uses `.env.demo`, synthetic auth, seeded searches, seeded pipeline data, and no real Supabase, Redis, Claude, Gmail, or Stripe calls.

## Stripe return paths

Demo and real checkout return to `/demo?session_id=...`, because the checkout success handler lives in `app/demo/page.tsx`. Cancel returns to `/demo?view=pricing`.
