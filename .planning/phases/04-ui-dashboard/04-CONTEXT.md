# Phase 4: UI & Dashboard - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the existing frontend components (search form, pipeline tracker, contact cards, Kanban board) to real Phase 3 API data. Replace all mock data with TanStack Query API calls. Implement full interactivity: inline email editing, draft regeneration, drag-and-drop pipeline stages, expandable research cards, and real-time progress via Supabase Realtime. Mobile responsive. No Gmail send (Phase 5), no analytics/monitoring (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Results Page Layout

- **D-01:** Vertical stack layout — all 3 contacts stacked vertically on the results page. One scroll to see everything. Per UI-02 (no extra clicks required).
- **D-02:** Score badge always visible on each contact card (colored by tone band: green=direct, amber=curious, red=value-driven). Research card collapsed by default with "View Research" toggle. Keeps initial view clean.
- **D-03:** Email draft shown inline below each contact card. Subject and body are directly editable fields (see D-08).

### Kanban Board Interactions

- **D-04:** Drag-and-drop (@dnd-kit) on desktop + click-to-move dropdown on mobile. Per DASH-02 requirement. @dnd-kit already approved in UI-SPEC.
- **D-05:** On mobile, Kanban board collapses to vertical list grouped by stage: "Identified (2)", "Contacted (1)", etc. Tap contact to see details. Click-to-move via dropdown. Per UI-09 (mobile responsive).
- **D-06:** Pipeline stages: Identified → Contacted → Responded → Chatted → Applied → Interviewing. Per DASH-01.
- **D-07:** Optimistic updates on stage move — move contact immediately in UI, fire API call in background, revert on failure with toast error.

### Email Draft Editing (EMAIL-04, EMAIL-05)

- **D-08:** Inline editing — subject and body are directly editable fields on the contact card. Auto-save on blur or after 2-second debounce. No modal needed. Per EMAIL-04.
- **D-09:** Regenerate keeps same tone (derived from score). Click "Regenerate Draft" → spinner → new draft replaces inline. No tone picker for V1. Per EMAIL-05.
- **D-10:** Copy to clipboard with brief success animation (button text changes to "Copied!" for 2s). Per SEND-01 (free tier).
- **D-11:** mailto link opens default email client with pre-filled subject and body. Per SEND-01.

### Data Fetching Strategy

- **D-12:** SWR for all API calls (already installed and wired throughout the codebase). Use `useSWR`, `mutate()` for cache invalidation, optimistic updates for Kanban moves. Original decision was TanStack Query but SWR is already in use — user confirmed keep SWR on 2026-04-03.
- **D-13:** Supabase Realtime Broadcast for pipeline progress (4 coarse stages). When "drafts_ready" arrives, SWR fetches full PipelineResponse via GET /api/search/[id]. No polling.
- **D-14:** Search page already has Supabase Realtime subscription wired (app/(app)/search/page.tsx). Phase 4 enhances it with SWR integration for the final fetch.

### Existing Frontend State

- **D-15:** Route groups already exist: (app) for authenticated pages, (auth) for login/signup, (marketing) for landing page.
- **D-16:** Dashboard page has mock data (MOCK_STATS, MOCK_CONTACTS, MOCK_HISTORY) — replace with SWR calls to real endpoints.
- **D-17:** Components already built: SearchForm, PipelineTracker, PipelineBoard, StatCard, EmptyState. Phase 4 wires them to real data and adds missing interactivity.

### Carried Forward

- **D-18:** Pure Tailwind CSS, no component library (Phase 1, D-18)
- **D-19:** PipelineResponse shape locked with score + scoreBreakdown fields (Phase 3, D-14)
- **D-20:** Supabase Realtime Broadcast for 4 coarse stages (Phase 2, D-01/D-02)
- **D-21:** Warm, friendly, approachable design — Notion/Teal aesthetic (Phase 1 specifics)

### Claude's Discretion

Claude has flexibility on: TanStack Query key naming, cache stale times, contact card component structure, research card expand/collapse animation, copy button animation implementation, Kanban column width on desktop, search history sidebar implementation, PATCH endpoint design for draft editing, stage move API design.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context

