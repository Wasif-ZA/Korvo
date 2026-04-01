# Feature Landscape

**Domain:** Job outreach SaaS for job seekers (not sales teams)
**Project:** Korvo
**Researched:** 2026-04-01
**Confidence:** MEDIUM-HIGH

---

## Research Framing

This analysis maps the feature landscape for job outreach tooling *from the job seeker's perspective*, not the sales team's. Tools surveyed: Apollo.io, Hunter.io, Snov.io, Teal HQ, NetworkAI (Wonsulting), Lemlist, Instantly, Woodpecker, Huntr. Key distinction: job seekers send low volume, highly personalized emails to specific humans at target companies — not bulk prospecting campaigns to lists of 1,000+.

---

## Table Stakes

Features users expect from a job outreach tool. Missing any of these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Contact finding by company + role** | Core job — every competitor offers this. Users will immediately ask "who should I email at Atlassian for an engineering role?" | Medium | Teal, NetworkAI, Apollo all do this; without it the product has no entry point |
| **Email address guessing/finding** | Finding a name is worthless without a way to reach them. Users expect the tool to output a usable email, not just a LinkedIn URL | Medium | Hunter.io's entire value prop. Pattern detection (first.last@company.com) is the floor; verification is the ceiling |
| **Email confidence indicator** | Users sending guessed addresses need to know risk of bounce. Green/yellow/red or High/Medium/Low is now standard in Hunter, Apollo, and Snov | Low | Absence of this looks amateurish; users will assume bounced emails are the tool's fault |
| **Draft cold email per contact** | NetworkAI, Lemlist, and all AI outreach tools generate drafts. Users expect to get a ready-to-edit email, not just contact info | High | Personalization quality is the differentiator — generic drafts are table stakes, good ones are differentiating |
| **Copy-to-clipboard send** | Free tier users must be able to do something with the draft. Copy + paste into Gmail is the floor | Low | Without this the free tier has zero conversion moment |
| **Application/outreach pipeline tracker** | Huntr has 4.9 stars on 1,100+ Chrome reviews almost entirely for Kanban pipeline. Teal's tracker is its most-loved feature. Users expect a place to track who they contacted | Medium | Stages: Identified → Contacted → Responded → Chatted → Applied → Interviewing is the job-seeker-specific flow |
| **Search history / re-access past results** | Users will run a search, close the tab, and come back. Losing results = immediate churn | Low | Just a sidebar list with timestamps and company names |
| **Free tier with real value** | Apollo free = 5 credits. Hunter free = 25 searches/month. Teal free = 1 resume. Users evaluate via free tier before paying. Paywall before any value = no conversion | Low | First search free without signup is the gold standard for acquisition |
| **Mobile-responsive UI** | Job seekers check their pipeline on phones. Not a native app — just a responsive web UI | Low | Breaks trust if unusable on mobile |
| **Basic follow-up reminder** | Users forget to follow up. Every outreach tool from Huntr to Woodpecker includes at least a manual reminder/note field | Low | Even a simple "remind me in 7 days" is expected |

---

## Differentiators

