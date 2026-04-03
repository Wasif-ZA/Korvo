# GEMINI_FRONTEND.md — Korvo Master Frontend GSD

> **Role**: You are the Frontend Agent for Korvo.
> **You own**: All pages in `src/app/`, all components in `src/components/`, all styles, Tailwind config, font setup, static assets, and client-side logic.
> **You do NOT own**: API routes (`src/app/api/`), `src/lib/`, `prisma/`, `src/workers/`, server configs — Claude Code owns those.
> **You do NOT own**: CI/CD, testing infra, git hooks, deployment configs — Copilot owns those.
> You CAN read any file for context but changes outside your ownership go through the owning agent.

---

## GSD Workflow — How to Build Any Feature

For EVERY new page or feature, follow this exact process:

### Step 1 — Create .planning/
```
.planning/[feature-name]/
├── SPEC.md          # What to build, acceptance criteria
├── DECISIONS.md     # Design decisions with reasoning
└── PROGRESS.md      # Track what's done
```

### Step 2 — Spec the feature
SPEC.md must include:
- Page route and layout parent
- All UI sections with acceptance criteria
- Data requirements (what API endpoint, what shape)
- Component breakdown (new vs reusable)
- Responsive behavior (375px / 768px / 1200px)
- Loading, empty, and error states

### Step 3 — Show for review
Output the .planning/ files. Wait for "GSD APPROVED" before building.

### Step 4 — Build in phases
One commit per phase. Update PROGRESS.md after each.

### Step 5 — Polish pass
Responsive check, animation timing, loading states, error states.

### Resetting
If the direction changes mid-build:
```
GSD RESET — [feature-name]
[what changed and why]
[what stays the same]
```
Then re-generate .planning/ and wait for approval.

---

## Project Context

| Detail | Value |
|---|---|
| **Product** | Korvo — AI-powered job outreach SaaS |
| **Framework** | Next.js 14+ (App Router, `src/app/`) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS |
| **Auth** | Supabase Auth (Google OAuth + email magic link) |
| **State** | React Server Components by default, `"use client"` only when needed |
| **Data Fetching** | Server Components fetch from API routes / Supabase direct. Client components use SWR or React Query. |
| **Package Manager** | pnpm |

---

## Design System — v3 Firecrawl Light-Mode Aesthetic

This design system applies to the ENTIRE app — landing page AND authenticated app pages.

### Theme
Light mode only. No dark mode toggle for MVP.

### Color Palette
```css
/* Page backgrounds */
--bg-page:          #FAFAF8;    /* warm off-white — main background */
--bg-section-alt:   #F5F5F0;    /* slightly recessed sections */
--bg-card:          #FFFFFF;    /* white cards sitting on off-white */
--bg-code:          #1A1A1A;    /* dark code blocks */
--bg-code-header:   #2A2A2A;    /* code block header bar */

/* Text */
--text-primary:     #1A1A1A;    /* headings, bold content */
--text-body:        #4A4A4A;    /* body paragraphs */
--text-muted:       #8A8A8A;    /* labels, hints */
--text-light:       #B0B0B0;    /* metadata, disabled */

/* Accent */
--accent:           #F97316;    /* orange — CTAs, highlights, active states */
--accent-hover:     #EA6A10;    /* darker on hover */
--accent-bg:        #FFF5EE;    /* soft orange tint for backgrounds */

/* Borders */
--border:           #E8E8E3;    /* subtle warm border */
--border-card:      #EBEBEB;    /* card borders */

/* Status */
--success:          #2D8A56;    /* completed, verified */
--success-bg:       #F0FDF4;
--warning:          #D97706;    /* pending, medium confidence */
--warning-bg:       #FFFBEB;
--error:            #DC2626;    /* failed, low confidence */
--error-bg:         #FEF2F2;

/* Code syntax highlighting */
--code-green:       #86EFAC;    /* strings */
--code-blue:        #93C5FD;    /* keys, URLs */
--code-orange:      #F97316;    /* class names */
--code-grey:        #6B7280;    /* line numbers */
--code-white:       #E5E5E5;    /* main text */
```

