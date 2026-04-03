# SPEC — Sprint 5: Search + Results

## Goal
Implement the core search experience: initiating a pipeline, tracking progress in real-time, and reviewing/editing generated contacts and email drafts.

## Routes
- `app/(app)/search/page.tsx`: Main search input page.
- `app/(app)/search/[id]/page.tsx`: Search results view with contact cards and drafts.

## Acceptance Criteria
- [ ] Search Form:
    - Company name and Target role inputs.
    - "Run Pipeline →" primary button.
    - Credits indicator ("Using 1 of 5...").
- [ ] Loading State:
    - Pipeline tracker with 4 steps (contacts, emails, hooks, drafts).
    - Real-time status updates (poll `/api/pipeline/status/[jobId]`).
- [ ] Results Page:
    - Breadcrumbs and page header (Company · Role).
    - Metadata row (contacts found, location, time).
    - 3 Contact Cards stacked vertically.
- [ ] Contact Card:
    - Name, Title, Company.
    - Email with ConfidenceBadge (green/amber/red).
    - Recessed Hook section with icon and source link.
    - Actions: "View Email Draft →", "Copy Email", "⋯" menu.
- [ ] Email Draft (Inline or Slide-over):
    - Editable Subject and Body.
    - "Copy to Clipboard", "Open in Gmail", "Regenerate" actions.
    - Feedback on copy.

## Data Requirements
- `POST /api/pipeline/start`
- `GET /api/pipeline/status/[id]`
- `GET /api/pipeline/results/[id]`
- `PATCH /api/drafts/[id]` (Update draft)
- `POST /api/drafts/[id]/regenerate`

## Component Breakdown
- `components/app/SearchForm.tsx`: Input form.
- `components/app/PipelineTracker.tsx`: Stepper progress.
- `components/app/ContactCard.tsx`: Result card.
- `components/app/EmailDraft.tsx`: Editable draft.
- `components/app/ConfidenceBadge.tsx`: Color-coded dot + label.
