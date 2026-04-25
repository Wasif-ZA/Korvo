# Korvo Production Setup Guide

Complete setup for deploying Korvo to production on Vercel + Railway.

## Prerequisites

- Node.js 20.9+
- npm or yarn
- GitHub account (for Vercel auth)
- Supabase account (free tier works)
- Stripe account
- Google Cloud project (for Gmail API)
- Railway account (for Redis + workers)

## 1. Supabase Setup

1. Create a free Supabase project at supabase.com
2. Get connection strings:
   - Go to Settings → Database
   - Copy `Connection pooler` (port 6543) → `DATABASE_URL`
   - Copy `Direct connection` (port 5432) → `DIRECT_URL`
3. Enable Auth:
   - Go to Authentication → Providers
   - Enable Email/Password (for testing)
4. Get API keys:
   - Settings → API
   - Copy `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Stripe Setup

1. Create a Stripe account at stripe.com
2. Get API keys:
   - Dashboard → API Keys
   - Copy Secret key → `STRIPE_SECRET_KEY`
   - Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Create products:
   - Dashboard → Products
   - Create "Korvo Pro" (monthly)
   - Copy price IDs → `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`
4. Set webhook:
   - Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe`
   - Select events: `customer.subscription.*`, `charge.*`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## 3. Gmail OAuth Setup

1. Create Google Cloud project at console.cloud.google.com
2. Enable Gmail API:
   - APIs & Services → Enable APIs
   - Search "Gmail API", enable it
3. Create OAuth 2.0 credentials:
   - Credentials → Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URI: `https://your-domain.com/api/gmail/callback`
   - Download JSON
4. Get credentials:
   - Copy `client_id` → `GOOGLE_CLIENT_ID`
   - Copy `client_secret` → `GOOGLE_CLIENT_SECRET`
5. Generate encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   → `GMAIL_TOKEN_ENCRYPTION_KEY`

## 4. Redis Setup (Railway)

1. Create Railway account at railway.app
2. Create new project:
   - Add service → Redis
   - Copy connection string → `REDIS_URL`
3. Set environment variables:
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` from connection string
   - `REDIS_FAMILY=6` (for IPv6 private networking)

## 5. Vercel Deployment

1. Push code to GitHub
2. Create Vercel project:
   - vercel.com/new → Import Git repo
   - Project name: korvo
3. Add environment variables:
   - Copy all from `.env.example` with real values
4. Deploy:
   - Vercel auto-deploys on push to main
   - Seed database: `npm run db:push` in Vercel CLI

## 6. Worker Deployment (Railway)

1. Create new Railway service in same project:
   - Add service → GitHub repo (same korvo repo)
   - Set start command: `npm run start:worker`
2. Add environment variables from Vercel
3. Deploy

## 7. Domain & DNS

1. Buy domain (any registrar)
2. Point to Vercel:
   - Add domain in Vercel → Settings → Domains
   - Follow Vercel's DNS instructions
3. Update environment:
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
   - Update Stripe webhook URL
   - Update Gmail OAuth redirect URI

## 8. Database Migrations

Run first migration:

```bash
npm run db:push
```

This creates all tables, RLS policies, and triggers.

## 9. Cron Jobs (Optional, Phase 2)

For warm-up ramp and analytics:

- Settings → Cron Jobs
- Add job: `/api/cron/warm-up-ramp` (hourly)

## 10. Analytics & Monitoring

1. PostHog:
   - Create account at posthog.com
   - Copy API key → `NEXT_PUBLIC_POSTHOG_KEY`

2. Sentry:
   - Create account at sentry.io
   - Copy DSN → `SENTRY_DSN`

## Troubleshooting

**Database connection fails**: Ensure connection strings include `pgbouncer=true` for pooler.

**Gmail API 403**: Check that you've set up OAuth consent screen (Credentials → OAuth consent screen).

**Stripe webhook not firing**: Verify endpoint URL is exactly `https://your-domain.com/api/stripe` and signing secret matches.

**BullMQ jobs failing**: Check Redis connection and verify REDIS_FAMILY=6 for Railway.

---

**Next steps**: See README.md for feature overview and architecture details.
