# Phase 4: UI & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 04-ui-dashboard
**Areas discussed:** Results page layout, Kanban board interactions, Email draft editing UX, Data fetching strategy

---

## Results Page Layout

| Option           | Description                                                         | Selected |
| ---------------- | ------------------------------------------------------------------- | -------- |
| Vertical stack   | All 3 contacts stacked vertically. One scroll. Matches UI-02.       | ✓        |
| Tabs per contact | Tab bar with 3 names. Click to switch. Cleaner but requires clicks. |          |
| Grid with expand | 3 cards in a row. Click to expand. Compact but needs interaction.   |          |

**User's choice:** Vertical stack

| Option                      | Description                                                              | Selected |
| --------------------------- | ------------------------------------------------------------------------ | -------- |
| Score + expandable research | Score badge visible, research collapsed with toggle. Clean initial view. | ✓        |
| Everything visible          | Score, full research card, email draft all shown at once. Long cards.    |          |
| You decide                  | Claude picks best layout.                                                |          |

**User's choice:** Score + expandable research

---

## Kanban Board Interactions

| Option                         | Description                                               | Selected |
| ------------------------------ | --------------------------------------------------------- | -------- |
| Drag-and-drop + click fallback | @dnd-kit for desktop, dropdown on mobile. Best of both.   | ✓        |
| Click-to-move only             | Dropdown/buttons on each card. Simpler, works everywhere. |          |
| Drag-and-drop only             | Desktop drag only. Clean but accessibility concerns.      |          |

**User's choice:** Drag-and-drop + click fallback

| Option                         | Description                                                | Selected |
| ------------------------------ | ---------------------------------------------------------- | -------- |
| Vertical list grouped by stage | Collapse columns into sections on mobile. Tap for details. | ✓        |
| Horizontal scroll columns      | Keep column layout, swipe horizontally. Trello-like.       |          |

**User's choice:** Vertical list grouped by stage

---

## Email Draft Editing UX

| Option           | Description                                                    | Selected |
| ---------------- | -------------------------------------------------------------- | -------- |
| Inline editing   | Subject/body directly editable. Auto-save on blur/2s debounce. | ✓        |
| Modal editor     | Click 'Edit Draft' opens modal. Save/discard buttons.          |          |
| Slide-over panel | Contact details slide-over includes email section.             |          |

**User's choice:** Inline editing

| Option                   | Description                                                    | Selected |
| ------------------------ | -------------------------------------------------------------- | -------- |
| Same tone, new draft     | Regenerate keeps score-implied tone. Simple, fast.             | ✓        |
| Tone picker + regenerate | Popover with tone selection before regenerating. More control. |          |
| You decide               | Claude picks simplest UX.                                      |          |

**User's choice:** Same tone, new draft

---

## Data Fetching Strategy

| Option               | Description                                               | Selected |
| -------------------- | --------------------------------------------------------- | -------- |
| TanStack Query       | Already in stack. Cache invalidation, optimistic updates. | ✓        |
| Raw fetch + useState | No library. Manual cache management.                      |          |
| SWR                  | Lighter but fewer features. Not in planned stack.         |          |

**User's choice:** TanStack Query

| Option                          | Description                                                          | Selected |
| ------------------------------- | -------------------------------------------------------------------- | -------- |
| Supabase Realtime + final fetch | Realtime for stages, TanStack Query fetch when complete. No polling. | ✓        |
| TanStack Query polling every 3s | refetchInterval while running. Simple but adds API load.             |          |
| Both combined                   | Realtime + polling fallback. Most robust, most complex.              |          |

**User's choice:** Supabase Realtime + final fetch

---

## Claude's Discretion

- TanStack Query key naming and cache stale times
- Contact card component structure
- Research card expand/collapse animation
- Copy button animation implementation
- Kanban column width on desktop
- Search history sidebar implementation
- PATCH endpoint design for draft editing
- Stage move API design

## Deferred Ideas

- Gmail send button → Phase 5
- Follow-up reminders → V3
- Analytics tab → Phase 6
- Email preview tab → future
