# DECISIONS — Sprint 1: Foundation & Route Structure

## Design Decisions
- **Route Groups**: We use `(marketing)`, `(auth)`, and `(app)` to logically separate layouts. This allows different navigation components (NavBar vs. Sidebar) without cluttering `src/app/layout.tsx`.
- **Light Mode Only**: Following the spec, no dark mode toggle. Page backgrounds are warm off-white (`#FAFAF8`).
- **Font Stack**: 
  - `Source Serif 4` for headlines.
  - `DM Sans` for body (DM Sans is highly readable and clean).
  - `JetBrains Mono` for code/metadata.
- **Custom CSS vs Tailwind**: Tailwind is used for most styles, but v3 specific color variables are defined in `globals.css` for centralized control.

## Technical Decisions
- **Move Existing Pages**: `app/page.tsx` moves to `app/(marketing)/page.tsx`. `app/auth/` moves to `app/(auth)/`. `app/settings/` and `app/dashboard/` move to `app/(app)/`.
- **Root Layout Role**: `app/layout.tsx` will only include `next/font/google` variables and the `Toaster`. It will not contain shared navigation to avoid duplication.
- **Tailwind v4**: The project is using `@tailwindcss/postcss` v4. Custom colors will be defined via the `@theme inline` pattern in `globals.css`.