### Typography
```
Fonts (all via next/font/google):
  Headlines:  Source Serif 4  — weight 600, italic for accent words
  Body:       DM Sans         — weight 400 body, 500 labels, 600 bold
  Code:       JetBrains Mono  — weight 400-500, for code, labels, section indicators

Sizing scale:
  Hero headline:       48-56px, serif
  Page headline:       32-36px, serif
  Section headline:    24-28px, serif
  Card heading:        18-20px, sans, weight 600
  Body:                15-16px, sans, line-height 1.6
  Small/labels:        13-14px, sans or mono
  Tiny/metadata:       11-12px, mono
```

### Signature UI Patterns

**1. Dot-matrix background texture**
Clusters of `· · ·`, `─ ─ ─`, `┌─┐` characters at 4-6% opacity. SVG component placed behind hero and section backgrounds. Creates technical depth on light mode.

**2. Section indicators**
```
[ 01 / 05 ]  ·  SECTION NAME
```
Orange number, grey rest, monospace, thin orange vertical line on left edge. Used on landing page. NOT used in the authenticated app (app uses standard page headers).

**3. Badge format**
```
// 🎯 Outreach Engine \\
```
Decorative slashes, monospace, muted brackets. Used on landing page sections.

**4. Headline accent pattern**
Every major headline has ONE key word/phrase in orange italic:
"Land interviews with *personalized* outreach"

**5. Cards**
White bg, `1px solid #EBEBEB`, `border-radius: 12px`, `padding: 24-32px`, shadow: `0 1px 2px rgba(0,0,0,0.04)`. Hover: border darkens slightly.

**6. Confidence badges**
- High (>80%): Green dot + "High" label
- Medium (50-80%): Amber dot + "Medium" label  
- Low (<50%): Red dot + "Low" label

### What's BANNED across the entire app
- ❌ Dark mode / dark backgrounds (except code blocks)
- ❌ Inter, Roboto, Poppins, Space Grotesk fonts
- ❌ Purple gradients or blue-purple color schemes
- ❌ Heavy glassmorphism / backdrop-blur cards
- ❌ Ambient glow blobs / radial gradient backgrounds
- ❌ Emoji as icons in the app UI (landing page badges are the exception)

---

## Route Structure

```
src/app/
├── (marketing)/
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Marketing layout (no sidebar, no auth)
│
├── (auth)/
│   ├── login/page.tsx        # Login (Google OAuth + magic link)
│   ├── signup/page.tsx       # Signup (same form, different CTA)
│   └── callback/page.tsx     # OAuth callback handler
│
├── (app)/
│   ├── layout.tsx            # App shell (sidebar + header + auth guard)
│   ├── dashboard/page.tsx    # Pipeline board + stats
│   ├── search/page.tsx       # New pipeline search
│   ├── search/[id]/page.tsx  # Search results (3 contact cards)
│   ├── drafts/page.tsx       # All email drafts
│   ├── drafts/[id]/page.tsx  # Single draft editor
│   └── settings/page.tsx     # Account, plan, API keys
│
├── layout.tsx                # Root layout (fonts, metadata)
└── not-found.tsx             # 404 page
```

### Layout Groups

**(marketing)** — No auth required. No sidebar. Full-width. Uses landing page aesthetic with dot-matrix textures, section indicators, etc.

**(auth)** — No auth required. Centered card layout on warm off-white background. Minimal — just the form.

**(app)** — Auth required. App shell with:
- **Sidebar** (left, 240px desktop, collapsible tablet, bottom tabs mobile):
  - Korvo wordmark at top
  - Nav items: Dashboard, New Search, Drafts, Settings
  - Plan badge at bottom (Free / Pro / Teams)
  - Collapse toggle
- **Header** (top bar, right of sidebar):
  - Page title (left)
  - Credits remaining badge (right): "3 / 5 searches this month"
  - User avatar + dropdown (right)
- **Content area**: `max-width: 1000px`, centered with generous padding

---

## Page Specifications

### Page 1 — Landing Page (`/(marketing)`)

**Already specced in**: `korvo-landing-v3-firecrawl-aesthetic.md`

Use the v3 Firecrawl light-mode aesthetic. Full spec is in that document. Key sections: Nav, Hero with search bar, Demo split card, Features grid, Code preview, Pricing, CTA, Footer.

**GSD directory**: `.planning/landing-page/`

---

### Page 2 — Auth Pages (`/(auth)/login`, `/(auth)/signup`)

