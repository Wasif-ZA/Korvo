# DECISIONS — Sprint 6: Dashboard

## UI/UX Decisions
- **Kanban Scroll**: The board will be horizontally scrollable on mobile and fixed-width columns on desktop to maintain information density.
- **Drag-and-Drop**: For MVP, we will prioritize a simple "Move" action via a dropdown/click rather than full drag-and-drop to ensure stability and cross-platform ease of use.
- **Metric Coloring**: Reply rate is color-coded based on industry benchmarks (>20% green, 10-20% amber, <10% red).
- **Slide-over Panel**: Detailed contact info will open in a right-side slide-over to keep the dashboard context visible.

## Technical Decisions
- **Local State for Movement**: Move cards in local state immediately upon action for "optimistic UI" feel, then sync with backend.
- **Mock Data**: Like the search page, I'll use comprehensive mock data to allow the UI to be fully functional before all API endpoints are finished.
- **Re-use Components**: Reuse `ConfidenceBadge` and `EmailDraft` (read-only mode) inside the slide-over.
