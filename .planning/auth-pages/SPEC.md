# SPEC — Sprint 3: Auth Pages

## Goal
Implement dedicated Login and Signup pages using Supabase Auth (Google OAuth + Magic Link) with the v3 Firecrawl aesthetic.

## Page Routes
- `/login`: Dedicated login page.
- `/signup`: Dedicated signup page.
- `/auth/callback`: Existing OAuth callback handler (re-organized into `(auth)` group).

## Acceptance Criteria
- [ ] UI: Centered card layout on `#FAFAF8` background.
- [ ] Card: White bg, border, rounded-xl, `max-width: 420px`.
- [ ] Branding: Korvo wordmark at top (DM Sans bold).
- [ ] Forms: 
    - Email input with validation.
    - "Continue with email →" primary button.
    - "Continue with Google" outline button with icon.
- [ ] Logic:
    - Google OAuth via `signInWithOAuth`.
    - Magic Link via `signInWithOtp`.
    - Handle existing user vs new user redirection.
- [ ] States:
    - Magic link sent state (card content swaps to "Check your email").
    - Error banners for auth failures.
    - Loading states for buttons.
- [ ] Toggle: Link to switch between Login and Signup.

## Data Requirements
- Supabase Auth Browser Client.

## Component Breakdown
- `app/(auth)/login/page.tsx`: Login page.
- `app/(auth)/signup/page.tsx`: Signup page.
- `components/auth/AuthCard.tsx`: Centered card wrapper.
- `components/auth/AuthForm.tsx`: Shared form component for email/OAuth.
- `components/auth/MagicLinkSent.tsx`: Success state view.

## Responsive Behavior
- Responsive padding and card width adjustment for mobile (375px).
- Center alignment maintained.
