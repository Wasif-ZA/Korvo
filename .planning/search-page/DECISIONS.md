# DECISIONS — Sprint 5: Search + Results

## UI/UX Decisions
- **Polling Strategy**: Use a simple `useEffect` with `setInterval` (or SWR) to poll for pipeline status every 2 seconds while the job is in "running" status.
- **Results Layout**: Vertical stack of contact cards is chosen over a grid to allow for more detailed research content (hooks) and inline draft expansion.
- **Confidence Badges**: Use green dot for >80% confidence, amber for 50-80%, red for <50%.
- **Draft Interaction**: Expanding the email draft inline below the card to maintain context.

## Technical Decisions
- **Form Handling**: Use standard React state for search form to avoid unnecessary library weight.
- **Mocking**: Since the backend (Phase 3) might not be fully wired yet, I'll use realistic mock data in the components to allow independent development of the UI.
- **Real-time Updates**: The `PipelineTracker` will handle its own polling to keep `search/page.tsx` clean.