Features that set a product apart from the commodity field. Not universally expected, but meaningfully valued by the target audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Response probability scoring (0-100)** | No job-seeker tool surfaces this. Sales tools like Apollo score leads but not for job seekers. Showing "this contact has a 78% response probability" changes how users prioritize their 5 free searches/month | High | Requires weighted signal engine (title, seniority, recency, public activity). Validated by research: personalized campaigns see 2-3x higher reply rates — scoring operationalizes that insight |
| **Tone mapping from score** | Direct / Curious / Value-driven tone selection based on score is not found in any competitor. Lemlist offers tone options but manual. Score-driven tone is novel | Medium | Needs scoring engine first. High dependency |
| **Per-contact research cards (Background / Ask This / Mention This)** | NetworkAI generates generic messages. No tool produces structured research cards tied to each contact. This is the "coffee chat prep" experience built into the contact record | High | Requires Research Agent with web search access. Most value for the target user (students prepping for coffee chats) |
| **4-layer data waterfall with circuit breakers** | Every competitor uses a single data source. Waterfall (L1 web → L2 patterns → L3 ATS APIs → L4 enrichment) with fallback and breakers means Korvo returns results when Apollo-only tools fail | High | Operational resilience as a feature. Users see this as "it always finds someone" vs competitors that return nothing |
| **Gmail API send with auto-tracking** | Apollo Pro, Lemlist, and Instantly all support direct email send. No job-seeker-specific tool does this. Teal and NetworkAI are clipboard-only. Gmail send auto-moves contacts to "Contacted" stage — closes the loop | High | Requires OAuth scopes, Stripe gate, deliverability engine. Key V1 differentiator for Pro tier |
| **Deliverability engine (warm-up ramp, jitter, rotation)** | Woodpecker and Instantly offer warmup — but only for business email infrastructure. Individual job seekers using their personal Gmail don't know about sender reputation. Building this protection in for a student's gmail.com address is novel | High | 0.1% spam complaint rate damages sender rep permanently. Students sending 20 emails/day from one account without warmup will get throttled |
| **Pre-chat / coffee chat prep brief** | No tool builds a structured prep brief (career path, recent activity, 3 questions, 200-word max) for an informational interview. Leland and career coaches charge $100/hr for this. Delivering it automatically per contact is a strong differentiator for the student segment | Medium | Sonnet-powered, gated to Pro. Direct competitive gap identified — no competitor offers this |
| **BYO API key for enrichment (Apollo key passthrough)** | Power users who already have Apollo accounts can bring their own key to unlock verified emails. Hunter.io and Apollo don't cooperate — Korvo lets users combine both. Unusual trust-building move | Medium | Removes data quality ceiling for Pro users. V2 feature |
| **Score-based explainability panel** | Showing WHY a contact scored 68 (title match: +20, seniority: +15, recent LinkedIn post: +10, unverified email: -15) is educationally valuable and builds trust. No competitor surfaces signal breakdowns | Medium | Requires scoring engine. Transparency as a differentiator |
| **Chrome extension (visit career page → see contacts + drafts)** | Teal's Chrome extension is its #1 growth driver (4.9 stars). Applying this to outreach — visit a company careers page, immediately see Korvo contacts — is a natural extension of the core workflow | High | V3 feature. Very high distribution potential. Requires public extension review process |
| **AI response detection (positive reply → auto-move pipeline stage)** | Gmail read-only OAuth to detect positive replies and automatically advance pipeline stage. No job-seeker tool does this. Sales tools like Instantly do reply detection but not for individual job seekers | High | V3. Privacy-sensitive — requires careful consent UI. High delight when it works |

---

## Anti-Features

