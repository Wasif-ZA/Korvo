---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Milestone complete
last_updated: "2026-04-05T04:34:43.494Z"
progress:
  total_phases: 9
  completed_phases: 9
  total_plans: 38
  completed_plans: 38
---

# Project State: Korvo

## Conversational UX Rebuild (Complete)

The project has pivoted from a traditional page-based UI to a single-page conversational interface. All core functionality (search, research, drafting, auth gating, and pipeline management) is now accessible through a chat-style UI at `/`.

### Progress Summary

- **Phase 1: Chat Shell** ✅
  - `ChatLayout`, `ChatWindow`, `ChatInput`, `HeroPrompt` (with How-it-works) implemented.
- **Phase 2: Search Integration** ✅
  - Integrated `/api/search` with polling and `ThinkingIndicator`.
  - `ContactCard` and `SystemMessage` components for results.
- **Phase 3: Email Drafting** ✅
  - `EmailDraft` component with inline editing, copy, and Gmail integration.
- **Phase 4: Auth Gate** ✅
  - Inline `AuthGate` message after the first free search.
  - Handled post-login redirection and welcome messages.
- **Phase 5: Sidebar + Pipeline** ✅
  - `Sidebar` with search history and usage tracking.
  - `PipelineView` (Kanban) integrated into the chat window.
- **Phase 6: Polish & Integrated Views** ✅
  - `framer-motion` animations for messages and view transitions.
  - `SettingsView` and `PricingView` integrated into the chat layout.
  - Real search history reloading (sidebar items populate chat).
  - Mobile responsiveness and SEO metadata updates.
- **Phase 7: Analytics & Onboarding** ✅
  - **PostHog Integration:** Type-safe `track()` helper wired to search, signup, email copy/sent, and pipeline changes (`MON-01`, `MON-03`).
  - **Hero Onboarding:** Enhanced `HeroPrompt` with "How it works" steps.
  - **Deep Linking:** Handled `?view=` query params for direct access to settings/pricing.
  - **Legacy Sunset:** Redirected `/settings` and `/pricing` to the main conversational UI.

### Current Challenges

- **Worker Type Errors:** Some pre-existing type errors in `worker/` directory persist but do not affect the frontend build success.
- **Backend Sync:** Awaiting V2 endpoints for "Prep Briefs" (Sonnet 4.6).

### Phase 8: Chat UI Reconnection (In Progress)

- **08-01** ✅ OAuth callback route restored at `app/auth/callback/route.ts`
- **08-02** ✅ Legal pages restored at `/privacy` and `/terms`; footer links added to root layout (LEGAL-01..04 complete)
- **08-03** ✅ Upgrade event bridge + guest adoption in page.tsx; sidebar real usage + stats; ContactCard reminder toggle
- **08-04** ✅ Gmail send ported into chat/EmailDraft; isPro/contactId/onStageMoved wired in page.tsx; SEND-02 complete

### Next Steps

- **Phase 8 complete.** All 4 plans executed.
- **V2: Sonnet 4.6 Briefs:** Implement the "Get Coffee Chat Prep" UI once backend agents provide the endpoint.
- **AI Response Detection:** Gmail read-only integration to auto-move contacts to "Responded".
- **Empty States:** Add more personality to empty pipeline states.
- **Mobile PWA:** Configure manifest and service worker for "installable" feel.

### Decisions Log

- **2026-04-04 (08-01):** Guest pipelineQueue.add uses `userId: null` — worker handles null userId for guest searches; guests now fully enqueue to BullMQ.
- **2026-04-04 (08-01):** Stripe cancel_url is `/?view=pricing` (not `/pricing`) — pricing UI is inside chat layout via view param.
- **2026-04-04 (08-01):** `/api/me` response wrapped in `{ success: true, data: {...} }` envelope to match sidebar's `data.success` check pattern.
- **2026-04-04 (08-01):** OAuth callback new user detection uses 5-second delta between `created_at` and `last_sign_in_at` timestamps.
- **2026-04-04 (08-02):** Legal pages placed at `app/privacy/` and `app/terms/` (not in route groups) so they inherit the root layout automatically.
- **2026-04-04 (08-02):** Footer uses `pointer-events-none` container with `pointer-events-auto` on individual links to avoid obstructing chat input area.
- **2026-04-04 (08-03):** Guest session stored as `'browser-session'` literal in localStorage — single-device tracking sufficient for V1.
- **2026-04-04 (08-03):** Stats grid renders conditionally on `stats.length > 0` — unauthenticated users see nothing; no loading skeleton needed.
- **2026-04-04 (08-03):** Reminder state is local `useState` — server is authoritative on page reload; acceptable for V1.
- **2026-04-04 (08-04):** Connect Gmail link navigates to `/?view=settings` (not `/settings`) — settings is inside chat layout via view param.
- **2026-04-04 (08-04):** `onStageMoved` in `app/page.tsx` fires analytics only; actual DB stage update is server-side in `/api/gmail/send`.
