# SPEC — Sprint 2: Landing Page (v3 Refresh)

## Goal
Refresh the landing page to match the v3 Firecrawl Light-Mode aesthetic, ensuring consistency with the authenticated app.

## Acceptance Criteria
- [ ] Hero Section:
    - Headline: "Land interviews with *personalized* outreach" (orange italic accent).
    - Subtitle: "A technical outreach engine that finds the right people and drafts emails worth reading."
    - Visual: High-density search bar with "EXEC_PIPELINE" button.
- [ ] Section Indicators:
    - All major sections use `[ 01 / 05 ] · SECTION_NAME` pattern.
- [ ] Badges:
    - Use `// 🎯 Outreach Engine \\` style badges.
- [ ] Demo Card:
    - Update to v3 colors and fonts.
    - Focus on pipeline transparency.
- [ ] Features Grid:
    - 3-column grid with v3 cards.
    - Icons: Identification, Analysis, Calibration.
- [ ] Code Preview (Optional):
    - Dark mode code block for API/Payload transparency.
- [ ] CTA Section:
    - Large, clean CTA with "Start for Free" primary button.

## Component Breakdown
- `components/marketing/Hero.tsx` (Update)
- `components/marketing/DemoCard.tsx` (Update)
- `components/marketing/FeaturesGrid.tsx` (Update)
- `components/marketing/SectionIndicator.tsx` (New)
- `components/marketing/Badge.tsx` (New)
- `components/marketing/PricingSection.tsx` (Update)
- `components/marketing/CTASection.tsx` (Update)
