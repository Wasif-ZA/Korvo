# DECISIONS — Sprint 3: Auth Pages

## Architecture Decisions
- **Shared Form**: Since Login and Signup share identical fields (Email, Google OAuth), `AuthForm` will be a reusable component parameterized by the "intent" (login vs. signup).
- **Magic Link Priority**: To simplify MVP, we prioritize Magic Link for email-based auth instead of password-based.
- **Google OAuth Redirect**: Redirect to `window.location.origin + '/auth/callback'` to handle session creation.
- **Supabase Integration**: Direct usage of `createSupabaseBrowserClient()` within client components.

## UI Decisions
- **Brand Consistency**: Wordmark "Korvo" in DM Sans bold, no logo icon, following v3 spec.
- **Card Design**: Rounded-xl (12px), white bg, border-card.
- **Aesthetic**: Warm off-white background with subtle dot-matrix behind the card.