**Layout**: Centered vertically and horizontally on `#FAFAF8` background.

**Card**:
- White bg, border, rounded-xl, `max-width: 420px`, padding 40px
- Korvo wordmark at top (not a logo icon — just "Korvo" in DM Sans bold)
- Headline: "Welcome back" (login) / "Get started free" (signup) — Source Serif 4, 28px
- Subtitle: "Enter your email or sign in with Google" — DM Sans, 15px, muted

**Form**:
- Email input (rounded-lg, border, 16px padding)
- "Continue with email →" button (orange bg, full width)
- Divider: thin line with "or" centered
- "Continue with Google" button (white bg, border, Google icon, full width)
- Toggle link at bottom: "Don't have an account? Sign up" / "Already have an account? Log in"

**States**:
- Magic link sent: card content swaps to "Check your email" with envelope illustration and "Resend link" button
- Error: red banner at top of card with error message
- Loading: button shows spinner, inputs disabled

**GSD directory**: `.planning/auth-pages/`

---

### Page 3 — New Search (`/(app)/search`)

**This is the core product page. The user enters a company + role and kicks off the pipeline.**

**Layout**: App shell (sidebar + header). Content centered, `max-width: 800px`.

**Search form** (top of page):
- Headline: "Start a new search" — Source Serif 4, 28px
- Subtitle: "Enter a company name and target role. Korvo handles the rest." — DM Sans, muted
- Two inputs side-by-side (responsive → stacked on mobile):
  - Company name (text input, placeholder: "e.g. Canva")
  - Target role (text input, placeholder: "e.g. Junior SWE")
- Optional: Location dropdown (Sydney, Melbourne, Remote, etc.)
- "Run Pipeline →" button (orange, rounded-lg)
- Credits indicator: "Using 1 of 5 free searches this month" in muted text

**Loading state** (while pipeline runs, 10-30 seconds):
- Search form collapses/dims
- Pipeline progress tracker appears:
  - 4 steps in a vertical list:
    1. ⏳ Finding contacts... → ✓ Contacts Found (3 people)
    2. ⏳ Guessing emails... → ✓ Emails Guessed
    3. ⏳ Researching hooks... → ✓ Hooks Researched
    4. ⏳ Drafting emails... → ✓ Drafts Ready
  - Each step transitions from pending (grey, spinner) to complete (green checkmark) in real-time
  - Use server-sent events or polling to track BullMQ job progress
- Below the tracker: subtle animated dots or a "This usually takes 15-30 seconds" message

**GSD directory**: `.planning/search-page/`

---

### Page 4 — Search Results (`/(app)/search/[id]`)

**This page shows the 3 contacts found + their drafted emails.**

**Layout**: App shell. Content max-width 900px.

**Header area**:
- Breadcrumb: Dashboard > Canva — Junior SWE
- Company + role as page title: "Canva · Junior SWE" — Source Serif 4, 28px
- Metadata row: "3 contacts found · Sydney · Searched 2 mins ago" — DM Sans, muted
- Pipeline status badge: "Complete" (green) or "Partial" (amber)

**3 Contact Cards** (stacked vertically, full width):

Each card is a white card with border containing:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Sarah Chen                                         │
│  Engineering Manager · Canva                        │
│  sarah.chen@canva.com          [High ●] confidence  │
│                                                     │
│  ┌─ Hook ─────────────────────────────────────────┐ │
│  │ 🎯 Spoke at Config 2025 about scaling design  │ │
│  │    tokens across 40+ teams                     │ │
│  │    Source: canva.com/blog                      │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  [View Email Draft →]     [Copy Email]    [⋯ More]  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Card elements**:
- Name: sans-serif, 20px, weight 600
- Title + company: sans-serif, 15px, muted
- Email: mono, 14px, with ConfidenceBadge (green/amber/red dot + label)
- Hook section: recessed bg (`#F5F5F0`), rounded-lg, with 🎯 icon, hook text, source link in orange
- Actions row: "View Email Draft →" (orange text link), "Copy Email" (ghost button), "⋯" menu (archive, report, regenerate)

**Email Draft** (expands inline below the card when "View Email Draft" is clicked, OR opens as a slide-over panel):