Things to deliberately NOT build. These consume engineering time, bloat UX, and often create more problems than they solve for this specific audience.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-sending emails without user action** | CAN-SPAM violations, Australian Spam Act, Gmail deliverability penalties, and irreversible sender reputation damage. Users who lose trust in Gmail deliverability blame the tool, not themselves. Apollo and Lemlist offer auto-send but for businesses with dedicated sending domains — job seekers use personal Gmail accounts where one spam flag can lock them out | Human-in-the-loop always: draft → user reviews → user sends. Auto-send is a V-never feature for this segment |
| **Bulk campaign sequences (1,000+ contact lists)** | Entirely wrong use case. Students sending to hiring managers at 5 companies need depth, not breadth. High-volume sequences increase spam risk, require dedicated domains, and are the sales-tool UX that alienates the target audience | Cap searches to 3 contacts per company, 50 outreaches per month on Pro. This is a constraint, not a bug |
| **LinkedIn direct messaging / LinkedIn API** | LinkedIn actively litigates scraping (hiQ Labs, Proxycurl shut down). LinkedIn API requires partner approval not available to independent SaaS. Even Chrome extension automation risks account bans for users | Use Google-indexed public profile data only. Never automate LinkedIn actions. Email is the channel |
| **CRM integration (Salesforce, HubSpot, Pipedrive)** | The target user (broke uni grad) has never heard of Salesforce. CRM integrations create support burden, documentation overhead, and false positioning as a sales tool. Existing users actively dislike Apollo's CRM complexity | Build a purpose-built pipeline board inside the product. No external CRM integrations until B2B V4 |
| **Team / multi-seat features** | Teams, shared workspaces, admin seats, permissions — all V4 territory. Building this before the single-user product is validated wastes 60% of scope for 0% of initial users | Defer to V4. Single-user product ships faster and validates core loop |
| **Mobile native app (iOS/Android)** | Building and maintaining native apps costs 3x the engineering. Job search is not a mobile-native activity — users research and compose on desktop, check status on mobile | Mobile-responsive web. Revisit after $50K MRR |
| **Cover letter generator** | Teal, Resumai, and 20 other tools do cover letters. It's heavily commoditized. Adding it positions Korvo as another resume tool rather than an outreach pipeline tool | Keep focus on outreach pipeline. Outreach → interviews, not application → interviews |
| **Resume tailoring engine (V1-V2)** | Same as cover letters — heavily saturated market. Teal, Jobscan, Rezi all exist. Resume tailoring is a table stakes feature in a crowded category Korvo doesn't need to compete in | Defer to V2+ as an optional add-on, not a core feature. Core value is outreach, not applications |
| **Open rate tracking via pixel** | Tracking pixels are actively blocked by Apple Mail (MPP), Gmail tabs, and corporate firewalls. Worse: adding tracking pixels to individual outreach emails increases spam filter scores. Cold email deliverability research consistently shows pixel tracking hurts deliverability in 2025 | Track at the pipeline stage level (Contacted → Responded), not at the email event level. Use reply detection not open tracking |
| **Multi-channel outreach (LinkedIn + WhatsApp + calls)** | Lemlist's multi-channel is built for sales teams with SDR budgets. Job seekers don't run LinkedIn + WhatsApp + phone call sequences. Adding channels fragments the UX for no user value | Email is the channel for cold job outreach. LinkedIn messaging is manual. No orchestration needed |
| **White-label / agency features** | Agency features (client portals, multi-account management) are pure V4 B2B territory | Hard out-of-scope. Builds wrong mental model in codebase |

---

## Feature Dependencies

```
Contact Finder
  └── Email Guesser (needs contact identity first)
  └── Research Agent (needs contact identity first)
        └── Email Drafter (needs research card + email address + tone)
              └── Response Scoring (needs contact data + research signals)
                    └── Tone Mapping (needs score)
                          └── Gmail API Send (needs final draft + user Gmail OAuth)
                                └── Auto Pipeline Move (needs Gmail send event)
                                      └── AI Response Detection (needs Gmail read OAuth)

Pipeline Tracker
  └── Search History (sidebar list of past searches)
  └── Contact Cards (depends on Contact Finder)
  └── Manual Stage Movement (independent)
  └── Auto Stage Movement (depends on Gmail Send)

Deliverability Engine
  └── Gmail API Send (deliverability engine wraps the send action)
  └── Warm-up ramp (independent background service, Pro only)

Stripe Paywall
  └── Gmail API Send (Pro gate)
  └── Pre-chat brief generator (Pro gate)
  └── Warm-up ramp (Pro gate)
  └── BYO Apollo key (Pro gate)

Pre-chat Brief
  └── Research Agent (needs research card data as input)
  └── Google Calendar (V2 — book chat from brief)

Chrome Extension (V3)
  └── Core search pipeline must be stable
  └── Contact data must be accessible via API

AI Response Detection (V3)
  └── Gmail send must be shipping (Pro)
  └── Reply-to threading identification (email matching)
```

---

## Complexity Estimates

