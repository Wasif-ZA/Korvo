# DECISIONS — Sprint 4: App Shell

## UI/UX Decisions
- **Sidebar Persistence**: The sidebar remains on the left for desktop to maximize content width for the Dashboard board and Search results.
- **Header Dynamics**: Page title is derived from the current pathname or a provided prop if nested.
- **Credits Badge Visibility**: Placing credits in the top header keeps usage awareness high without cluttering the content.
- **Sidebar Collapse**: Desktop sidebar is fixed width (240px) to prevent layout shifts.

## Technical Decisions
- **Data Fetching**: The `AppShell` layout will be a server component to fetch initial profile/usage data from Prisma where possible, but individual badges may use SWR/React Query for real-time updates.
- **Lucide Icons**: Use standard Lucide icons for nav items (LayoutDashboard, Search, FileText, Settings).
