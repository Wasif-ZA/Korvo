# Korvo - Product Specification

## Vision

Korvo helps job-hunting students and recent grads send cold networking emails that actually get replies. Users enter a company name and target role, and Korvo finds 3 contacts, guesses their emails, researches personalization hooks, and drafts cold networking emails using a validated template.

## Target User

Final-year CS/SWE students and recent graduates job hunting in Sydney tech.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, TypeScript |
| Database | Supabase (PostgreSQL + RLS + Prisma) |
| AI | Claude API - Haiku for contact finding/email drafting, Sonnet for coffee chat prep |
| Queue | BullMQ + Redis on Railway |
| Payments | Stripe (Free / Pro $29 / Teams $79) |
| Hosting | Vercel |
| Email Service | Resend |
| Auth | Supabase Auth with Google OAuth |

## Data Access Layers

Four-layer data access model:

1. **OAuth Connections** - Direct user-authorized integrations
2. **Enrichment APIs** - Apollo (contact discovery), Hunter (email verification)
3. **Structured Public Data** - Company websites, LinkedIn public profiles
4. **Managed Extraction** - Firecrawl for structured web scraping

## Email Generation Module

### Validated Template

This is the ONLY email pattern that got replies out of 46 real cold emails sent. The winning email (Nate @ Antares) got a reply in 2 hours and led to a coffee chat + CTO interview.

```
Hi [First Name],

I'm a [year] [degree] student at [university] and just applied for the [specific role] at [company].

I've been building [one project], [one-line description with tech stack]. [One sentence connecting your experience to why this company specifically].

[Specific question or ask - keep to one line]. Would you be open to a quick chat?

Cheers,
[Name]
```

### Generation Rules

- Max 5 sentences total
- Must name the specific role in sentence 1
- Must include exactly ONE project/experience hook in sentence 2
- Must have a company-specific reason in sentence 3 (not generic flattery)
- Ask must be a simple "quick chat" - never "would love to discuss my experience"
- Sign off: "Cheers, [Name]" - never "Best regards" or "Sincerely"
- Never attach resume on first contact
- Never include email signature with LinkedIn/phone
- Tone: casual but respectful, not formal

### Anti-Patterns (Do NOT Generate)

- "Dear [Name], I hope you're doing well. I am reaching out because I am very interested in..." (too formal, template-sounding)
- Listing multiple projects or credentials
- 3+ paragraphs
- "Best regards, [Full Name]"
- Sending nearly identical copy to multiple people at the same company on the same day
- Including job reference numbers in the subject line
- Generic asks like "I'd love the opportunity to discuss how my experience aligns"

### Follow-Up Email Rules

- Wait 5-7 days before first follow-up
- Max 2 follow-ups total per contact
- Even shorter than the initial email (2-3 sentences)
- Reference something new (not just "bumping my email")
- If 2 follow-ups get no reply, mark contact as cold and move on