```
┌─────────────────────────────────────────────────────┐
│  DRAFT EMAIL                              [✕ Close] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  To:      sarah.chen@canva.com                      │
│  Subject: [editable input]                          │
│           "Your Config talk on design tokens —      │
│            quick question"                          │
│                                                     │
│  ────────────────────────────────────────────────── │
│                                                     │
│  [editable textarea]                                │
│  "Hi Sarah,                                        │
│                                                     │
│   I watched your Config 2025 talk on scaling        │
│   design tokens across 40+ teams — the bit about   │
│   ..."                                              │
│                                                     │
│  ────────────────────────────────────────────────── │
│                                                     │
│  Hook used: Config 2025 talk                        │
│  Generated by: Claude 3.5 Sonnet                    │
│                                                     │
│  [Copy to Clipboard]  [Open in Gmail]  [Regenerate] │
│  [Mark as Sent ✓]                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Draft elements**:
- To field: read-only, mono
- Subject: editable text input, pre-filled
- Body: editable textarea, pre-filled, min-height 200px
- Hook label: small tag showing which hook was used
- Actions: "Copy to Clipboard" (primary, orange), "Open in Gmail" (ghost, opens mailto:), "Regenerate" (ghost, re-runs Claude), "Mark as Sent" (ghost, moves contact to Contacted stage)
- Copy feedback: button text changes to "Copied!" with checkmark for 2 seconds

**GSD directory**: `.planning/search-results/`

---

### Page 5 — Dashboard (`/(app)/dashboard`)

**The pipeline board — where users track their outreach across all companies.**

**Layout**: App shell. Full width within content area.

**Stats row** (top, 4 cards in horizontal grid):
- Total Contacts: count
- Emails Sent: count
- Replies Received: count
- Reply Rate: percentage (green if >20%, amber if 10-20%, red if <10%)
Each stat card: white bg, border, number in 32px weight-700, label in 14px muted.

**Pipeline Board** (below stats):
Kanban-style columns, horizontally scrollable on mobile:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│Identified│Contacted │Responded │ Chatted  │ Applied  │Interviewing│
│    (12)  │   (8)    │   (3)    │   (2)    │   (1)    │   (0)    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │          │
│ [card]   │ [card]   │ [card]   │ [card]   │ [card]   │          │
│ [card]   │ [card]   │ [card]   │          │          │          │
│ [card]   │ [card]   │          │          │          │          │
│ ...      │          │          │          │          │          │
│          │          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Pipeline card** (small, inside each column):
- Name (14px, weight 600)
- Company (13px, muted)
- Email confidence dot (green/amber/red, no label — just the dot)
- Days since last action (tiny, muted: "3d ago")
- Click to expand → slide-over with full contact details, email draft, notes

**Column header**: Column name + count badge. Count uses muted bg with number.

**Drag to move**: User can drag cards between columns OR click card → change status via dropdown.

**Empty state** (if no contacts yet):
- Centered illustration (simple line art or SVG)
- "No contacts yet"
- "Run your first search to start building your pipeline"
- "New Search →" button (orange)

**Search history** (sidebar or collapsible section):
- List of recent searches: "Canva · Junior SWE · 3 contacts · 2 days ago"
- Click to revisit search results page

**GSD directory**: `.planning/dashboard/`

---

### Page 6 — Settings (`/(app)/settings`)

**Layout**: App shell. Content max-width 700px. Sectioned with dividers.

**Section 1 — Account**
- Display name (editable input)
- Email (read-only, muted)
- Avatar (Supabase auth profile image)
- "Sign out" button (ghost, red text)

**Section 2 — Plan & Usage**
- Current plan badge: "Free Plan" / "Pro Plan" / "Teams Plan"
- Usage bar: "3 / 5 searches used this month" with progress bar (orange fill)
- "Upgrade to Pro →" button (orange) or "Manage subscription" link (opens Stripe portal)
- Billing history link

**Section 3 — API Keys (Pro tier only)**
- Apollo API key input (password-masked, with reveal toggle)
- Hunter API key input (same)
- "Save keys" button
- Info text: "Your keys are encrypted and stored securely. We never share them."
- If Free tier: section shows locked state with "Upgrade to Pro to use your own API keys"

**Section 4 — Defaults**
- Default target role (text input, e.g., "Junior Software Engineer")
- Default location (dropdown: Sydney, Melbourne, Remote, etc.)
- "Save defaults" button

**GSD directory**: `.planning/settings/`

---

## Component Architecture

```
src/components/
├── marketing/               # Landing page components (Gemini owns)
│   ├── navbar.tsx
│   ├── hero.tsx
│   ├── demo-card.tsx
│   ├── features-grid.tsx
│   ├── code-preview.tsx
│   ├── pricing-section.tsx
│   ├── cta-section.tsx
│   ├── footer.tsx
│   ├── dot-matrix.tsx       # Background texture SVG
│   ├── section-indicator.tsx # [ 01 / 05 ] pattern
│   ├── badge.tsx            # // Text \\ pattern
│   └── sparkle.tsx          # ✦ decorations
│
├── app/                     # Authenticated app components (Gemini owns)
│   ├── app-shell.tsx        # Sidebar + header + content wrapper
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── search-bar.tsx       # Company + role input form
│   ├── contact-card.tsx     # Contact with hooks + actions
│   ├── email-draft.tsx      # Editable email with copy/send actions
│   ├── pipeline-board.tsx   # Kanban columns
│   ├── pipeline-card.tsx    # Small card inside kanban column
│   ├── pipeline-tracker.tsx # Loading state with step progress
│   ├── stat-card.tsx        # Dashboard metric card
│   ├── confidence-badge.tsx # Green/amber/red dot + label
│   ├── credits-badge.tsx    # "3/5 searches" indicator
│   ├── plan-badge.tsx       # Free/Pro/Teams pill
│   └── empty-state.tsx      # Illustration + message + CTA
│
├── auth/                    # Auth page components (Gemini owns)
│   ├── auth-card.tsx        # Centered card wrapper
│   ├── auth-form.tsx        # Email + Google OAuth form
│   └── magic-link-sent.tsx  # "Check your email" state
│
└── ui/                      # Shared primitives (Gemini owns)
    ├── button.tsx           # Primary (orange), ghost, outline variants
    ├── input.tsx            # Text input with label + error state
    ├── textarea.tsx         # Textarea with char count
    ├── select.tsx           # Dropdown
    ├── badge.tsx            # Status badge (generic)
    ├── toast.tsx            # Success/error notifications
    ├── skeleton.tsx         # Loading placeholder
    ├── modal.tsx            # Dialog/modal wrapper
    ├── slide-over.tsx       # Side panel (for contact details)
    └── divider.tsx          # Horizontal rule
