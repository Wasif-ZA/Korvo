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
- **08-03** — Pending
- **08-04** — Pending

### Next Steps
- **08-03/08-04:** Complete remaining chat UI reconnection tasks.
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