- `.planning/PROJECT.md` — Full project vision, tech stack, constraints
- `.planning/REQUIREMENTS.md` — UI-01-09, DASH-01-05, EMAIL-04, EMAIL-05 for this phase
- `.planning/ROADMAP.md` — Phase structure, success criteria, dependencies

### Prior Phase Context

- `.planning/phases/01-foundation/01-CONTEXT.md` — Foundation decisions (D-18 pure Tailwind, warm aesthetic)
- `.planning/phases/02-queue-infrastructure/02-CONTEXT.md` — Queue decisions (D-01 Supabase Realtime, D-02 coarse stages)
- `.planning/phases/03-agent-pipeline/03-CONTEXT.md` — Agent decisions (D-14 PipelineResponse shape, D-09 score breakdown)

### UI Design Contract

- `.planning/phases/04-ui-dashboard/04-UI-SPEC.md` — Approved spacing, typography, color, copywriting contracts. MUST follow.

### Existing Frontend Code

- `app/(app)/search/page.tsx` — Search page with PipelineTracker + Supabase Realtime already wired
- `app/(app)/search/[id]/page.tsx` — Search results page (needs wiring)
- `app/(app)/dashboard/page.tsx` — Dashboard with mock data (MOCK_STATS, MOCK_CONTACTS, MOCK_HISTORY)
- `components/app/` — SearchForm, PipelineTracker, PipelineBoard, StatCard, EmptyState
- `app/api/search/[id]/route.ts` — GET endpoint returning PipelineResponse (Phase 3)

### Gemini Frontend Reference

- `GEMINI_FRONTEND.md` — Frontend sprint plan (Gemini-authored). Reference for understanding existing component structure.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `components/app/SearchForm.tsx` — Search form component (company + role + location)
- `components/app/PipelineTracker.tsx` — Step-by-step progress display
- `components/app/PipelineBoard.tsx` — Kanban board component with mock data
- `components/app/StatCard.tsx` — Dashboard stat cards
- `components/app/EmptyState.tsx` — Empty state component
- `components/ui/Button.tsx` — Design system button (primary/secondary/ghost/destructive)
- `components/ui/Card.tsx` — Card component with variants
- `components/ui/Input.tsx` — Input component
- `lib/supabase/client.ts` — createSupabaseBrowserClient for Realtime subscriptions

### Established Patterns

- Route groups: (app) for authenticated, (auth) for login/signup, (marketing) for landing
- "use client" on interactive pages
- Supabase Realtime subscription in search page (already wired)
- Toast notifications via react-hot-toast
- Prisma for all DB access on server side

### Integration Points

- `GET /api/search/[id]` — Returns PipelineResponse (Phase 3)
- `POST /api/search` — Creates search + enqueues pipeline job (Phase 2)
- Supabase Realtime Broadcast channel per search (Phase 2)
- Need new: PATCH endpoint for draft editing, POST for regenerate, PATCH for stage move

</code_context>

<specifics>
## Specific Ideas

- Landing page aesthetic is Firecrawl-style light mode (#FAFAF8 background) — app pages should feel continuous with this
- Score badge tone coloring: direct (75-100) = green/teal, curious (45-74) = amber/orange, value-driven (0-44) = warm red
- "Regenerate Draft" button text (not bare "Regenerate") per UI-SPEC FLAG recommendation
- Copy button animation: text changes "Copy to Clipboard" → "Copied!" for 2 seconds
- Search history sidebar per DASH-04 — timestamps and company names

</specifics>

<deferred>
## Deferred Ideas

- **Gmail send button** — Phase 5 (Pro tier feature, requires separate Gmail OAuth)
- **Follow-up reminders** — DASH-05 scaffolded but full implementation in V3
- **Analytics tab** — Landing page demo has placeholder tab, Phase 6 scope
- **Email preview tab** — Landing page demo has placeholder, wired when EMAIL PREVIEW data flows

</deferred>

---

_Phase: 04-ui-dashboard_
_Context gathered: 2026-04-03_