```

---

## API Contracts — What Claude Code Provides

These are the endpoints Claude Code builds. You consume them. If the shape changes, Claude Code will flag it.

### Auth
- `POST /api/auth/signup` — handled by Supabase Auth, you just redirect
- `GET /api/auth/callback` — OAuth callback, Supabase handles
- `POST /api/auth/signout` — clear session

### Pipeline
- `POST /api/pipeline/start` — `{ company: string, role: string, location?: string }` → `{ jobId: string }`
- `GET /api/pipeline/status/[jobId]` — returns current step status (poll this during loading)
- `GET /api/pipeline/results/[jobId]` — returns full PipelineResponse when complete

### Contacts
- `GET /api/contacts` — list all user's contacts (for dashboard board)
- `PATCH /api/contacts/[id]` — update status (move between pipeline columns)
- `DELETE /api/contacts/[id]` — archive contact

### Drafts
- `GET /api/drafts/[contactId]` — get email draft for a contact
- `PATCH /api/drafts/[id]` — update subject/body (user edits)
- `POST /api/drafts/[id]/regenerate` — re-run Claude to generate new draft
- `POST /api/drafts/[id]/mark-sent` — mark as sent, move contact to Contacted

### User
- `GET /api/user/profile` — name, email, plan, usage
- `PATCH /api/user/profile` — update defaults, name
- `POST /api/user/api-keys` — save Apollo/Hunter keys (encrypted)
- `GET /api/user/usage` — searches used this month, limit

### Waitlist (marketing page)
- `POST /api/waitlist` — `{ email: string }` → `{ success: true }`

### Data Types

```typescript
interface PipelineResponse {
  id: string;
  company: string;
  role: string;
  location?: string;
  status: "running" | "complete" | "failed";
  contacts: Contact[];
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  confidence: number;          // 0-1
  hooks: Hook[];
  pipeline_stage: PipelineStage;
  draft?: EmailDraft;
  created_at: string;
  last_action_at: string;
}

