# SPEC — Sprint 7: Settings

## Goal
Enhance the settings page with advanced account management, API key storage for Pro users, and default search parameters.

## Acceptance Criteria
- [ ] Account Section:
    - Display name editable input.
    - Email (read-only).
    - Avatar preview.
- [ ] Plan Section:
    - Usage progress bar ("3 / 5 searches").
    - "Upgrade to Pro" or "Manage Subscription" (Stripe).
- [ ] API Keys Section (Pro Tier):
    - Apollo API Key (password-masked, reveal toggle).
    - Hunter API Key (password-masked, reveal toggle).
    - "Save Keys" button with encryption disclaimer.
    - Locked state for Free users.
- [ ] Defaults Section:
    - Default Target Role (e.g. "Junior SWE").
    - Default Location (e.g. "Sydney").
    - "Save Defaults" button.

## Data Requirements
- `GET /api/user/profile`
- `PATCH /api/user/profile` (update defaults/name)
- `POST /api/user/api-keys` (save encrypted keys)

## Component Breakdown
- `components/app/UsageBar.tsx`: Progress indicator.
- `components/app/ApiKeyInput.tsx`: Masked input with toggle.
- `components/app/SettingsForm.tsx`: Sectioned forms.
