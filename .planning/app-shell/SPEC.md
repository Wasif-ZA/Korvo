# SPEC — Sprint 4: App Shell

## Goal
Implement the core application shell including a persistent Sidebar, a context-aware Header, and a robust layout for authenticated pages.

## Components
- `components/app/Sidebar.tsx`: Desktop sidebar (240px), mobile bottom tabs/collapsible.
- `components/app/Header.tsx`: Page title, credits badge, user menu.
- `components/app/AppShell.tsx`: Wrapper for sidebar + header + content area.

## Acceptance Criteria
- [ ] Sidebar:
    - Korvo wordmark at top.
    - Nav links: Dashboard, New Search, Drafts, Settings.
    - Plan badge (Free / Pro / Teams) at bottom.
    - Active link styling (orange accent).
- [ ] Header:
    - Dynamic page title based on route.
    - Credits badge: "X / Y searches this month".
    - User avatar dropdown (Profile, Settings, Sign out).
- [ ] Responsive:
    - Sidebar collapses on tablet.
    - Mobile: Bottom navigation tabs or drawer.
- [ ] Content Area:
    - Max-width 1000px, centered.
    - Generous padding (32px+).

## Data Requirements
- Profile data (name, avatar, plan) from `/api/me`.
- Usage data (searches used) from `/api/user/usage`.

## Component Breakdown
- `app/(app)/layout.tsx`: Root of the app shell.
- `components/app/Sidebar.tsx`: Navigation.
- `components/app/Header.tsx`: Global actions and status.
- `components/app/UserMenu.tsx`: Avatar dropdown.
- `components/app/CreditsBadge.tsx`: Usage indicator.