interface Hook {
  text: string;                // "Spoke at Config 2025 about design tokens"
  source: string;              // "canva.com/blog"
  type: "blog" | "talk" | "news" | "role" | "growth";
}

interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  hook_used: string;
  status: "draft" | "reviewed" | "sent";
  generated_by: string;        // "claude-3.5-sonnet"
}

type PipelineStage =
  | "identified"
  | "contacted"
  | "responded"
  | "chatted"
  | "applied"
  | "interviewing";

interface PipelineStep {
  id: "contacts" | "emails" | "hooks" | "drafts";
  label: string;
  status: "pending" | "running" | "complete" | "failed";
  detail?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "teams";
  searches_used: number;
  searches_limit: number;
  defaults: {
    role?: string;
    location?: string;
  };
  has_apollo_key: boolean;
  has_hunter_key: boolean;
}
```

---

## Build Order — Suggested Sprint Plan

### Sprint 1 — Foundation
```
.planning/foundation/
```
1. Root layout with fonts (Source Serif 4, DM Sans, JetBrains Mono)
2. Tailwind config with design system colors, spacing
3. `src/components/ui/` primitives (button, input, textarea, badge, skeleton, toast)
4. 404 page

### Sprint 3 — Auth
```
.planning/auth-pages/
```
Login, signup, callback, magic link sent state.

### Sprint 4 — App Shell
```
.planning/app-shell/
```
Sidebar, header, credits badge, plan badge, responsive collapse, auth guard layout.

### Sprint 5 — Search + Results
```
.planning/search-page/
.planning/search-results/
```
New search form, pipeline loading tracker, contact cards, email draft editor, copy/send actions.

### Sprint 6 — Dashboard
```
.planning/dashboard/
```
Stats row, kanban pipeline board, drag-to-move, contact slide-over, empty state, search history.

### Sprint 7 — Settings
```
.planning/settings/
```
Account, plan/usage, API keys, defaults.

### Sprint 8 — Polish
Responsive pass on every page, animation timing, error states, loading skeletons, toast notifications.

---

## Rules

- **Server Components by default**. Only add `"use client"` for: forms, interactive state, animations, real-time updates (pipeline tracker).
- **One component per file**. Default export.
- **No component libraries** (no shadcn, no Radix, no Headless UI) for MVP. Build everything from scratch with Tailwind. This keeps the design distinctive.
- **Mock data first**. Build every page with hardcoded mock data, then wire up API calls. This lets you work independently of Claude Code's timeline.
- **Commit per phase**. Use conventional commit scopes: `feat(landing)`, `feat(auth)`, `feat(dashboard)`, `feat(search)`, `feat(settings)`, `feat(ui)`.
- **Mobile-first**. Start with 375px layout, then expand to tablet/desktop. Never the other way around.

---

## How to Use This Document

1. Drop this file in the project root as `GEMINI_FRONTEND.md`
2. For each sprint, tell Gemini:
   ```
   Read @GEMINI_FRONTEND.md. Start Sprint [N] — [name]. 
   Create .planning/[feature]/ with SPEC.md, DECISIONS.md, PROGRESS.md.
   Show me the files for review before building.
   ```
3. After reviewing, say: `GSD APPROVED. Build it.`
4. If direction changes: `GSD RESET — [feature]. [what changed]. Re-generate .planning/.`

---

## Agent Coordination Summary

| Agent | Owns | Builds |
|---|---|---|
| **Gemini (you)** | All `src/app/` pages, all `src/components/`, styles, Tailwind, fonts | UI, interactions, layouts, client-side logic |
| **Claude Code** | `src/app/api/`, `src/lib/`, `prisma/`, `src/workers/`, configs | API routes, pipeline logic, auth handlers, DB queries |
| **Copilot** | `.github/`, `tests/`, `e2e/`, `scripts/`, deploy configs | CI/CD, testing, git hooks, deployment |

If you need an API endpoint that doesn't exist yet, stub it with mock data and flag it:
```typescript
// TODO: Claude Code — need GET /api/contacts endpoint
// Using mock data until API is ready
const contacts = MOCK_CONTACTS;
