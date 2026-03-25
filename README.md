# Emergenza Sicilia

Real-time emergency information portal for Sicily — tracking earthquakes, storms, fires, volcanic eruptions, and civil protection alerts from official sources (INGV, Protezione Civile, ANAS).

## Features

- Real-time event feed from INGV, Protezione Civile, and ANAS ingestion pipelines
- Interactive Leaflet map of active events in Sicily
- Push notifications (Web Push / VAPID) scoped by province and category
- Citizen reports with rate limiting and moderation queue
- Editorial section with WordPress.com sync and premium paywall
- Admin dashboard for event management, reports triage, and alert rules
- Full Italian/English i18n via next-intl
- SEO: sitemap.xml, robots.txt, locale-aware metadata

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/emergenza-sicilia.git
cd emergenza-sicilia

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Set up the database
npx prisma generate
npx prisma db push

# 5. Seed development data
npx prisma db seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000/it](http://localhost:3000/it) in your browser.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Add all environment variables from `.env.example` in the Vercel dashboard.
4. Vercel will run `npx prisma generate && next build` automatically (configured in `vercel.json`).

> The region is set to `cdg1` (Paris) to minimise latency from Italy.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public URL of the deployment |
| `ADMIN_EMAIL` | Admin account email (used by seed) |
| `ADMIN_PASSWORD` | Admin account password (used by seed) |
| `INGEST_SECRET` | Bearer token for `/api/ingest/*` endpoints (GitHub Actions) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push |
| `VAPID_CONTACT` | Contact email for Web Push (`mailto:...`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for citizen-report media uploads |
| `WORDPRESS_SITE_URL` | WordPress.com REST API base URL for editorial sync |
| `NEXT_PUBLIC_BASE_URL` | Public base URL used for SEO (sitemap, hreflang) |

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Architecture Overview

```
app/
  [locale]/          # IT/EN locale segment (next-intl)
    layout.tsx       # TopBar + Footer + NextIntlClientProvider
    page.tsx         # Home page (event feed + editorial highlights)
    mappa/           # Interactive Leaflet map
    eventi/[id]/     # Event detail page
    editoriale/      # Editorial listing + [slug] detail
    segnalazioni/    # Citizen report form
    allerte/         # Push notification subscription
    premium/         # Premium subscription page
  admin/             # Protected admin dashboard
  api/
    admin/           # Admin CRUD endpoints
    ingest/          # Ingestion endpoints (INGV, PC, ANAS, WP)
    events/          # Public events API
    reports/         # Citizen reports API
    push/            # Web Push subscription API
  sitemap.ts         # Dynamic sitemap
  robots.ts          # robots.txt

lib/
  auth.ts            # NextAuth v5 + Prisma adapter
  ingestion/         # INGV, Protezione Civile, ANAS, WordPress parsers
  push.ts            # Web Push helpers
  rate-limit.ts      # IP-based rate limiting
  prisma.ts          # PrismaClient singleton

messages/
  it.json            # Italian translations
  en.json            # English translations

prisma/
  schema.prisma      # Data model (Event, Report, AlertRule, EditorialPost, …)
  seed.ts            # Development seed data
```

Data ingestion is triggered by GitHub Actions cron jobs calling the `/api/ingest/*` endpoints with the `INGEST_SECRET` bearer token — no Vercel cron required (free tier friendly).
