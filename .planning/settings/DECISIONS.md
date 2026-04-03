# DECISIONS — Sprint 7: Settings

## UI/UX Decisions
- **API Key Masking**: API keys are masked by default. Clicking a "reveal" eye icon shows the value.
- **Section Dividers**: Use the v3 section indicator pattern (`// Section \\`) to maintain technical aesthetic.
- **Save Feedback**: Each section has its own "Save" button to provide granular control and clear feedback.

## Technical Decisions
- **Encryption Disclaimer**: Display a clear notice that API keys are encrypted at rest to build user trust.
- **Server vs Client**: Keep the main page as a server component for initial profile fetch, use client components for interactive forms.