| Feature | Effort | Phase | Rationale |
|---------|--------|-------|-----------|
| Contact Finder agent | High | V1 | Multi-source web search, structured output, 4-layer waterfall |
| Email Guesser agent | Medium | V1 | Pattern detection + confidence scoring; Hunter patterns well-documented |
| Research Agent | High | V1 | Web research with personalization hook extraction; quality highly variable |
| Email Drafter agent | Medium | V1 | Template + tone mapping; well-trodden AI use case |
| Response scoring engine | High | V1 | Custom signal weighting; no off-the-shelf solution exists for job seeker signals |
| Tone mapping | Low | V1 | Simple conditional on score ranges; no ML needed |
| Email confidence badge | Low | V1 | UI component on top of confidence score from Email Guesser |
| Pipeline Kanban board | Medium | V1 | Well-understood UI pattern; Supabase RLS makes backend easy |
| Search history sidebar | Low | V1 | Simple DB query; UI straightforward |
| Google OAuth + Supabase auth | Low | V1 | Supabase handles OAuth flow |
| Stripe Checkout + webhooks | Medium | V1 | Stripe is well-documented; webhook handler is the complexity |
| Gmail API send (Pro) | High | V1 | OAuth scopes, token refresh, send with tracking, error handling |
| Deliverability engine (warm-up, jitter) | High | V1 | Per-user rate budgets, background job scheduling via BullMQ |
| First-search-free (no signup) | Low | V1 | Session-scoped guest search; convert after result shown |
| Pre-chat brief generator | Medium | V2 | Sonnet call on research card data; well-scoped |
| Google Calendar integration | Medium | V2 | OAuth calendar scopes; time slot suggestion logic |
| BYO Apollo API key | Medium | V2 | API passthrough with user-supplied key; storage in encrypted column |
| Resume tailoring engine | High | V2 | PDF parsing + AI tailoring + PDF export; complex IO pipeline |
| Follow-up automation (drafts, not auto-send) | Medium | V3 | Scheduled job per contact; templated follow-up drafts at 3/7/14 days |
| Chrome extension | High | V3 | Separate build target, extension review process, CSP restrictions |
| AI response detection | High | V3 | Gmail read OAuth, threading, positive reply classification |

---

## MVP Recommendation

The minimum viable product must prove the core loop: **company name → 3 contacts with emails → personalized draft emails → pipeline to track outreach**.

**Prioritize for V1 launch:**

1. Contact Finder + Email Guesser + Research Agent + Email Drafter (4-agent pipeline, the core differentiator)
2. Email confidence badge (builds trust, low effort)
3. Response scoring + tone mapping (table stakes for "smart" positioning)
4. Pipeline Kanban board (table stakes for retention — users need to come back)
5. Search history sidebar (table stakes for re-access)
6. First-search-free without signup (acquisition mechanic)
7. Google OAuth + Stripe (monetization gate)
8. Gmail API send with deliverability engine (Pro tier differentiator, converts power users)
9. Copy-to-clipboard send (free tier floor)

**Defer from V1:**

- Pre-chat brief: High value but requires validated user base to confirm demand
- Resume tailoring: Saturated market, dilutes positioning
- BYO Apollo key: Power user feature; not needed until core pipeline is proven
- Google Calendar: Depends on coffee chat workflow being a real conversion driver

---

## Sources

- NetworkAI (Wonsulting) product page: https://www.wonsulting.com/networkai
- Hunter.io vs Apollo.io comparison: https://www.uplead.com/hunter-io-vs-apollo-io/
- Lemlist vs Instantly features: https://www.saleshandy.com/blog/lemlist-vs-instantly/
- Teal HQ reviews and features: https://www.usesprout.com/blog/teal-review-pricing-alternatives
- Cold email response rate statistics 2025: https://www.mailforge.ai/blog/average-cold-email-response-rates
- Email deliverability best practices 2025: https://supersend.io/blog/cold-email-deliverability-best-practices-2025
- Cold email personalization impact: https://www.salesforge.ai/blog/ai-cold-email-outreach-personalization
- Huntr job tracker review: https://resumehog.com/blog/posts/huntr-review-2026-is-this-job-tracker-worth-it.html
- Cold outreach benchmarks 2025: https://outreaches.ai/blog/cold-outreach-benchmarks
- CAN-SPAM compliance guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Email confidence scoring overview: https://derrick-app.com/en/confidence-score-data
- Lead scoring for cold email: https://prospeo.io/s/lead-scoring-for-cold-email
- Coffee chat strategy and preparation: https://blog.theinterviewguys.com/the-coffee-chat-strategy/
- State of job search 2025: https://www.jobscan.co/state-of-the-job-search
- Apollo.io alternatives comparison: https://skrapp.io/blog/apollo-io-alternatives/
