# SPEC — Sprint 6: Dashboard

## Goal
Implement the outreach management dashboard featuring a Kanban board to track contact progress, key metrics, and search history.

## Page Route
- `app/(app)/dashboard/page.tsx`: Main dashboard view.

## Acceptance Criteria
- [ ] Stats Row:
    - 4 cards: Total Contacts, Emails Sent, Replies Received, Reply Rate.
    - Status indicators (green/amber/red) for Reply Rate.
- [ ] Pipeline Board (Kanban):
    - 6 columns: Identified, Contacted, Responded, Chatted, Applied, Interviewing.
    - Column headers with count badges.
    - Draggable cards (or simple move action).
- [ ] Pipeline Card:
    - Small card with Name, Company, Confidence dot, and "Time ago".
    - Click to open detailed slide-over (contact info, notes, draft).
- [ ] Search History:
    - Recent searches list ("Company · Role · Date").
    - Click to revisit results.
- [ ] Empty State:
    - High-quality placeholder for new users.
    - "New Search →" CTA.

## Data Requirements
- `GET /api/contacts`: List all user's contacts.
- `PATCH /api/contacts/[id]`: Update status (move columns).
- `GET /api/dashboard/stats`: Summary metrics.

## Component Breakdown
- `components/app/StatCard.tsx`: Metric display.
- `components/app/PipelineBoard.tsx`: Main Kanban container.
- `components/app/PipelineColumn.tsx`: Single column.
- `components/app/PipelineCard.tsx`: Draggable card.
- `components/app/EmptyState.tsx`: Onboarding view.
