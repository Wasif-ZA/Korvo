# SPEC — Sprint 1: Foundation & Route Structure

## Goal
Establish the v3 Firecrawl Light-Mode aesthetic base and reorganize the Next.js App Router structure into route groups.

## Acceptance Criteria
- [ ] Fonts: Source Serif 4 (headings), DM Sans (body), JetBrains Mono (code/mono) installed via `next/font/google`.
- [ ] CSS Variables: Full v3 color palette implemented in `globals.css`.
- [ ] Tailwind Config: Custom colors and font families mapped to Tailwind theme.
- [ ] Route Groups: 
    - `src/app/(marketing)/` created for landing, pricing.
    - `src/app/(auth)/` created for login, signup, callback.
    - `src/app/(app)/` created for dashboard, search, drafts, settings.
- [ ] Root Layout: Cleaned up to only provide global providers/fonts, delegating specific layouts to groups.
- [ ] 404 Page: Custom 404 page following the new aesthetic.
- [ ] UI primitives updated: Button, Input, Card adjusted to the new palette.

## Data Requirements
- None (Static configuration and structural changes).

## Component Breakdown
- `src/app/layout.tsx`: Root layout (fonts, metadata, Toaster).
- `src/app/(marketing)/layout.tsx`: Marketing layout (NavBar, Footer).
- `src/app/(app)/layout.tsx`: App shell (Sidebar, Header, Auth Guard).
- `src/app/globals.css`: v3 aesthetic variables.
- `src/lib/fonts.ts`: Updated Google font configurations.

## Responsive Behavior
- Standard breakpoints (375px / 768px / 1200px).
- Sidebar behavior (collapsible/bottom tabs) defined in App Shell sprint (Sprint 4).

## States
- N/A for foundation.
