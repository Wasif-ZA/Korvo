# Korvo Progress

## Current Status
Planning reset complete. Codebase needs triage before new feature work.

## Phase 0: Triage (do this FIRST)
- [ ] Audit current codebase - identify what's broken vs working
- [ ] List all files with errors/broken imports
- [ ] Decide: fix or rewrite each broken module
- [ ] Get the app to build and run locally with zero errors

## Phase 1: Core Loop MVP
- [ ] Company search input (autocomplete)
- [ ] Contact discovery (Apollo API integration)
- [ ] Email pattern guessing (Hunter API or custom logic)
- [ ] Email draft generation (Claude Haiku, validated template)
- [ ] Draft display with inline editing
- [ ] Copy to clipboard
- [ ] Basic auth (Supabase Google OAuth)

## Phase 2: Post-MVP
- [ ] Pipeline tracker (To Contact / Waiting / Chatting / Applied)
- [ ] Follow-up scheduling
- [ ] Coffee chat prep briefs (Claude Sonnet)
- [ ] Stripe billing integration
- [ ] Landing page + waitlist

## Completed
- [x] Planning v1 created
- [x] Stack decisions locked
- [x] Agent ownership defined (Claude Code: backend, Gemini CLI: frontend, Copilot: testing)
- [x] Real outreach data collected (46 emails, pattern analysis complete)
- [x] Planning reset to v2 with validated email template
