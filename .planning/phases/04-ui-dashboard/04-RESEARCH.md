# Phase 4: UI & Dashboard - Research

**Researched:** 2026-04-03
**Domain:** Next.js App Router frontend wiring — TanStack Query / SWR, @dnd-kit, Supabase Realtime, inline editing, Kanban board, SlideOver panel, new API endpoints
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Vertical stack layout — all 3 contacts stacked vertically on the results page. One scroll to see everything.
- **D-02:** Score badge always visible on each contact card (colored by tone band). Research card collapsed by default with "View Research" toggle.
- **D-03:** Email draft shown inline below each contact card. Subject and body are directly editable fields.
- **D-04:** Drag-and-drop (@dnd-kit) on desktop + click-to-move dropdown on mobile. @dnd-kit already approved in UI-SPEC.
- **D-05:** On mobile, Kanban board collapses to vertical list grouped by stage. Tap contact to see details. Click-to-move via dropdown.
- **D-06:** Pipeline stages: Identified → Contacted → Responded → Chatted → Applied → Interviewing.
- **D-07:** Optimistic updates on stage move — move contact immediately in UI, fire API call in background, revert on failure with toast error.
- **D-08:** Inline editing — subject and body are directly editable fields. Auto-save on blur or after 800ms debounce via PATCH /api/drafts/{id}.
- **D-09:** Regenerate keeps same tone (derived from score). Click "Regenerate Draft" → spinner → new draft replaces inline. No tone picker V1.
- **D-10:** Copy to clipboard with brief success animation (button text changes to "Copied!" for 2s).
- **D-11:** mailto link opens default email client with pre-filled subject and body.
- **D-12:** TanStack Query v5 for all API calls. Cache invalidation, optimistic updates for Kanban moves. (Note: dashboard page currently uses SWR — see gap analysis below.)
- **D-13:** Supabase Realtime Broadcast for pipeline progress. On "drafts_ready", TanStack Query fetches full PipelineResponse via GET /api/search/[id].
- **D-14:** Search page already has Supabase Realtime subscription wired. Phase 4 enhances with TanStack Query integration.
- **D-15:** Route groups already exist: (app), (auth), (marketing).
- **D-16:** Dashboard page has mock data (MOCK_STATS, MOCK_CONTACTS, MOCK_HISTORY) — replace with TanStack Query calls.
- **D-17:** Components already built: SearchForm, PipelineTracker, PipelineBoard, StatCard, EmptyState. Phase 4 wires them to real data and adds missing interactivity.
- **D-18:** Pure Tailwind CSS, no component library.
- **D-19:** PipelineResponse shape locked with score + scoreBreakdown fields.
- **D-20:** Supabase Realtime Broadcast for 4 coarse stages.
- **D-21:** Warm, friendly, approachable design — Firecrawl/Orange aesthetic (#FAFAF8, #F97316 accent).

### Claude's Discretion

Claude has flexibility on: TanStack Query key naming, cache stale times, contact card component structure, research card expand/collapse animation, copy button animation implementation, Kanban column width on desktop, search history sidebar implementation, PATCH endpoint design for draft editing, stage move API design.

### Deferred Ideas (OUT OF SCOPE)

- **Gmail send button** — Phase 5
- **Follow-up reminders** — DASH-05 scaffolded but full implementation in V3
- **Analytics tab** — Phase 6 scope
- **Email preview tab** — deferred
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                          | Research Support                                                                                                                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01    | Landing page with search bar (company + role + location), hero section, how-it-works, pricing        | Search page already wired. Landing page mostly complete. Phase 4 focuses on app pages, not landing.                                                                                                                                                       |
| UI-02    | One-click seamless flow: search → all results load together, no extra clicks                         | Results page uses SWR `refreshInterval` and `router.push` on completion. TanStack Query integration needed.                                                                                                                                               |
| UI-03    | Contact cards: name, title, email + ConfidenceBadge, score (0-100), personalization hook, source URL | ContactCard exists but missing score display — needs score prop added. PipelineResponse has score field.                                                                                                                                                  |
| UI-04    | Research card per contact: Background, Ask This, Mention This (structured)                           | ResearchCard component exists. ContactCard needs "View Research" toggle to expand it. DB has researchBackground/askThis/mentionThis columns.                                                                                                              |
| UI-05    | Email draft: editable subject + body, copy button, mailto link, regenerate, "Mark as Sent"           | EmailDraft component nearly complete. Needs real PATCH /api/drafts/[id] backend endpoint. "Mark as Sent" action needed.                                                                                                                                   |
| UI-06    | Loading skeleton during search (pipeline takes 60-120 seconds)                                       | SkeletonCard exists. Search page shows PipelineTracker. Results page shows skeleton on initial load.                                                                                                                                                      |
| UI-07    | Real-time progress updates via Supabase Broadcast                                                    | Search page Realtime subscription already wired with 4 stage handlers.                                                                                                                                                                                    |
| UI-08    | Warm, friendly design (Notion/Teal aesthetic, not dev-tool)                                          | Full color system, typography, and spacing documented in UI-SPEC. Already implemented in existing components.                                                                                                                                             |
| UI-09    | Mobile-responsive, tested iPhone SE through desktop                                                  | Responsive breakpoints defined in UI-SPEC. Components use md: breakpoint prefixes.                                                                                                                                                                        |
| DASH-01  | Pipeline Kanban board: Identified → Contacted → Responded → Chatted → Applied → Interviewing         | PipelineBoard with @dnd-kit already implemented. Needs real data from GET /api/contacts.                                                                                                                                                                  |
| DASH-02  | Drag or click to move contacts between stages                                                        | @dnd-kit DnD implemented in PipelineBoard. StageSelector (click-to-move dropdown) exists as component. Needs PATCH /api/contacts/[id] endpoint.                                                                                                           |
| DASH-03  | Expand contact to see email draft, research card, score breakdown, notes                             | SlideOver component exists. Dashboard onContactClick handler currently logs to console — needs real SlideOver wiring.                                                                                                                                     |
| DASH-04  | Search history sidebar with timestamps and company names                                             | Dashboard sidebar uses SWR for GET /api/search. GET /api/search route exists but shape must be verified.                                                                                                                                                  |
| DASH-05  | Basic follow-up reminder ("remind me in 7 days" per contact)                                         | FollowUpReminder component exists but uses mock timeout. Needs PATCH /api/contacts/[id]/reminder endpoint (or a simpler DB write approach). DASH-05 is scaffolded; V3 for full implementation — Phase 4 only needs the UI stub + a real persistence call. |
| EMAIL-04 | Editable subject line + body before send                                                             | EmailDraft component already has debounced auto-save via PATCH /api/drafts/[id]. Endpoint does not exist yet.                                                                                                                                             |
| EMAIL-05 | Regenerate button with different tone/template option                                                | EmailDraft "Regenerate" button exists. Needs POST /api/drafts/[id]/regenerate backend endpoint. No tone picker per D-09.                                                                                                                                  |

</phase_requirements>

---

## Summary

Phase 4 is primarily a **wiring and interactivity phase**, not a greenfield build. The component library is substantially complete: ContactCard, EmailDraft, PipelineBoard (@dnd-kit wired), PipelineTracker (Realtime wired), SlideOver, ResearchCard, ScoreBreakdown, FollowUpReminder, SkeletonCard, and StageSelector all exist in `components/app/`. The search page and results page are partially wired to real APIs.

The primary work is **four missing backend endpoints** that the frontend stubs are waiting for (`PATCH /api/drafts/[id]`, `GET /api/contacts`, `GET /api/dashboard/stats`, `PATCH /api/contacts/[id]`), plus **two regenerate/remind endpoints** (`POST /api/drafts/[id]/regenerate`, `PATCH /api/contacts/[id]/reminder`). On the frontend, the dashboard page uses SWR but D-12 specifies TanStack Query — this is a data-fetching library discrepancy that must be resolved. The SlideOver panel is built but not wired in the dashboard `onContactClick` handler. Score display is missing from ContactCard (DB has it, PipelineResponse has it, component does not render it).

The only new npm dependency required is already installed (`@dnd-kit/core`, `@dnd-kit/sortable`). `framer-motion` is installed and used in SlideOver, which conflicts with the UI-SPEC animation contract specifying Tailwind animate-in utilities. This is a pitfall to resolve.

**Primary recommendation:** Build the 4 missing API endpoints first (Wave 1), then wire the dashboard components (Wave 2), then add the score display + research card toggle to ContactCard + results page improvements (Wave 3).

---

## Standard Stack

### Core (already installed — verified in package.json)

| Library            | Installed Version | Purpose                                               | Status                             |
| ------------------ | ----------------- | ----------------------------------------------------- | ---------------------------------- |
| @dnd-kit/core      | ^6.3.1            | Drag-and-drop for Kanban                              | Installed, in use in PipelineBoard |
| @dnd-kit/sortable  | ^10.0.0           | Sortable utilities for @dnd-kit                       | Installed                          |
| @dnd-kit/utilities | ^3.2.2            | CSS utilities for drag overlays                       | Installed                          |
| swr                | ^2.4.1            | Data fetching (currently used in dashboard + results) | Installed                          |
| use-debounce       | ^10.1.1           | 800ms debounce for draft auto-save                    | Installed, used in EmailDraft      |
| framer-motion      | ^12.38.0          | Animation (used in SlideOver)                         | Installed — see pitfall note       |
| react-hot-toast    | ^2.6.0            | Toast notifications                                   | Installed                          |
| lucide-react       | ^1.7.0            | Icons                                                 | Installed                          |

> Note: D-12 specifies TanStack Query v5, but the actual installed packages show SWR — NOT @tanstack/react-query. The dashboard page uses SWR. This means D-12's "TanStack Query" intention has been implemented with SWR as a pragmatic substitute. The planner must decide: migrate to TanStack Query (extra work, no user-visible benefit) or proceed with SWR (already working, simpler). Research recommendation: **keep SWR for Phase 4** since it is already wired in both search results and dashboard, and TanStack Query migration is not a user requirement. Flag this as a discretion item.

### Missing (must be installed)

No new packages need to be installed for Phase 4. All required libraries are already in package.json.

### Alternatives Considered

| Instead of                        | Could Use                       | Tradeoff                                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWR (current)                     | TanStack Query v5 (D-12 intent) | TanStack Query has better optimistic update primitives (useMutation), but SWR is already wired and working. Migration would be a refactor, not a feature. Keep SWR for Phase 4.                                                                           |
| framer-motion (current SlideOver) | Tailwind animate-in utilities   | UI-SPEC specifies Tailwind animate-in. framer-motion is heavier and adds a bundle cost. But SlideOver already ships with framer-motion spring animation. Recommend: keep framer-motion in SlideOver only, use Tailwind animate-in elsewhere as specified. |

---

## Architecture Patterns

### Existing Project Structure (relevant to Phase 4)

```
app/
├── (app)/
│   ├── search/page.tsx           # WIRED: Realtime + POST /api/pipeline/start
│   ├── search/[id]/page.tsx      # WIRED: SWR + GET /api/search/[id]
│   └── dashboard/page.tsx        # PARTIAL: SWR wired, contacts/stats endpoints MISSING
app/api/
├── search/route.ts               # GET /api/search — list user searches (exists)
├── search/[id]/route.ts          # GET /api/search/[id] — full results (exists)
├── me/route.ts                   # GET /api/me — user profile (exists)
│   (MISSING)
│   contacts/route.ts             # GET /api/contacts (needed)
│   contacts/[id]/route.ts        # PATCH /api/contacts/[id] — stage move (needed)
│   contacts/[id]/reminder/route.ts # PATCH for follow-up reminder (needed)
│   drafts/[id]/route.ts          # PATCH /api/drafts/[id] — edit draft (needed)
│   drafts/[id]/regenerate/route.ts # POST regenerate (needed)
│   dashboard/stats/route.ts      # GET /api/dashboard/stats (needed)
components/app/
├── ContactCard.tsx               # EXISTS — needs score display + research toggle
├── EmailDraft.tsx                # EXISTS — auto-save debounce wired, PATCH endpoint missing
├── PipelineBoard.tsx             # EXISTS — DnD wired, PATCH /api/contacts/[id] missing
├── PipelineCard.tsx              # EXISTS
├── PipelineTracker.tsx           # EXISTS — Realtime wired in search page
├── ResearchCard.tsx              # EXISTS — not yet rendered in ContactCard
├── ScoreBreakdown.tsx            # EXISTS — not yet rendered in ContactCard
├── SlideOver.tsx                 # EXISTS — not wired in dashboard onContactClick
├── FollowUpReminder.tsx          # EXISTS — uses mock timeout, needs real endpoint
├── StageSelector.tsx             # EXISTS (confirmed via ls)
├── SkeletonCard.tsx              # EXISTS
shared/types/agents.ts            # PipelineResponse shape — LOCKED, includes score + scoreBreakdown
```

### Pattern 1: SWR Optimistic Update for Stage Move

The dashboard uses SWR mutate for stage moves. The correct pattern for optimistic updates with SWR is:

```typescript
// Source: SWR docs — optimistic update pattern
const handleContactMove = async (id: string, newStage: string) => {
  // Optimistic: update local data immediately without revalidation
  mutateContacts(
    (current) => ({
      ...current,
      data: current.data.map((c: Contact) =>
        c.id === id ? { ...c, pipelineStage: newStage } : c,
      ),
    }),
    { revalidate: false }, // don't revalidate yet
  );

  try {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    toast.success(`Moved to ${newStage}`);
    mutateContacts(); // revalidate for consistency
  } catch {
    // Revert optimistic update
    mutateContacts();
    toast.error("Couldn't update stage. Please try again.");
  }
};
```

### Pattern 2: API Endpoint Design for Missing Routes

Based on Prisma schema and existing endpoint conventions:

```typescript
// GET /api/contacts — returns all contacts for authenticated user
// Joins Contact → Search → Profile via userId
// Returns { success: true, data: Contact[] } envelope (TypeScript patterns rule)

// PATCH /api/contacts/[id]
// Body: { stage: string }
// Validates stage is one of 6 valid values
// Updates contact.pipelineStage in DB
// Returns { success: true, data: Contact }

// PATCH /api/drafts/[id]
// Body: { subject: string, body: string }
// Updates outreach.subject + outreach.body
// Verifies contact ownership via search.userId === auth.uid()
// Returns { success: true, data: Outreach }

// POST /api/drafts/[id]/regenerate
// No body needed (tone derived from contact.score)
// Re-runs Email Drafter agent with same contact data
// Returns { success: true, data: Outreach } with new subject/body

// GET /api/dashboard/stats
// Returns { success: true, data: { contacts: number, sent: number } }
// sent = outreach records with sentAt != null
// replied = 0 for V1 (no response tracking yet — MON-01 is Phase 6)

// PATCH /api/contacts/[id]/reminder
// Body: { reminderActive: boolean }
// Simple toggle — stores reminder date 7 days from now in contact.notes or a new field
// For V1, can use contact.notes field: { reminder_at: ISO_DATE } JSON suffix
```

### Pattern 3: ContactCard Score Display

The ContactCard currently maps PipelineResponse contacts but does not render `score` or `scoreBreakdown`. The search results page maps contacts at `app/(app)/search/[id]/page.tsx` line ~136:

```typescript
const mappedContact = {
  id: `c-${idx}`,   // BUG: uses array index not real DB id
  name: contact.name,
  title: contact.title,
  company: results.company,
  email: contact.email,
  confidence: mapConfidenceValue(contact.confidence),
  hooks: contact.hooks.map(h => ({ text: h, source: "#", type: "news" })),
  draft: draft ? { id: `d-${idx}`, ... } : undefined,
  // MISSING: score: contact.score
  // MISSING: scoreBreakdown: contact.scoreBreakdown
};
```

The `id: \`c-${idx}\``mapping is a known gap — real contact IDs are not in PipelineResponse. The GET /api/search/[id] pipeline-response assembler does not include contact.id in the response. This must be added to`assemblePipelineResponse` so ContactCard can pass real IDs to PATCH endpoints.

### Pattern 4: SlideOver Wiring in Dashboard

The dashboard page calls `onContactClick={(id) => console.log("Contact clicked:", id)}`. The SlideOver component exists. The missing wiring is:

```typescript
// In dashboard/page.tsx:
const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
const selectedContact = contacts.find(c => c.id === selectedContactId);

<PipelineBoard
  contacts={contacts}
  onContactMove={handleContactMove}
  onContactClick={(id) => setSelectedContactId(id)}
/>

<SlideOver
  isOpen={selectedContactId !== null}
  onClose={() => setSelectedContactId(null)}
  title="Contact Details"
>
  {selectedContact && (
    <>
      <ScoreBreakdown score={selectedContact.score} breakdown={selectedContact.scoreBreakdown} />
      <ResearchCard
        background={selectedContact.researchBackground}
        askThis={selectedContact.researchAskThis}
        mentionThis={selectedContact.researchMentionThis}
      />
      <EmailDraft draft={selectedContact.draft} email={selectedContact.email} ... />
      <FollowUpReminder contactId={selectedContact.id} />
    </>
  )}
</SlideOver>
```

### Anti-Patterns to Avoid

- **Using array index as contact ID** (`id: \`c-${idx}\``): The results page currently does this. Since Phase 4 requires PATCH /api/drafts/[id] and PATCH /api/contacts/[id], real DB IDs are required. The assemblePipelineResponse function must be updated to include contact.id and outreach.id in the response.
- **Polling instead of Realtime**: The search page correctly uses Supabase Realtime for stages but also has a `setInterval` polling for final status. This dual approach is acceptable but the polling interval (3s) should be kept short to avoid stale navigation.
- **Mutating contact array in place during DnD**: PipelineBoard's handleDragEnd calls `onContactMove` which triggers a SWR mutate at the dashboard level. The optimistic update must use the immutable spread pattern (TypeScript coding-style rule).
- **framer-motion everywhere**: SlideOver uses framer-motion's `AnimatePresence`. This is acceptable there, but other new animations should use Tailwind `animate-in` per UI-SPEC.
- **ScoreBreakdown field name mismatch**: The Prisma schema stores `score_breakdown` as JSON, but ScoreBreakdown component expects `{ titleMatch, seniority, hiringSignal, enrichment, activity }` while `shared/types/agents.ts` defines `ScoringSignals` as `{ titleMatchScore, seniorityScore, publicActivityScore, emailConfidenceScore, hiringSignalScore }`. These field names do not match the component's expected shape. The planner must map between them.

---

## Don't Hand-Roll

| Problem              | Don't Build                        | Use Instead                                                                   | Why                                               |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| Debounced auto-save  | Custom setTimeout hook             | `use-debounce` package (already installed, already used in EmailDraft)        | Race conditions, cleanup complexity               |
| Drag-and-drop        | Custom mouse event handlers        | `@dnd-kit/core` (already installed, already used in PipelineBoard)            | Accessibility, touch support, pointer constraints |
| Slide-over animation | Custom CSS transition + JS         | `framer-motion` AnimatePresence (already in SlideOver) or Tailwind animate-in | Interrupt handling, exit animations               |
| Clipboard copy       | Custom navigator.clipboard wrapper | Direct `navigator.clipboard.writeText` (already in ContactCard, EmailDraft)   | Already implemented correctly                     |
| Toast notifications  | Custom component                   | `react-hot-toast` (already installed, already used)                           | Already wired globally                            |
| SWR fetch + cache    | Custom fetch + useState            | SWR `useSWR` with `mutate` (already in dashboard and results)                 | Stale-while-revalidate, deduplication             |

**Key insight:** All required UI interaction libraries are already installed and partially wired. Phase 4 is about completing the wiring, not about new library decisions.

---

## Runtime State Inventory

Step 2.5: SKIPPED — Phase 4 is not a rename/refactor/migration phase. It is a wiring and feature completion phase.

---

## Environment Availability

| Dependency          | Required By             | Available             | Version           | Fallback                                  |
| ------------------- | ----------------------- | --------------------- | ----------------- | ----------------------------------------- |
| Node.js             | Next.js dev server      | Yes                   | (project running) | —                                         |
| @dnd-kit/core       | DASH-02 drag-and-drop   | Yes                   | ^6.3.1            | StageSelector dropdown (already exists)   |
| @dnd-kit/sortable   | DASH-02                 | Yes                   | ^10.0.0           | —                                         |
| swr                 | Dashboard data fetching | Yes                   | ^2.4.1            | —                                         |
| use-debounce        | EMAIL-04 auto-save      | Yes                   | ^10.1.1           | —                                         |
| framer-motion       | SlideOver animation     | Yes                   | ^12.38.0          | Tailwind animate-in                       |
| Supabase Realtime   | UI-07 progress          | Yes (Phase 2 wired)   | —                 | Polling fallback (already in search page) |
| Prisma / PostgreSQL | All API endpoints       | Yes (Phase 1-3 wired) | —                 | —                                         |

**No missing dependencies.**

---

## Common Pitfalls

### Pitfall 1: assemblePipelineResponse Missing contact.id and outreach.id

**What goes wrong:** The results page maps contacts as `id: \`c-${idx}\`` (array index). When PATCH /api/drafts/[id] or PATCH /api/contacts/[id] is called, the ID is fake and the backend 404s.

**Why it happens:** `assemblePipelineResponse` in `lib/api/pipeline-response.ts` does not include `c.id` or `o.id` in the response shape, and `shared/types/agents.ts` PipelineResponse interface does not have `id` fields on contacts or drafts.

**How to avoid:** Update `assemblePipelineResponse` to include `id` on each contact and `id` on each draft entry. Update `PipelineResponse` type in `shared/types/agents.ts` to add `id: string` fields. Update the results page mapping to use real IDs.

**Warning signs:** 404 errors on PATCH calls to `/api/drafts/c-0` or similar fake IDs.

### Pitfall 2: ScoreBreakdown Field Name Mismatch

**What goes wrong:** ScoreBreakdown component expects `{ titleMatch, seniority, hiringSignal, enrichment, activity }` but `ScoringSignals` in `shared/types/agents.ts` defines `{ titleMatchScore, seniorityScore, publicActivityScore, emailConfidenceScore, hiringSignalScore }`. The JSON stored in Prisma `scoreBreakdown` field follows the `ScoringSignals` shape (camelCase with "Score" suffix).

**How to avoid:** Either update ScoreBreakdown component's interface to match `ScoringSignals`, or add a mapping layer in the SlideOver that transforms the stored shape before passing to ScoreBreakdown. Simpler fix: update ScoreBreakdown component props to accept `ScoringSignals` directly and update field references.

### Pitfall 3: SWR vs TanStack Query Intent (D-12 discrepancy)

**What goes wrong:** D-12 says "TanStack Query v5" but the actual codebase uses SWR throughout. `@tanstack/react-query` is NOT in package.json. Implementing D-12 literally would require a new dependency + migration.

**How to avoid:** The planner should treat SWR as the effective data-fetching library for Phase 4. The optimistic update pattern works with SWR's `mutate`. Note this deviation in any plan commentary. Do NOT install TanStack Query — it adds scope without user-visible benefit.

### Pitfall 4: framer-motion in SlideOver vs UI-SPEC Animation Contract

**What goes wrong:** SlideOver uses `framer-motion`'s `AnimatePresence` with spring physics (`type: "spring", damping: 25, stiffness: 200`). UI-SPEC specifies `animate-in slide-in-from-right duration-250` (Tailwind). These are two different animation systems.

**How to avoid:** Accept framer-motion in SlideOver since it is already implemented. The spring animation provides better UX than a CSS transition for the slide-over use case. Do NOT introduce framer-motion in any new components — use Tailwind animate-in as specified.

### Pitfall 5: GET /api/search Returns Wrong Shape for Sidebar

**What goes wrong:** The dashboard sidebar uses `GET /api/search` for history. The existing `app/api/search/route.ts` (POST handler for creating searches) likely doesn't have a GET handler, or its GET response may not match `{ id, company, role, contactsCount }` expected by the sidebar rendering.

**How to avoid:** Verify the GET handler in `app/api/search/route.ts` before relying on it. The dashboard sidebar renders `item.id`, `item.company`, `item.role`, `item.contactsCount` — confirm the DB query includes a contact count aggregation.

### Pitfall 6: PipelineBoard Contact Shape Mismatch

**What goes wrong:** PipelineBoard expects `Contact` with shape `{ id, name, company, confidence, lastActionAt, stage }` but the GET /api/contacts response will return raw DB Contact records with `pipelineStage` (not `stage`), `emailConfidence` (not `confidence`), and no `lastActionAt` (DB has `updatedAt`).

**How to avoid:** Either map the DB shape to the PipelineBoard's expected shape in the API response, or update PipelineBoard's Contact interface to use the DB field names. Mapping at the API layer is cleaner.

### Pitfall 7: FollowUpReminder Needs Real Persistence

**What goes wrong:** FollowUpReminder uses `await new Promise(resolve => setTimeout(resolve, 600))` as a mock. DASH-05 is "scaffolded" per deferred context, but the UI already shows a "Set Follow-up" button — if it silently does nothing, it will feel broken.

**How to avoid:** Implement a minimal real persistence: add a `reminderAt` field to the DB via migration OR store the reminder date in contact `notes` as a JSON-serialized metadata object. The simplest V1 approach is a new `reminderAt DateTime?` column on Contact and a `PATCH /api/contacts/[id]/reminder` endpoint.

---

## Code Examples

### Existing: EmailDraft Auto-Save (already correct)

```typescript
// components/app/EmailDraft.tsx — debounced PATCH (endpoint missing, pattern is correct)
const [debouncedSubject] = useDebounce(subject, 800);
const [debouncedBody] = useDebounce(body, 800);

useEffect(() => {
  if (debouncedSubject !== draft.subject || debouncedBody !== draft.body) {
    saveDraft(debouncedSubject, debouncedBody);
  }
}, [debouncedSubject, debouncedBody, draft.subject, draft.body, saveDraft]);
```

### Existing: PipelineBoard DnD (already correct, needs real stage move call)

```typescript
// components/app/PipelineBoard.tsx — handleDragEnd
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const newStage = over.id as Stage;
    if (STAGES.some((s) => s.id === newStage)) {
      onContactMove(contactId, newStage); // calls dashboard handler → SWR optimistic update
    }
  }
}
```

### Pattern: Prisma query for GET /api/contacts

```typescript
// app/api/contacts/route.ts (new)
const contacts = await prisma.contact.findMany({
  where: {
    search: { userId: user.id },
    deletedAt: null,
  },
  include: {
    outreach: { take: 1, orderBy: { createdAt: "desc" } },
    search: { select: { company: true, role: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

### Pattern: Prisma query for GET /api/dashboard/stats

```typescript
// app/api/dashboard/stats/route.ts (new)
const [contactCount, sentCount] = await Promise.all([
  prisma.contact.count({
    where: { search: { userId: user.id }, deletedAt: null },
  }),
  prisma.outreach.count({
    where: {
      sentAt: { not: null },
      contact: { search: { userId: user.id } },
    },
  }),
]);
// Replied = 0 for V1 (no response tracking until MON-01 Phase 6)
```

### Pattern: Prisma query for GET /api/search (GET list — may need to be added)

```typescript
// Sidebar history query
const searches = await prisma.search.findMany({
  where: { userId: user.id, deletedAt: null },
  orderBy: { createdAt: "desc" },
  take: 20,
  include: { _count: { select: { contacts: true } } },
});
// Map: { id, company, role, createdAt, contactsCount: _count.contacts }
```

---

## State of the Art

| Old Approach                              | Current Approach                      | When Changed        | Impact                                                                   |
| ----------------------------------------- | ------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| TanStack Query (D-12 spec)                | SWR (actual implementation)           | Phase 4 start       | SWR works; TanStack Query migration would add scope without user benefit |
| @dnd-kit/core collision: rectIntersection | closestCorners (PipelineBoard)        | Already implemented | closestCorners is correct for column-based Kanban                        |
| Polling for pipeline status               | Realtime Broadcast + polling fallback | Phase 2             | Hybrid approach ensures reliability                                      |

---

## Open Questions

1. **Does GET /api/search handle GET requests?**
   - What we know: `app/api/search/route.ts` exists; POST handler creates searches.
   - What's unclear: Whether a GET handler exists that returns search history with `contactsCount`. Dashboard sidebar SWR call is `GET /api/search`.
   - Recommendation: Planner must include a task to add GET handler to `app/api/search/route.ts` if not present. Check the file before building.

2. **ScoreBreakdown field mapping — which direction to fix?**
   - What we know: Component uses `titleMatch`, types use `titleMatchScore`. These differ.
   - What's unclear: Whether Phase 3 actually stores data using `titleMatchScore` naming or a different naming.
   - Recommendation: Plan should include a task to audit what JSON shape is actually stored in `contact.scoreBreakdown` in the DB, then fix the ScoreBreakdown component to match.

3. **DASH-05 FollowUpReminder — DB schema change or notes JSON hack?**
   - What we know: FollowUpReminder needs real persistence. Contact schema has a `notes` String? field. No `reminderAt` column exists.
   - What's unclear: Whether a new migration is in scope for Phase 4.
   - Recommendation: Use a Prisma migration to add `reminderAt DateTime? @map("reminder_at")` to Contact. This is cleaner than storing metadata in notes. A migration is a single command and does not risk breaking existing functionality.

---

## Validation Architecture

### Test Framework

| Property           | Value                                    |
| ------------------ | ---------------------------------------- |
| Framework          | Vitest + jsdom + @testing-library/react  |
| Config file        | `vitest.config.ts` (root)                |
| Quick run command  | `npm test -- --testPathPattern tests/ui` |
| Full suite command | `npm test`                               |

### Phase Requirements → Test Map

| Req ID   | Behavior                                          | Test Type | Automated Command                             | File Exists?                                                                        |
| -------- | ------------------------------------------------- | --------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| UI-03    | ContactCard renders score badge and confidence    | unit      | `npm test -- tests/ui/contact-card.test.tsx`  | Partial (tests/ui/contact-card.test.tsx exists but tests PricingCard, needs update) |
| UI-04    | Research toggle shows/hides ResearchCard          | unit      | `npm test -- tests/ui/contact-card.test.tsx`  | Wave 0 gap                                                                          |
| UI-05    | EmailDraft copy button changes label to "Copied!" | unit      | `npm test -- tests/ui/email-preview.test.tsx` | Exists (tests/ui/email-preview.test.tsx)                                            |
| UI-07    | Realtime stage updates advance tracker steps      | unit      | `npm test -- tests/ui/pipeline.test.tsx`      | Exists (tests/ui/pipeline.test.tsx)                                                 |
| DASH-01  | PipelineBoard renders 6 stage columns             | unit      | `npm test -- tests/ui/pipeline.test.tsx`      | Exists                                                                              |
| DASH-02  | Stage move calls onContactMove with correct args  | unit      | `npm test -- tests/ui/pipeline.test.tsx`      | Wave 0 gap (DnD interaction test)                                                   |
| DASH-03  | SlideOver opens on contact click                  | unit      | new test file                                 | Wave 0 gap                                                                          |
| EMAIL-04 | EmailDraft fires PATCH after 800ms debounce       | unit      | `npm test -- tests/ui/email-preview.test.tsx` | Exists — check coverage                                                             |
| EMAIL-05 | Regenerate button triggers POST regenerate        | unit      | `npm test -- tests/ui/email-preview.test.tsx` | Wave 0 gap                                                                          |

### Sampling Rate

- **Per task commit:** `npm test -- tests/ui` (UI tests only, < 10 seconds)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/ui/contact-card.test.tsx` — update to test real ContactCard (not PricingCard proxy); cover score badge, research toggle (UI-03, UI-04)
- [ ] `tests/ui/slide-over.test.tsx` — SlideOver open/close, ESC key, backdrop click (DASH-03)
- [ ] `tests/api/contacts-route.test.ts` — GET /api/contacts, PATCH /api/contacts/[id] (DASH-01, DASH-02)
- [ ] `tests/api/drafts-route.test.ts` — PATCH /api/drafts/[id], POST regenerate (EMAIL-04, EMAIL-05)

---

## Project Constraints (from CLAUDE.md)

All directives from CLAUDE.md that the planner must verify compliance with:

| Constraint                                          | Impact on Phase 4                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **@anthropic-ai/sdk only** (not claude-agent-sdk)   | Draft regenerate endpoint must use `@anthropic-ai/sdk` with manual tool-use loop                                |
| **No LinkedIn scraping**                            | Not applicable to Phase 4                                                                                       |
| **No auto-sending emails**                          | Phase 4 copy-to-clipboard + mailto only (SEND-01 pattern)                                                       |
| **Haiku 4.5 for high-volume**                       | Regenerate endpoint uses Email Drafter agent — use Haiku 4.5 (same as original drafter)                         |
| **Pure Tailwind CSS** (D-18)                        | No new component libraries; framer-motion in SlideOver is legacy, acceptable                                    |
| **Prisma for all DB access**                        | All new API endpoints use Prisma, not raw SQL or Supabase client                                                |
| **@supabase/ssr for auth**                          | New API routes must use `createSupabaseServerClient()` from `lib/supabase/server.ts`                            |
| **middleware.ts NOT for auth guards in Next.js 16** | Route guards via Supabase server client in each route handler                                                   |
| **Zod for all input validation**                    | PATCH /api/drafts/[id], PATCH /api/contacts/[id] must validate body with Zod                                    |
| **No console.log in production code**               | EmailDraft has `console.log("[mock-save]...")` — must be removed                                                |
| **Functions <50 lines**                             | Large page files (dashboard/page.tsx is 157 lines) — acceptable as page, but logic should be extracted to hooks |
| **GSD workflow for file changes**                   | All edits through /gsd:execute-phase                                                                            |

---

## Sources

### Primary (HIGH confidence — code read directly)

- `components/app/PipelineBoard.tsx` — @dnd-kit integration verified, DnD pattern complete
- `components/app/EmailDraft.tsx` — debounce pattern verified, `use-debounce` wired
- `components/app/SlideOver.tsx` — framer-motion AnimatePresence pattern verified
- `components/app/ContactCard.tsx` — score/research missing confirmed
- `app/(app)/search/page.tsx` — Realtime subscription verified wired
- `app/(app)/dashboard/page.tsx` — SWR usage verified, missing endpoints confirmed
- `app/(app)/search/[id]/page.tsx` — SWR + fake IDs confirmed
- `shared/types/agents.ts` — PipelineResponse shape verified, ScoringSignals naming confirmed
- `prisma/schema.prisma` — DB fields verified (researchBackground, askThis, mentionThis, scoreBreakdown, pipelineStage)
- `lib/api/pipeline-response.ts` — assemblePipelineResponse gaps (no id fields) confirmed
- `package.json` — all installed packages verified
- `.planning/frontend-requests.md` — 4 pending endpoints confirmed
- `vitest.config.ts` — test framework confirmed
- `tests/ui/` — existing test files verified

### Secondary (MEDIUM confidence — CONTEXT.md and UI-SPEC)

- `04-CONTEXT.md` — all decisions D-01 through D-21 read and used
- `04-UI-SPEC.md` — design contract, animation contract, component inventory read

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified in package.json
- Architecture: HIGH — all components read directly; gap analysis based on actual code
- Pitfalls: HIGH — identified from actual code discrepancies (ID mapping, field names, SWR vs TanStack Query)
- Test infrastructure: HIGH — vitest.config.ts and existing test files read directly

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable stack, 30-day window)
