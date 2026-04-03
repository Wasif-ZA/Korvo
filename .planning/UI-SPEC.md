# UI Specification: Korvo

## Pages

### Landing Page (`/`)

- Hero: "Find the right people. Send the right email. Land the interview."
- Search bar (company name + target role + location)
- How it works: 3-step visual (Search > Review > Send)
- Pricing section (Free vs Pro)
- Mobile responsive

### Search Results (`/search`)

- 3 contact cards rendered from Claude results
- Each card shows: name, title, email (with confidence badge), personalization hook
- "Generate Email" button on each card
- Loading skeleton during search (10-15 seconds)

### Email Draft (modal or inline expand)

- Editable subject line + body
- Copy button with animation feedback
- Gmail mailto link
- Regenerate button
- "Mark as Sent" action

### Dashboard (`/dashboard`)

- Pipeline columns: Identified > Contacted > Responded > Chatted > Applied > Interviewing
- Drag or click to move contacts between stages
- Expand contact to see email draft, add notes
- Search history sidebar

### Settings (`/settings`)

- Account info
- Plan management (Stripe Customer Portal link)
- Apollo API key input (Pro tier)
- Target role + location defaults

---

## Key Components

| Component | Purpose |
| --- | --- |
| SearchBar | Company input, role dropdown, location, search button with loading |
| ContactCard | Name, title, email + confidence badge, hook, generate email button |
| EmailDraft | Editable subject + body, copy, mailto, regenerate |
| PipelineBoard | Kanban-style columns for contact status tracking |
| AuthButton | Google OAuth sign in/out |
| PricingCard | Free vs Pro comparison |
| ConfidenceBadge | Green/yellow/red indicator for email reliability |

---

## Design System

- Dark theme (matches technical audience expectation)
- TailwindCSS utility classes only (no component library for MVP)
- Accent color: TBD based on Korvo branding
- Typography: system fonts for MVP, custom font in V2
- Responsive: mobile-first, tested on iPhone SE through desktop

---

## User Flow

```
Land on homepage
    |
    v
Enter company + role (free, no signup)
    |
    v
See 3 contact cards (10-15s loading)
    |
    v
Click "Generate Email" on a card
    |
    v
Review and edit email draft
    |
    v
Copy to clipboard / Open in Gmail
    |
    v
Prompt: "Sign up to save your pipeline" (Google OAuth)
    |
    v
Dashboard with all contacts tracked
```
