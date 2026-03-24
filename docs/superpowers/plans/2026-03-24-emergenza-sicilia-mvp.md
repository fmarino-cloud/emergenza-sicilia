# Emergenza Sicilia MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready MVP of "Emergenza Sicilia" — a real-time emergency information portal for Sicily — with Next.js 14 App Router, PostgreSQL on Neon, WordPress.com editorial cache, Leaflet map, NextAuth v5 admin auth, PWA push notifications, and real feed integrations (INGV, Protezione Civile, ANAS).

**Architecture:** Monorepo Next.js 14 App Router. Database on Neon (PostgreSQL via Prisma). Editorial content cached from WordPress.com free REST API every 30min via GitHub Actions. Emergency data ingested every 15min from INGV GeoJSON, PC open data, ANAS RSS. Admin panel at `/admin/*` protected by NextAuth v5. i18n via next-intl with `[locale]` segment (IT default, EN). PWA with web-push VAPID notifications.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS 3, shadcn/ui (reskinned brand), Prisma 5, Neon PostgreSQL, NextAuth.js v5, next-intl, Leaflet + react-leaflet, web-push (VAPID), Vercel Blob, Vitest, GitHub Actions cron

**Brand Identity:** Blu Istituzionale `#0056A0`, Verde Speranza `#2C6B2F`, Giallo/Ocra `#F5A623`, Rosso Emergenza `#D0021B`. Fonts: Montserrat (headings) + Open Sans (body). See `emergenza sicilia brand identity/brand_identity_emergenza_sicilia.md` for full guidelines.

**Spec:** `docs/superpowers/specs/2026-03-23-emergenza-sicilia-design.md`

---

## File Structure

```
emergenza-sicilia/
├── .github/workflows/
│   ├── ingest-feeds.yml              # Cron ogni 15min: trigger feed ingestion
│   └── ingest-wordpress.yml          # Cron ogni 30min: sync editoriali WP
├── app/
│   ├── [locale]/                     # next-intl locale wrapper (it/en)
│   │   ├── layout.tsx                # Public layout: TopBar + Footer + SponsorBanner
│   │   ├── page.tsx                  # Home: hero, events, feed, editorial
│   │   ├── mappa/page.tsx            # Leaflet map full-screen
│   │   ├── eventi/[id]/page.tsx      # Event detail: timeline, reports, CTA
│   │   ├── fonti/page.tsx            # Official sources list
│   │   ├── editoriale/page.tsx       # Editorial grid
│   │   ├── editoriale/[slug]/page.tsx # Single article + paywall
│   │   ├── segnala/page.tsx          # Report submission form
│   │   ├── alert/page.tsx            # Alert preferences + push subscribe
│   │   ├── premium/page.tsx          # Pricing page (mock checkout)
│   │   └── privacy/page.tsx          # GDPR privacy policy
│   ├── admin/
│   │   ├── layout.tsx                # Admin shell: sidebar nav
│   │   ├── login/page.tsx            # Admin login
│   │   ├── page.tsx                  # Dashboard: KPI, recent events, pending reports
│   │   ├── eventi/page.tsx           # Events CRUD
│   │   ├── segnalazioni/page.tsx     # Report moderation panel
│   │   ├── editoriali/page.tsx       # Editorial cache management
│   │   ├── sponsor/page.tsx          # Sponsor banner CRUD
│   │   ├── alert/page.tsx            # Push simulation
│   │   └── audit/page.tsx            # Audit log table
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth catch-all
│   │   ├── events/route.ts              # GET (list) + POST (create, admin)
│   │   ├── events/[id]/route.ts         # GET (detail) + PATCH (update, admin)
│   │   ├── ingest/route.ts              # POST: trigger feed ingestion (secret)
│   │   ├── ingest/wordpress/route.ts    # POST: sync WP posts (secret)
│   │   ├── reports/route.ts             # POST: submit report (rate limited)
│   │   ├── admin/reports/[id]/route.ts  # PATCH: moderate report (admin)
│   │   ├── editorial/route.ts           # GET: list editorials
│   │   ├── editorial/[slug]/route.ts    # GET: single editorial + paywall
│   │   ├── alerts/subscribe/route.ts    # POST: create AlertRule + PushSub
│   │   ├── push/send/route.ts           # POST: send push (admin)
│   │   ├── sources/route.ts             # GET: sources with recent items
│   │   └── user/me/route.ts             # DELETE: GDPR account deletion
│   ├── layout.tsx                    # Root layout: fonts, providers, metadata
│   └── globals.css                   # CSS variables, Tailwind base
├── components/
│   ├── ui/                           # shadcn/ui primitives (reskinned brand)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   └── table.tsx
│   ├── events/
│   │   ├── event-card.tsx            # Card with severity border-left
│   │   ├── event-list.tsx            # Filtered list with SWR polling
│   │   ├── severity-badge.tsx        # Chip with color + text (accessible)
│   │   └── filter-chips.tsx          # Category filter chips
│   ├── map/
│   │   ├── map-view.tsx              # Leaflet map (dynamic import, SSR-safe)
│   │   ├── map-marker.tsx            # Custom marker by severity
│   │   └── map-popup.tsx             # Event popup on marker click
│   ├── editorial/
│   │   ├── editorial-card.tsx        # Article card with premium badge
│   │   ├── editorial-featured.tsx    # Featured article (2-col hero)
│   │   └── editorial-grid.tsx        # Grid layout
│   ├── reports/
│   │   ├── report-form.tsx           # Submission form with upload
│   │   └── report-status.tsx         # Status display ("In verifica")
│   ├── alerts/
│   │   ├── alert-form.tsx            # Alert preferences form
│   │   └── push-permission.tsx       # Push notification permission UI
│   ├── admin/
│   │   ├── moderation-panel.tsx      # Split panel: list + detail
│   │   ├── event-form.tsx            # Create/edit event form
│   │   ├── sponsor-form.tsx          # Sponsor CRUD form
│   │   ├── audit-table.tsx           # Audit log table
│   │   └── kpi-cards.tsx             # Dashboard KPI cards
│   └── layout/
│       ├── top-bar.tsx               # Sticky header with nav + locale switch
│       ├── footer.tsx                # Navy footer with links
│       ├── sponsor-banner.tsx        # Banner display component
│       └── skeleton-loader.tsx       # Shimmer skeleton
├── lib/
│   ├── prisma.ts                     # Prisma client singleton (edge-safe)
│   ├── auth.ts                       # NextAuth v5 config
│   ├── ingestion/
│   │   ├── ingv.ts                   # INGV GeoJSON parser
│   │   ├── protezione-civile.ts      # PC open data parser
│   │   ├── anas.ts                   # ANAS RSS parser
│   │   ├── wordpress.ts              # WP REST API sync
│   │   └── dedup.ts                  # SHA-256 dedup hash utility
│   ├── push.ts                       # web-push VAPID helpers
│   ├── reliability.ts               # Report reliability score calc
│   ├── rate-limit.ts                 # DB-based rate limiter
│   └── validations.ts               # Zod schemas for API input
├── prisma/
│   ├── schema.prisma                 # Full DB schema
│   └── seed.ts                       # Seed data (admin + 8 events + etc.)
├── messages/
│   ├── it.json                       # Italian translations
│   └── en.json                       # English translations
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker
│   ├── logo_emergenza_sicilia.png    # Brand logo (from brand identity folder)
│   └── favicon.ico                   # Favicon (from pittogramma)
├── tests/
│   ├── lib/
│   │   ├── ingv.test.ts              # INGV parser unit tests
│   │   ├── protezione-civile.test.ts # PC parser unit tests
│   │   ├── anas.test.ts              # ANAS parser unit tests
│   │   ├── reliability.test.ts       # Reliability score unit tests
│   │   └── dedup.test.ts             # Dedup hash unit tests
│   └── api/
│       ├── events.test.ts            # Events API integration tests
│       └── reports.test.ts           # Reports API integration tests
├── i18n/
│   ├── request.ts                    # next-intl getRequestConfig
│   └── routing.ts                    # Locale routing config
├── middleware.ts                     # next-intl locale + admin auth guard
├── next.config.mjs                   # Next.js config with next-intl plugin
├── tailwind.config.ts                # Tailwind config with brand tokens
├── tsconfig.json
├── vitest.config.ts
├── .env.example                      # Documented env vars
├── .gitignore
├── package.json
└── README.md
```

---

## Phase 1: Foundation

### Task 1: Bootstrap Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `app/layout.tsx` (minimal root layout)
- Create: `app/globals.css`

- [ ] **Step 1: Create Next.js project**

```bash
cd "/Users/francescomarino/Desktop/COWORKING/Emergenza Sicilia"
npx create-next-app@14 emergenza-sicilia --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

- [ ] **Step 2: Move contents from subfolder to project root**

After create-next-app generates `emergenza-sicilia/`, move all contents to the project root since the git repo is already initialized here.

```bash
cd "/Users/francescomarino/Desktop/COWORKING/Emergenza Sicilia"
mv emergenza-sicilia/* emergenza-sicilia/.* . 2>/dev/null; rmdir emergenza-sicilia
```

- [ ] **Step 3: Install core dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter next-intl react-leaflet leaflet web-push zod dompurify swr
npm install -D @types/leaflet @types/web-push @types/dompurify vitest @vitejs/plugin-react tsx
```

- [ ] **Step 4: Install shadcn/ui**

```bash
npx shadcn@latest init -d
```

Then install needed components:
```bash
npx shadcn@latest add button card badge input textarea select dialog tabs table skeleton toast
```

- [ ] **Step 5: Create `.env.example`**

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/emergenza_sicilia?sslmode=require

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Ingestion
INGEST_SECRET=generate-a-random-secret

# WordPress.com
WP_SITE_ID=emergenzasicilia.wordpress.com

# Web Push (VAPID) — generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@emergenzasicilia.it

# Vercel Blob (media upload)
BLOB_READ_WRITE_TOKEN=

# Admin seed
ADMIN_EMAIL=admin@emergenzasicilia.it
ADMIN_PASSWORD=change-this-password
```

- [ ] **Step 6: Create `.gitignore`**

Ensure it includes: `node_modules/`, `.env`, `.env.local`, `.next/`, `prisma/*.db`, `.vercel`

- [ ] **Step 7: Verify project runs**

```bash
npm run dev
```

Expected: Next.js dev server at http://localhost:3000, default page loads.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .gitignore .env.example app/ components/ lib/ public/
git commit -m "feat: bootstrap Next.js 14 project with Tailwind and shadcn/ui"
```

---

### Task 2: Design System — Brand Tokens & Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx` (add Google Fonts)

- [ ] **Step 1: Configure Tailwind with brand tokens**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        es: {
          blue: "#0056A0",
          "blue-hover": "#004080",
          green: "#2C6B2F",
          yellow: "#F5A623",
          red: "#D0021B",
          white: "#FFFFFF",
          text: "#1A1A1A",
          "text-secondary": "#5F6368",
          bg: "#F8F9FA",
          border: "#DADCE0",
          navy: "#003366",
        },
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "36px", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "30px", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
      spacing: {
        "4.5": "18px",
      },
      borderRadius: {
        card: "12px",
        chip: "20px",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 2: Set up CSS variables in globals.css**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand colors */
    --es-blue: #0056A0;
    --es-blue-hover: #004080;
    --es-green: #2C6B2F;
    --es-yellow: #F5A623;
    --es-red: #D0021B;
    --es-white: #FFFFFF;
    --es-text: #1A1A1A;
    --es-text-secondary: #5F6368;
    --es-bg: #F8F9FA;
    --es-border: #DADCE0;
    --es-navy: #003366;

    /* shadcn/ui CSS variables — mapped to brand */
    --background: 0 0% 100%;
    --foreground: 0 0% 10%;
    --card: 210 17% 98%;
    --card-foreground: 0 0% 10%;
    --primary: 207 100% 31%;
    --primary-foreground: 0 0% 100%;
    --secondary: 138 42% 30%;
    --secondary-foreground: 0 0% 100%;
    --destructive: 352 97% 43%;
    --destructive-foreground: 0 0% 100%;
    --muted: 210 17% 98%;
    --muted-foreground: 220 3% 38%;
    --accent: 210 17% 98%;
    --accent-foreground: 0 0% 10%;
    --border: 220 9% 86%;
    --input: 220 9% 86%;
    --ring: 207 100% 31%;
    --radius: 0.5rem;
  }

  * {
    @apply border-es-border;
  }

  body {
    @apply bg-white text-es-text font-body;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

/* Severity border-left utilities */
@layer utilities {
  .severity-bassa {
    @apply border-l-4 border-l-es-green;
  }
  .severity-media {
    @apply border-l-4 border-l-es-yellow;
  }
  .severity-alta {
    @apply border-l-4 border-l-es-red;
  }
  .severity-critica {
    @apply border-l-4 border-l-es-red animate-pulse;
  }
}

/* Skeleton shimmer animation */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

- [ ] **Step 3: Add Google Fonts to root layout**

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Emergenza Sicilia — Informazione in tempo reale sulle emergenze",
  description:
    "Portale di informazione in tempo reale su emergenze in Sicilia: terremoti, maltempo, traffico, eruzioni Etna, incendi, allerte protezione civile.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={`${montserrat.variable} ${openSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Copy logo to public/**

```bash
cp "/Users/francescomarino/Desktop/COWORKING/Emergenza Sicilia/emergenza sicilia brand identity/logo_emergenza_sicilia.png" public/logo_emergenza_sicilia.png
```

- [ ] **Step 5: Verify dev server loads with new fonts and colors**

```bash
npm run dev
```

Expected: dev server starts, page loads with Montserrat/Open Sans fonts visible in browser dev tools.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx public/logo_emergenza_sicilia.png
git commit -m "feat: design system with brand tokens, typography, CSS variables"
```

---

### Task 3: Prisma Schema + Neon Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

- [ ] **Step 2: Write complete schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum EventCategory {
  TERREMOTO
  MALTEMPO
  TRAFFICO
  ERUZIONE
  INCENDIO
  ALLERTA
  TRASPORTI
}

enum Severity {
  BASSA
  MEDIA
  ALTA
  CRITICA
}

enum EventStatus {
  ATTIVO
  MONITORAGGIO
  CHIUSO
}

enum SourceName {
  INGV
  PC
  ANAS
  MANUALE
}

enum SourceType {
  RSS
  API
  MANUAL
}

enum ReportStatus {
  NUOVO
  IN_VERIFICA
  APPROVATO
  RIFIUTATO
}

enum AlertChannel {
  WEB
  PUSH
}

enum UserRole {
  ADMIN
  USER
}

enum EditorialType {
  EDITORIALE
  INTERVISTA
  APPROFONDIMENTO
}

enum PaywallType {
  FREE
  PREMIUM
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String
  role         UserRole    @default(USER)
  isPremium    Boolean     @default(false)
  createdAt    DateTime    @default(now())
  alertRules   AlertRule[]
  auditLogs    AuditLog[]
}

model Event {
  id           String        @id @default(cuid())
  title        String
  category     EventCategory
  severity     Severity
  description  String
  source       String
  sourceUrl    String?
  lat          Float?
  lng          Float?
  comune       String?
  provincia    String?
  status       EventStatus   @default(ATTIVO)
  tags         String[]
  publishedAt  DateTime
  updatedAt    DateTime      @updatedAt
  sourceItemId String?
  sourceItem   SourceItem?   @relation(fields: [sourceItemId], references: [id])
  reports      Report[]

  @@index([category])
  @@index([severity])
  @@index([status])
  @@index([publishedAt])
  @@index([provincia])
}

model SourceItem {
  id          String     @id @default(cuid())
  source      SourceName
  type        SourceType
  title       String
  text        String?
  url         String?
  publishedAt DateTime
  hashDedup   String     @unique
  rawJson     Json?
  createdAt   DateTime   @default(now())
  events      Event[]

  @@index([source])
  @@index([createdAt])
}

model AlertRule {
  id            String             @id @default(cuid())
  userId        String?
  user          User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  anonSessionId String?
  categories    String[]
  provinces     String[]
  minSeverity   Severity
  channels      AlertChannel[]
  active        Boolean            @default(true)
  createdAt     DateTime           @default(now())
  pushSubs      PushSubscription[]

  @@index([active])
}

model PushSubscription {
  id          String    @id @default(cuid())
  alertRuleId String
  alertRule   AlertRule @relation(fields: [alertRuleId], references: [id], onDelete: Cascade)
  endpoint    String    @unique
  p256dh      String
  auth        String
  createdAt   DateTime  @default(now())
}

model Report {
  id               String       @id @default(cuid())
  userId           String?
  anonId           String?
  text             String
  mediaUrls        String[]
  lat              Float?
  lng              Float?
  status           ReportStatus @default(NUOVO)
  reliabilityScore Int          @default(0)
  moderationNote   String?
  eventId          String?
  event            Event?       @relation(fields: [eventId], references: [id], onDelete: SetNull)
  ipHash           String
  createdAt        DateTime     @default(now())

  @@index([status])
  @@index([createdAt])
  @@index([reliabilityScore])
}

model EditorialPost {
  id          String        @id @default(cuid())
  wpId        Int           @unique
  title       String
  slug        String        @unique
  summary     String
  content     String
  type        EditorialType @default(EDITORIALE)
  featured    Boolean       @default(false)
  paywall     PaywallType   @default(FREE)
  publishedAt DateTime
  syncedAt    DateTime      @updatedAt
  readingTime Int           @default(5)
  imageUrl    String?

  @@index([publishedAt])
  @@index([type])
  @@index([featured])
}

model SponsorBanner {
  id       String    @id @default(cuid())
  position String
  imageUrl String
  linkUrl  String
  active   Boolean   @default(true)
  startAt  DateTime?
  endAt    DateTime?
}

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  admin      User     @relation(fields: [adminId], references: [id])
  action     String
  entityType String
  entityId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([adminId])
  @@index([action])
  @@index([createdAt])
}

model RateLimit {
  id          String   @id @default(cuid())
  ipHash      String
  windowStart DateTime
  count       Int      @default(1)

  @@unique([ipHash, windowStart])
  @@index([windowStart])
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Set DATABASE_URL in .env.local**

Create `.env.local` with the Neon connection string (or local Postgres for now):

```bash
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/emergenza_sicilia"' > .env.local
echo 'NEXTAUTH_SECRET="dev-secret-change-me"' >> .env.local
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env.local
echo 'INGEST_SECRET="dev-ingest-secret"' >> .env.local
echo 'WP_SITE_ID="emergenzasicilia.wordpress.com"' >> .env.local
echo 'ADMIN_EMAIL="admin@emergenzasicilia.it"' >> .env.local
echo 'ADMIN_PASSWORD="admin123"' >> .env.local
```

- [ ] **Step 5: Run Prisma migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration creates all tables successfully. `prisma/migrations/` folder created.

- [ ] **Step 6: Verify Prisma client generates**

```bash
npx prisma generate
```

Expected: "Prisma Client generated" message.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ lib/prisma.ts .env.example
git commit -m "feat: Prisma schema with all entities and Neon config"
```

---

### Task 4: Seed Data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed script)

- [ ] **Step 1: Write seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, EventCategory, Severity, EventStatus, SourceName, SourceType, ReportStatus, EditorialType, PaywallType, UserRole } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashDedup(source: string, title: string, date: string): string {
  return createHash("sha256").update(`${source}|${title}|${date}`).digest("hex");
}

async function main() {
  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.report.deleteMany();
  await prisma.event.deleteMany();
  await prisma.sourceItem.deleteMany();
  await prisma.editorialPost.deleteMany();
  await prisma.sponsorBanner.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.user.deleteMany();

  // 1. Admin user (password hashed with bcrypt — install bcryptjs)
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12);

  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@emergenzasicilia.it",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // 2. Source Items
  const sourceItems = await Promise.all([
    prisma.sourceItem.create({
      data: {
        source: SourceName.INGV,
        type: SourceType.API,
        title: "Terremoto ML 3.2 - Costa orientale Sicilia",
        text: "Un evento sismico di magnitudo ML 3.2 è stato localizzato dalla Rete Sismica Nazionale alle ore 14:32.",
        url: "https://terremoti.ingv.it/event/12345",
        publishedAt: new Date("2026-03-24T14:32:00Z"),
        hashDedup: hashDedup("INGV", "Terremoto ML 3.2 - Costa orientale Sicilia", "2026-03-24T14:32:00Z"),
        rawJson: { magnitude: 3.2, depth: 10, type: "ML" },
      },
    }),
    prisma.sourceItem.create({
      data: {
        source: SourceName.INGV,
        type: SourceType.API,
        title: "Terremoto ML 2.1 - Zona etnea",
        text: "Evento sismico di magnitudo ML 2.1 localizzato nella zona del vulcano Etna.",
        url: "https://terremoti.ingv.it/event/12346",
        publishedAt: new Date("2026-03-24T08:15:00Z"),
        hashDedup: hashDedup("INGV", "Terremoto ML 2.1 - Zona etnea", "2026-03-24T08:15:00Z"),
        rawJson: { magnitude: 2.1, depth: 5, type: "ML" },
      },
    }),
    prisma.sourceItem.create({
      data: {
        source: SourceName.INGV,
        type: SourceType.API,
        title: "Bollettino attività Etna - Emissione cenere",
        text: "Osservato incremento dell'attività stromboliana al cratere di Sud-Est con emissione di cenere.",
        url: "https://www.ct.ingv.it/index.php/monitoraggio-e-sorveglianza",
        publishedAt: new Date("2026-03-23T16:00:00Z"),
        hashDedup: hashDedup("INGV", "Bollettino attività Etna - Emissione cenere", "2026-03-23T16:00:00Z"),
      },
    }),
    prisma.sourceItem.create({
      data: {
        source: SourceName.PC,
        type: SourceType.API,
        title: "Allerta meteo arancione - Sicilia orientale",
        text: "Il Dipartimento della Protezione Civile ha emesso un avviso di condizioni meteorologiche avverse con allerta arancione per piogge intense.",
        url: "https://www.protezionecivile.gov.it/it/allerta-meteo",
        publishedAt: new Date("2026-03-24T06:00:00Z"),
        hashDedup: hashDedup("PC", "Allerta meteo arancione - Sicilia orientale", "2026-03-24T06:00:00Z"),
      },
    }),
    prisma.sourceItem.create({
      data: {
        source: SourceName.PC,
        type: SourceType.API,
        title: "Allerta meteo gialla - Sicilia settentrionale",
        text: "Previsti venti forti e mareggiate lungo la costa tirrenica della Sicilia.",
        url: "https://www.protezionecivile.gov.it/it/allerta-meteo",
        publishedAt: new Date("2026-03-24T06:00:00Z"),
        hashDedup: hashDedup("PC", "Allerta meteo gialla - Sicilia settentrionale", "2026-03-24T06:00:00Z"),
      },
    }),
    prisma.sourceItem.create({
      data: {
        source: SourceName.ANAS,
        type: SourceType.RSS,
        title: "A19 Palermo-Catania: chiusura corsia per lavori",
        text: "Chiusura della corsia di marcia in direzione Catania tra gli svincoli di Enna e Caltanissetta per lavori di manutenzione straordinaria.",
        url: "https://www.stradeanas.it/comunicato/12345",
        publishedAt: new Date("2026-03-24T10:00:00Z"),
        hashDedup: hashDedup("ANAS", "A19 Palermo-Catania: chiusura corsia per lavori", "2026-03-24T10:00:00Z"),
      },
    }),
    prisma.sourceItem.create({
      data: {
        source: SourceName.ANAS,
        type: SourceType.RSS,
        title: "SS114 Catania-Siracusa: incidente con rallentamenti",
        text: "Incidente stradale sulla SS114 in prossimità di Augusta. Rallentamenti in entrambe le direzioni.",
        url: "https://www.stradeanas.it/comunicato/12346",
        publishedAt: new Date("2026-03-24T12:30:00Z"),
        hashDedup: hashDedup("ANAS", "SS114 Catania-Siracusa: incidente con rallentamenti", "2026-03-24T12:30:00Z"),
      },
    }),
  ]);

  // 3. Events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: "Terremoto ML 3.2 - Costa orientale Sicilia",
        category: EventCategory.TERREMOTO,
        severity: Severity.MEDIA,
        description: "Un evento sismico di magnitudo locale 3.2 è stato registrato lungo la costa orientale della Sicilia. Nessun danno segnalato. Epicentro localizzato a 15 km da Catania.",
        source: "INGV",
        sourceUrl: "https://terremoti.ingv.it/event/12345",
        lat: 37.5079,
        lng: 15.0900,
        comune: "Catania",
        provincia: "CT",
        status: EventStatus.ATTIVO,
        tags: ["terremoto", "catania", "costa-orientale"],
        publishedAt: new Date("2026-03-24T14:32:00Z"),
        sourceItemId: sourceItems[0].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Terremoto ML 2.1 - Zona etnea",
        category: EventCategory.TERREMOTO,
        severity: Severity.BASSA,
        description: "Scossa di magnitudo 2.1 nella zona del vulcano Etna, profondità 5 km. Evento di routine per l'area vulcanica.",
        source: "INGV",
        sourceUrl: "https://terremoti.ingv.it/event/12346",
        lat: 37.7510,
        lng: 14.9934,
        comune: "Nicolosi",
        provincia: "CT",
        status: EventStatus.ATTIVO,
        tags: ["terremoto", "etna", "vulcanico"],
        publishedAt: new Date("2026-03-24T08:15:00Z"),
        sourceItemId: sourceItems[1].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Attività stromboliana Etna - Emissione cenere",
        category: EventCategory.ERUZIONE,
        severity: Severity.ALTA,
        description: "Incremento dell'attività stromboliana al cratere di Sud-Est dell'Etna con emissione di cenere vulcanica. Possibile ricaduta su centri abitati etnei e sull'aeroporto di Catania.",
        source: "INGV-OE",
        sourceUrl: "https://www.ct.ingv.it/index.php/monitoraggio-e-sorveglianza",
        lat: 37.7510,
        lng: 14.9934,
        comune: "Catania",
        provincia: "CT",
        status: EventStatus.ATTIVO,
        tags: ["etna", "eruzione", "cenere", "aeroporto"],
        publishedAt: new Date("2026-03-23T16:00:00Z"),
        sourceItemId: sourceItems[2].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Allerta meteo arancione - Sicilia orientale",
        category: EventCategory.ALLERTA,
        severity: Severity.ALTA,
        description: "Allerta arancione per piogge intense, temporali e rischio idrogeologico sulla Sicilia orientale. Valida dalle 00:00 alle 24:00 del 24 marzo 2026.",
        source: "Protezione Civile",
        sourceUrl: "https://www.protezionecivile.gov.it/it/allerta-meteo",
        lat: 37.5,
        lng: 15.1,
        provincia: "CT",
        status: EventStatus.ATTIVO,
        tags: ["allerta-meteo", "arancione", "pioggia", "idrogeologico"],
        publishedAt: new Date("2026-03-24T06:00:00Z"),
        sourceItemId: sourceItems[3].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Allerta meteo gialla - Sicilia settentrionale",
        category: EventCategory.MALTEMPO,
        severity: Severity.MEDIA,
        description: "Previsti venti forti e mareggiate lungo la costa tirrenica. Allerta gialla per vento e mare grosso.",
        source: "Protezione Civile",
        sourceUrl: "https://www.protezionecivile.gov.it/it/allerta-meteo",
        lat: 38.1,
        lng: 13.4,
        provincia: "PA",
        status: EventStatus.ATTIVO,
        tags: ["maltempo", "vento", "mare", "tirrenico"],
        publishedAt: new Date("2026-03-24T06:00:00Z"),
        sourceItemId: sourceItems[4].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "Incendio boschivo zona Nebrodi",
        category: EventCategory.INCENDIO,
        severity: Severity.ALTA,
        description: "Incendio di vaste proporzioni in zona Parco dei Nebrodi. Canadair in azione. Evacuazione precauzionale di alcune case rurali.",
        source: "Protezione Civile",
        lat: 37.96,
        lng: 14.74,
        comune: "Caronia",
        provincia: "ME",
        status: EventStatus.ATTIVO,
        tags: ["incendio", "nebrodi", "evacuazione"],
        publishedAt: new Date("2026-03-23T11:00:00Z"),
      },
    }),
    prisma.event.create({
      data: {
        title: "A19 Palermo-Catania: chiusura corsia per lavori",
        category: EventCategory.TRAFFICO,
        severity: Severity.BASSA,
        description: "Chiusura corsia di marcia in direzione Catania tra Enna e Caltanissetta per lavori. Deviazione su corsia opposta con senso unico alternato.",
        source: "ANAS",
        sourceUrl: "https://www.stradeanas.it/comunicato/12345",
        lat: 37.57,
        lng: 14.27,
        comune: "Enna",
        provincia: "EN",
        status: EventStatus.ATTIVO,
        tags: ["traffico", "lavori", "autostrada", "a19"],
        publishedAt: new Date("2026-03-24T10:00:00Z"),
        sourceItemId: sourceItems[5].id,
      },
    }),
    prisma.event.create({
      data: {
        title: "SS114: incidente con rallentamenti",
        category: EventCategory.TRAFFICO,
        severity: Severity.MEDIA,
        description: "Incidente stradale sulla SS114 presso Augusta con rallentamenti in entrambe le direzioni. Forze dell'ordine sul posto.",
        source: "ANAS",
        sourceUrl: "https://www.stradeanas.it/comunicato/12346",
        lat: 37.23,
        lng: 15.18,
        comune: "Augusta",
        provincia: "SR",
        status: EventStatus.MONITORAGGIO,
        tags: ["traffico", "incidente", "ss114"],
        publishedAt: new Date("2026-03-24T12:30:00Z"),
        sourceItemId: sourceItems[6].id,
      },
    }),
  ]);

  // 4. Reports (segnalazioni in vari stati)
  await Promise.all([
    prisma.report.create({
      data: {
        text: "Forte scossa avvertita a Catania, palazzo vibrato per almeno 5 secondi. Gente in strada.",
        mediaUrls: [],
        lat: 37.5079,
        lng: 15.0900,
        status: ReportStatus.APPROVATO,
        reliabilityScore: 70,
        eventId: events[0].id,
        ipHash: createHash("sha256").update("192.168.1.1salt").digest("hex"),
      },
    }),
    prisma.report.create({
      data: {
        text: "Vista colonna di fumo nero dalla zona Nebrodi, visibile da Cefalù.",
        mediaUrls: ["https://example.com/photo1.jpg"],
        lat: 38.03,
        lng: 14.02,
        status: ReportStatus.APPROVATO,
        reliabilityScore: 80,
        moderationNote: "Confermata da fonte locale",
        eventId: events[5].id,
        ipHash: createHash("sha256").update("192.168.1.2salt").digest("hex"),
      },
    }),
    prisma.report.create({
      data: {
        text: "Allagamento in via Etnea a Catania, acqua alta 30cm, traffico bloccato.",
        mediaUrls: [],
        lat: 37.5023,
        lng: 15.0873,
        status: ReportStatus.NUOVO,
        reliabilityScore: 50,
        ipHash: createHash("sha256").update("192.168.1.3salt").digest("hex"),
      },
    }),
    prisma.report.create({
      data: {
        text: "Frana sulla SP22 verso Taormina dopo piogge intense.",
        mediaUrls: ["https://example.com/photo2.jpg"],
        status: ReportStatus.IN_VERIFICA,
        reliabilityScore: 60,
        ipHash: createHash("sha256").update("192.168.1.4salt").digest("hex"),
      },
    }),
    prisma.report.create({
      data: {
        text: "testo spam fake",
        mediaUrls: [],
        status: ReportStatus.RIFIUTATO,
        reliabilityScore: 10,
        moderationNote: "Segnalazione non pertinente, testo troppo breve",
        ipHash: createHash("sha256").update("192.168.1.5salt").digest("hex"),
      },
    }),
  ]);

  // 5. Editorial Posts
  await Promise.all([
    prisma.editorialPost.create({
      data: {
        wpId: 1001,
        title: "Ciclone Harry: cosa abbiamo imparato",
        slug: "ciclone-harry-cosa-abbiamo-imparato",
        summary: "Un'analisi approfondita delle vulnerabilità emerse durante il ciclone Harry e le lezioni per il futuro della protezione civile in Sicilia.",
        content: "<p>Il ciclone Harry ha rappresentato un punto di svolta per la consapevolezza del rischio meteo-idrogeologico in Sicilia...</p><p>Le infrastrutture viarie, in particolare viadotti e gallerie, hanno mostrato criticità significative...</p>",
        type: EditorialType.EDITORIALE,
        featured: true,
        paywall: PaywallType.FREE,
        publishedAt: new Date("2026-03-20T10:00:00Z"),
        readingTime: 8,
        imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800",
      },
    }),
    prisma.editorialPost.create({
      data: {
        wpId: 1002,
        title: "Intervista al direttore della Protezione Civile Sicilia",
        slug: "intervista-direttore-protezione-civile-sicilia",
        summary: "Il direttore regionale racconta le sfide della prevenzione e la nuova strategia di comunicazione con i cittadini.",
        content: "<p>In esclusiva per Emergenza Sicilia, abbiamo intervistato il direttore della Protezione Civile regionale...</p>",
        type: EditorialType.INTERVISTA,
        featured: false,
        paywall: PaywallType.PREMIUM,
        publishedAt: new Date("2026-03-18T14:00:00Z"),
        readingTime: 12,
        imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      },
    }),
    prisma.editorialPost.create({
      data: {
        wpId: 1003,
        title: "Guida: come prepararsi a un terremoto in Sicilia",
        slug: "guida-prepararsi-terremoto-sicilia",
        summary: "Kit di emergenza, piano familiare, punti di raccolta: tutto quello che devi sapere per essere pronto.",
        content: "<p>La Sicilia è una delle regioni a più alto rischio sismico d'Italia...</p><p>Ecco una guida pratica per preparare la tua famiglia...</p>",
        type: EditorialType.APPROFONDIMENTO,
        featured: false,
        paywall: PaywallType.FREE,
        publishedAt: new Date("2026-03-15T09:00:00Z"),
        readingTime: 6,
        imageUrl: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800",
      },
    }),
  ]);

  // 6. Sponsor Banners
  await Promise.all([
    prisma.sponsorBanner.create({
      data: {
        position: "sidebar",
        imageUrl: "https://via.placeholder.com/300x250?text=Sponsor+Sidebar",
        linkUrl: "https://example.com/sponsor1",
        active: true,
      },
    }),
    prisma.sponsorBanner.create({
      data: {
        position: "in-feed",
        imageUrl: "https://via.placeholder.com/728x90?text=Sponsor+In-Feed",
        linkUrl: "https://example.com/sponsor2",
        active: true,
      },
    }),
  ]);

  // 7. Alert Rule (example)
  await prisma.alertRule.create({
    data: {
      userId: admin.id,
      categories: ["TERREMOTO", "ERUZIONE", "ALLERTA"],
      provinces: ["CT", "ME"],
      minSeverity: Severity.MEDIA,
      channels: [AlertChannel.WEB, AlertChannel.PUSH],
      active: true,
    },
  });

  console.log("✅ Seed completato con successo!");
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Eventi: ${events.length}`);
  console.log(`   Source Items: ${sourceItems.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add bcryptjs dependency**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Add seed script to package.json**

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 4: Run seed**

```bash
npx prisma db seed
```

Expected: "✅ Seed completato con successo!" with counts.

- [ ] **Step 5: Verify seed data in Prisma Studio**

```bash
npx prisma studio
```

Expected: Browser opens, all tables populated with seed data.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: seed data with realistic Sicilian emergency events"
```

---

### Task 5: NextAuth v5 Configuration

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Modify: `middleware.ts` (will be expanded in Task 33 for i18n)

- [ ] **Step 1: Write NextAuth config**

Create `lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isPremium: user.isPremium,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.isPremium = (user as any).isPremium;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).isPremium = token.isPremium;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
});
```

- [ ] **Step 2: Create NextAuth route handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create basic middleware for admin protection**

Create `middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect /admin/* routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if ((req.auth.user as any)?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 4: Create TypeScript type augmentation for NextAuth**

Create `types/next-auth.d.ts`:

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      isPremium: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "USER";
    isPremium: boolean;
  }
}
```

- [ ] **Step 5: Verify auth endpoint works**

```bash
npm run dev
```

Visit http://localhost:3000/api/auth/providers — should return JSON with credentials provider.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/api/auth/ middleware.ts types/next-auth.d.ts
git commit -m "feat: NextAuth v5 with credentials provider and admin middleware"
```

---

### Task 6: Core Layout Components (TopBar + Footer)

**Files:**
- Create: `components/layout/top-bar.tsx`
- Create: `components/layout/footer.tsx`
- Create: `components/layout/sponsor-banner.tsx`

- [ ] **Step 1: Create TopBar**

Create `components/layout/top-bar.tsx`:

```typescript
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/mappa", label: "Mappa" },
  { href: "/fonti", label: "Fonti" },
  { href: "/editoriale", label: "Editoriale" },
  { href: "/segnala", label: "Segnala" },
  { href: "/alert", label: "Alert" },
];

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-es-blue shadow-md">
      <div className="mx-auto max-w-content flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo_emergenza_sicilia.png"
            alt="Emergenza Sicilia"
            width={160}
            height={40}
            className="h-8 w-auto brightness-0 invert"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/90 hover:text-white text-sm font-body font-medium transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/premium"
            className="bg-es-yellow text-es-text text-sm font-heading font-semibold px-4 py-1.5 rounded-chip hover:opacity-90 transition-opacity duration-150"
          >
            Premium
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav className="md:hidden bg-es-blue border-t border-white/10 px-4 pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-white/90 hover:text-white text-sm font-body"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/premium"
            className="block mt-2 bg-es-yellow text-es-text text-sm font-heading font-semibold px-4 py-2 rounded-chip text-center"
            onClick={() => setMenuOpen(false)}
          >
            Premium
          </Link>
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create Footer**

Create `components/layout/footer.tsx`:

```typescript
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-es-navy text-white mt-16">
      <div className="mx-auto max-w-content px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image
              src="/logo_emergenza_sicilia.png"
              alt="Emergenza Sicilia"
              width={160}
              height={40}
              className="h-8 w-auto brightness-0 invert mb-4"
            />
            <p className="text-white/70 text-sm font-body">
              Informazione in tempo reale sulle emergenze in Sicilia.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">Navigazione</h4>
            <ul className="space-y-2">
              {[
                { href: "/mappa", label: "Mappa" },
                { href: "/fonti", label: "Fonti ufficiali" },
                { href: "/editoriale", label: "Editoriale" },
                { href: "/segnala", label: "Segnala" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">Informazioni</h4>
            <ul className="space-y-2">
              {[
                { href: "/premium", label: "Premium" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/alert", label: "Imposta Alert" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">Chi siamo</h4>
            <p className="text-white/70 text-sm font-body">
              Emergenza Sicilia nasce per centralizzare le informazioni sulle emergenze in una regione
              ad alto rischio sismico e vulcanico, riducendo i rischi per cittadini e turisti.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/50 text-xs font-body">
          © {new Date().getFullYear()} Emergenza Sicilia. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create SponsorBanner**

Create `components/layout/sponsor-banner.tsx`:

```typescript
import Image from "next/image";

interface SponsorBannerProps {
  imageUrl: string;
  linkUrl: string;
  position: string;
}

export function SponsorBanner({ imageUrl, linkUrl, position }: SponsorBannerProps) {
  return (
    <div className="flex justify-center py-2" data-position={position}>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block opacity-80 hover:opacity-100 transition-opacity duration-150"
      >
        <Image
          src={imageUrl}
          alt="Sponsor"
          width={position === "sidebar" ? 300 : 728}
          height={position === "sidebar" ? 250 : 90}
          className="rounded-card"
        />
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Verify components render**

Create a temp page or import TopBar + Footer into the root layout and verify they render correctly in the browser.

- [ ] **Step 5: Commit**

```bash
git add components/layout/
git commit -m "feat: TopBar, Footer, SponsorBanner layout components"
```

---

### Task 7: Event Components (EventCard, SeverityBadge, FilterChips)

**Files:**
- Create: `components/events/severity-badge.tsx`
- Create: `components/events/event-card.tsx`
- Create: `components/events/filter-chips.tsx`
- Create: `components/events/event-list.tsx`

- [ ] **Step 1: Create SeverityBadge**

Create `components/events/severity-badge.tsx`:

```typescript
import { cn } from "@/lib/utils";

type SeverityLevel = "BASSA" | "MEDIA" | "ALTA" | "CRITICA";

const severityConfig: Record<SeverityLevel, { bg: string; text: string; label: string; dot: string }> = {
  BASSA: { bg: "bg-es-green/10", text: "text-es-green", label: "Bassa", dot: "bg-es-green" },
  MEDIA: { bg: "bg-es-yellow/10", text: "text-es-yellow", label: "Media", dot: "bg-es-yellow" },
  ALTA: { bg: "bg-es-red/10", text: "text-es-red", label: "Alta", dot: "bg-es-red" },
  CRITICA: { bg: "bg-es-red/20", text: "text-es-red", label: "Critica", dot: "bg-es-red animate-pulse" },
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const config = severityConfig[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-heading font-semibold",
        config.bg,
        config.text
      )}
      role="status"
      aria-label={`Severità: ${config.label}`}
    >
      <span className={cn("w-2 h-2 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Create EventCard**

Create `components/events/event-card.tsx`:

```typescript
import Link from "next/link";
import { SeverityBadge } from "./severity-badge";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  title: string;
  category: string;
  severity: "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
  description: string;
  source: string;
  publishedAt: string;
  provincia?: string | null;
  status: string;
}

const categoryLabels: Record<string, string> = {
  TERREMOTO: "Terremoto",
  MALTEMPO: "Maltempo",
  TRAFFICO: "Traffico",
  ERUZIONE: "Eruzione",
  INCENDIO: "Incendio",
  ALLERTA: "Allerta",
  TRASPORTI: "Trasporti",
};

const severityBorder: Record<string, string> = {
  BASSA: "border-l-es-green",
  MEDIA: "border-l-es-yellow",
  ALTA: "border-l-es-red",
  CRITICA: "border-l-es-red",
};

export function EventCard({
  id, title, category, severity, description, source, publishedAt, provincia, status,
}: EventCardProps) {
  const timeAgo = formatTimeAgo(publishedAt);

  return (
    <Link href={`/eventi/${id}`}>
      <article
        className={cn(
          "bg-es-bg rounded-card border-l-4 p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer",
          severityBorder[severity]
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-es-blue/10 text-es-blue text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
              {categoryLabels[category] || category}
            </span>
            <SeverityBadge severity={severity} />
            {status === "CHIUSO" && (
              <span className="bg-gray-200 text-gray-600 text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
                Chiuso
              </span>
            )}
          </div>
          {provincia && (
            <span className="text-es-text-secondary text-caption font-body shrink-0">
              {provincia}
            </span>
          )}
        </div>

        <h3 className="font-heading font-semibold text-base text-es-text mb-1 line-clamp-2">
          {title}
        </h3>

        <p className="text-es-text-secondary text-sm font-body line-clamp-2 mb-3">
          {description}
        </p>

        <div className="flex items-center justify-between text-xs text-es-text-secondary font-body">
          <span>Fonte: {source}</span>
          <time dateTime={publishedAt}>{timeAgo}</time>
        </div>
      </article>
    </Link>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "ora";
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h fa`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}g fa`;
}
```

- [ ] **Step 3: Create FilterChips**

Create `components/events/filter-chips.tsx`:

```typescript
"use client";

import { cn } from "@/lib/utils";

const categories = [
  { value: "ALL", label: "Tutti" },
  { value: "TERREMOTO", label: "Terremoti" },
  { value: "MALTEMPO", label: "Maltempo" },
  { value: "TRAFFICO", label: "Traffico" },
  { value: "ERUZIONE", label: "Eruzioni" },
  { value: "INCENDIO", label: "Incendi" },
  { value: "ALLERTA", label: "Allerte" },
  { value: "TRASPORTI", label: "Trasporti" },
];

interface FilterChipsProps {
  selected: string;
  onSelect: (value: string) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per categoria">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={cn(
            "px-3 py-1.5 rounded-chip text-xs font-heading font-semibold transition-all duration-150",
            selected === cat.value
              ? "bg-es-blue text-white shadow-sm"
              : "bg-es-bg text-es-text-secondary hover:bg-es-border"
          )}
          aria-pressed={selected === cat.value}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create EventList**

Create `components/events/event-list.tsx`:

```typescript
"use client";

import { useState } from "react";
import { EventCard } from "./event-card";
import { FilterChips } from "./filter-chips";

interface Event {
  id: string;
  title: string;
  category: string;
  severity: "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
  description: string;
  source: string;
  publishedAt: string;
  provincia: string | null;
  status: string;
}

interface EventListProps {
  events: Event[];
  showFilters?: boolean;
}

export function EventList({ events, showFilters = true }: EventListProps) {
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL"
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div>
      {showFilters && (
        <div className="mb-4">
          <FilterChips selected={filter} onSelect={setFilter} />
        </div>
      )}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-es-text-secondary text-sm font-body py-8 text-center">
            Nessun evento trovato per questa categoria.
          </p>
        ) : (
          filtered.map((event) => (
            <EventCard key={event.id} {...event} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/events/
git commit -m "feat: EventCard, SeverityBadge, FilterChips, EventList components"
```

---

### Task 8: Skeleton Loader

**Files:**
- Create: `components/layout/skeleton-loader.tsx`

- [ ] **Step 1: Create SkeletonLoader**

Create `components/layout/skeleton-loader.tsx`:

```typescript
import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-es-bg rounded-card border-l-4 border-l-gray-200 p-4", className)}>
      <div className="flex gap-2 mb-3">
        <div className="skeleton-shimmer h-5 w-20 rounded-chip" />
        <div className="skeleton-shimmer h-5 w-16 rounded-chip" />
      </div>
      <div className="skeleton-shimmer h-5 w-3/4 rounded mb-2" />
      <div className="skeleton-shimmer h-4 w-full rounded mb-1" />
      <div className="skeleton-shimmer h-4 w-2/3 rounded mb-4" />
      <div className="flex justify-between">
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer h-3 w-16 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="bg-es-bg rounded-card p-6">
      <div className="skeleton-shimmer h-8 w-64 rounded mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-card" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/skeleton-loader.tsx
git commit -m "feat: skeleton loading components (card, list, hero)"
```

---

## Phase 2: API Layer

### Task 9: Zod Validation Schemas

**Files:**
- Create: `lib/validations.ts`

- [ ] **Step 1: Write Zod schemas**

Create `lib/validations.ts`:

```typescript
import { z } from "zod";

export const EventQuerySchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional(),
  provincia: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const CreateEventSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum(["TERREMOTO", "MALTEMPO", "TRAFFICO", "ERUZIONE", "INCENDIO", "ALLERTA", "TRASPORTI"]),
  severity: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]),
  description: z.string().min(10).max(2000),
  source: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  comune: z.string().optional(),
  provincia: z.string().max(2).optional(),
  tags: z.array(z.string()).default([]),
});

export const UpdateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  severity: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  description: z.string().min(10).max(2000).optional(),
  status: z.enum(["ATTIVO", "MONITORAGGIO", "CHIUSO"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateReportSchema = z.object({
  text: z.string().min(10).max(500),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  eventId: z.string().optional(),
});

export const ModerateReportSchema = z.object({
  status: z.enum(["IN_VERIFICA", "APPROVATO", "RIFIUTATO"]),
  moderationNote: z.string().max(500).optional(),
  eventId: z.string().optional(),
});

export const AlertSubscribeSchema = z.object({
  categories: z.array(z.string()).min(1),
  provinces: z.array(z.string()).min(1),
  minSeverity: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]),
  pushSubscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }).optional(),
});

export const PushSendSchema = z.object({
  eventId: z.string(),
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations.ts
git commit -m "feat: Zod validation schemas for all API endpoints"
```

---

### Task 10: Events API Routes

**Files:**
- Create: `app/api/events/route.ts`
- Create: `app/api/events/[id]/route.ts`

- [ ] **Step 1: Create Events list + create route**

Create `app/api/events/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventQuerySchema, CreateEventSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = EventQuerySchema.safeParse(params);

  if (!query.success) {
    return NextResponse.json({ error: query.error.flatten() }, { status: 400 });
  }

  const { category, severity, provincia, status, limit, offset } = query.data;

  const where: Prisma.EventWhereInput = {};
  if (category) where.category = category as any;
  if (severity) where.severity = severity as any;
  if (provincia) where.provincia = provincia;
  if (status) where.status = status as any;
  else where.status = { not: "CHIUSO" };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({ events, total, limit, offset });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      publishedAt: new Date(),
      sourceUrl: parsed.data.sourceUrl || null,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      adminId: (session.user as any).id,
      action: "CREATE_EVENT",
      entityType: "Event",
      entityId: event.id,
      metadata: { title: event.title },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
```

- [ ] **Step 2: Create Event detail + update route**

Create `app/api/events/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateEventSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      sourceItem: true,
      reports: {
        where: { status: "APPROVATO" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      adminId: (session.user as any).id,
      action: parsed.data.status === "CHIUSO" ? "CLOSE_EVENT" : "UPDATE_EVENT",
      entityType: "Event",
      entityId: event.id,
      metadata: parsed.data,
    },
  });

  return NextResponse.json(event);
}
```

- [ ] **Step 3: Verify API works**

```bash
curl http://localhost:3000/api/events | jq
```

Expected: JSON with `events` array containing seed data, `total` count.

- [ ] **Step 4: Commit**

```bash
git add app/api/events/
git commit -m "feat: Events API routes (GET list, GET detail, POST create, PATCH update)"
```

---

### Task 11: Reliability Score + Rate Limiter

**Files:**
- Create: `lib/reliability.ts`
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Write reliability score calculator**

Create `lib/reliability.ts`:

```typescript
interface ReliabilityInput {
  hasLocation: boolean;
  hasMedia: boolean;
  isRegistered: boolean;
  isFirstSubmission: boolean;
  textLength: number;
}

export function calculateReliability(input: ReliabilityInput): number {
  let score = 0;

  if (input.hasLocation) score += 30;
  if (input.hasMedia) score += 20;
  if (input.isRegistered) score += 20;
  if (input.isFirstSubmission) score += 20;
  if (input.textLength < 30) score -= 10;

  return Math.max(0, Math.min(100, score));
}
```

- [ ] **Step 2: Write DB-based rate limiter**

Create `lib/rate-limit.ts`:

```typescript
import { prisma } from "./prisma";
import { createHash } from "crypto";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

export function hashIP(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET || "default-salt";
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}

export async function checkRateLimit(ipHash: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);

  const existing = await prisma.rateLimit.findUnique({
    where: { ipHash_windowStart: { ipHash, windowStart } },
  });

  if (!existing) {
    await prisma.rateLimit.create({
      data: { ipHash, windowStart, count: 1 },
    });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: MAX_REQUESTS - existing.count - 1 };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/reliability.ts lib/rate-limit.ts
git commit -m "feat: reliability score calculator and DB-based rate limiter"
```

---

### Task 12: Reports API Route

**Files:**
- Create: `app/api/reports/route.ts`
- Create: `app/api/admin/reports/[id]/route.ts`

- [ ] **Step 1: Create report submission route**

Create `app/api/reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateReportSchema } from "@/lib/validations";
import { calculateReliability } from "@/lib/reliability";
import { checkRateLimit, hashIP } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  const ipHashed = hashIP(ip);

  const { allowed, remaining } = await checkRateLimit(ipHashed);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppe segnalazioni. Riprova tra un'ora." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  const body = await request.json();
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();
  const isRegistered = !!session?.user;

  // Check if first submission from this IP in 24h
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const previousCount = await prisma.report.count({
    where: { ipHash: ipHashed, createdAt: { gte: dayAgo } },
  });

  const reliabilityScore = calculateReliability({
    hasLocation: !!(parsed.data.lat && parsed.data.lng),
    hasMedia: false, // Media handled separately via multipart
    isRegistered,
    isFirstSubmission: previousCount === 0,
    textLength: parsed.data.text.length,
  });

  const report = await prisma.report.create({
    data: {
      text: parsed.data.text,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      eventId: parsed.data.eventId || null,
      userId: session?.user?.id || null,
      mediaUrls: [],
      reliabilityScore,
      ipHash: ipHashed,
    },
  });

  return NextResponse.json(
    { id: report.id, status: report.status, reliabilityScore },
    { status: 201, headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
```

- [ ] **Step 2: Create admin moderation route**

Create `app/api/admin/reports/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ModerateReportSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ModerateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await prisma.report.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      moderationNote: parsed.data.moderationNote,
      eventId: parsed.data.eventId,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: (session.user as any).id,
      action: `${parsed.data.status === "APPROVATO" ? "APPROVE" : parsed.data.status === "RIFIUTATO" ? "REJECT" : "VERIFY"}_REPORT`,
      entityType: "Report",
      entityId: report.id,
      metadata: { status: parsed.data.status, note: parsed.data.moderationNote },
    },
  });

  return NextResponse.json(report);
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/reports/ app/api/admin/
git commit -m "feat: Reports API with rate limiting and admin moderation"
```

---

### Task 13: Editorial + Sources API Routes

**Files:**
- Create: `app/api/editorial/route.ts`
- Create: `app/api/editorial/[slug]/route.ts`
- Create: `app/api/sources/route.ts`

- [ ] **Step 1: Create editorial list route**

Create `app/api/editorial/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const limit = Math.min(Number(params.get("limit") || 20), 50);
  const offset = Number(params.get("offset") || 0);

  const where: any = {};
  if (type) where.type = type;

  const [posts, total] = await Promise.all([
    prisma.editorialPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        wpId: true,
        title: true,
        slug: true,
        summary: true,
        type: true,
        featured: true,
        paywall: true,
        publishedAt: true,
        readingTime: true,
        imageUrl: true,
      },
    }),
    prisma.editorialPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, limit, offset });
}
```

- [ ] **Step 2: Create single editorial route with paywall**

Create `app/api/editorial/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await prisma.editorialPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Paywall check for premium content
  if (post.paywall === "PREMIUM") {
    const session = await auth();
    const isPremium = (session?.user as any)?.isPremium;

    if (!isPremium) {
      // Return truncated content
      const firstParagraph = post.content.split("</p>")[0] + "</p>";
      return NextResponse.json({
        ...post,
        content: firstParagraph,
        isPaywalled: true,
      });
    }
  }

  return NextResponse.json({ ...post, isPaywalled: false });
}
```

- [ ] **Step 3: Create sources route**

Create `app/api/sources/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SOURCE_INFO = [
  {
    key: "INGV",
    name: "Istituto Nazionale di Geofisica e Vulcanologia",
    description: "Monitoraggio sismico e vulcanico del territorio nazionale",
    url: "https://www.ingv.it",
  },
  {
    key: "PC",
    name: "Protezione Civile",
    description: "Allerte meteo, idrogeologiche e gestione emergenze",
    url: "https://www.protezionecivile.gov.it",
  },
  {
    key: "ANAS",
    name: "ANAS - Strade e Autostrade",
    description: "Viabilità, traffico e manutenzione della rete stradale",
    url: "https://www.stradeanas.it",
  },
];

export async function GET() {
  const sources = await Promise.all(
    SOURCE_INFO.map(async (src) => {
      const recentItems = await prisma.sourceItem.findMany({
        where: { source: src.key as any },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          url: true,
          publishedAt: true,
          createdAt: true,
        },
      });

      return { ...src, recentItems };
    })
  );

  return NextResponse.json(sources);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/editorial/ app/api/sources/
git commit -m "feat: Editorial API (list + paywall) and Sources API"
```

---

### Task 14: Alerts + Push API Routes

**Files:**
- Create: `lib/push.ts`
- Create: `app/api/alerts/subscribe/route.ts`
- Create: `app/api/push/send/route.ts`

- [ ] **Step 1: Create push notification helpers**

Create `lib/push.ts`:

```typescript
import webpush from "web-push";
import { prisma } from "./prisma";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@emergenzasicilia.it",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
  severity: string;
}

export async function sendPushToMatching(event: {
  id: string;
  title: string;
  category: string;
  severity: string;
  provincia: string | null;
}) {
  // Find matching alert rules
  const rules = await prisma.alertRule.findMany({
    where: {
      active: true,
      categories: { hasSome: [event.category] },
      ...(event.provincia ? { provinces: { hasSome: [event.provincia] } } : {}),
    },
    include: {
      pushSubs: true,
    },
  });

  const severityOrder = ["BASSA", "MEDIA", "ALTA", "CRITICA"];
  const eventSeverityIdx = severityOrder.indexOf(event.severity);

  const payload: PushPayload = {
    title: `⚠️ ${event.title}`,
    body: `Severità: ${event.severity}${event.provincia ? ` — ${event.provincia}` : ""}`,
    url: `/eventi/${event.id}`,
    severity: event.severity,
  };

  let sent = 0;
  let failed = 0;

  for (const rule of rules) {
    const ruleMinIdx = severityOrder.indexOf(rule.minSeverity);
    if (eventSeverityIdx < ruleMinIdx) continue;

    for (const sub of rule.pushSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (error: any) {
        failed++;
        // Remove invalid subscriptions (410 Gone)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }
  }

  return { sent, failed };
}
```

- [ ] **Step 2: Create alert subscribe route**

Create `app/api/alerts/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AlertSubscribeSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = AlertSubscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();

  const alertRule = await prisma.alertRule.create({
    data: {
      userId: session?.user?.id || null,
      anonSessionId: session?.user?.id ? null : crypto.randomUUID(),
      categories: parsed.data.categories,
      provinces: parsed.data.provinces,
      minSeverity: parsed.data.minSeverity,
      channels: parsed.data.pushSubscription ? ["WEB", "PUSH"] : ["WEB"],
    },
  });

  // Save push subscription if provided
  if (parsed.data.pushSubscription) {
    await prisma.pushSubscription.create({
      data: {
        alertRuleId: alertRule.id,
        endpoint: parsed.data.pushSubscription.endpoint,
        p256dh: parsed.data.pushSubscription.keys.p256dh,
        auth: parsed.data.pushSubscription.keys.auth,
      },
    });
  }

  return NextResponse.json({ id: alertRule.id }, { status: 201 });
}
```

- [ ] **Step 3: Create push send route (admin)**

Create `app/api/push/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PushSendSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { sendPushToMatching } from "@/lib/push";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PushSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const result = await sendPushToMatching(event);

  await prisma.auditLog.create({
    data: {
      adminId: (session.user as any).id,
      action: "SEND_PUSH",
      entityType: "Event",
      entityId: event.id,
      metadata: result,
    },
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/push.ts app/api/alerts/ app/api/push/
git commit -m "feat: Alert subscription and push notification API routes"
```

---

## Phase 3: Data Ingestion

### Task 15: Dedup Utility + INGV Parser

**Files:**
- Create: `lib/ingestion/dedup.ts`
- Create: `lib/ingestion/ingv.ts`
- Create: `tests/lib/dedup.test.ts`
- Create: `tests/lib/ingv.test.ts`

- [ ] **Step 1: Write failing test for dedup**

Create `tests/lib/dedup.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createDedupHash } from "@/lib/ingestion/dedup";

describe("createDedupHash", () => {
  it("should return consistent hash for same inputs", () => {
    const hash1 = createDedupHash("INGV", "Terremoto ML 3.2", "2026-03-24T14:32:00Z");
    const hash2 = createDedupHash("INGV", "Terremoto ML 3.2", "2026-03-24T14:32:00Z");
    expect(hash1).toBe(hash2);
  });

  it("should return different hash for different inputs", () => {
    const hash1 = createDedupHash("INGV", "Terremoto ML 3.2", "2026-03-24T14:32:00Z");
    const hash2 = createDedupHash("INGV", "Terremoto ML 2.1", "2026-03-24T08:15:00Z");
    expect(hash1).not.toBe(hash2);
  });

  it("should return a 64-char hex string (SHA-256)", () => {
    const hash = createDedupHash("INGV", "Test", "2026-01-01");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/dedup.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement dedup utility**

Create `lib/ingestion/dedup.ts`:

```typescript
import { createHash } from "crypto";

export function createDedupHash(source: string, title: string, date: string): string {
  return createHash("sha256").update(`${source}|${title}|${date}`).digest("hex");
}
```

- [ ] **Step 4: Run dedup test to verify pass**

```bash
npx vitest run tests/lib/dedup.test.ts
```

Expected: PASS — all 3 tests.

- [ ] **Step 5: Write failing test for INGV parser**

Create `tests/lib/ingv.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseINGVResponse } from "@/lib/ingestion/ingv";

const mockINGVGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        eventId: 12345,
        time: "2026-03-24T14:32:00.000Z",
        mag: 3.2,
        magType: "ML",
        place: "3 km SE Catania (CT)",
        depth: 10.0,
        author: "INGV",
        status: "reviewed",
        type: "earthquake",
      },
      geometry: {
        type: "Point",
        coordinates: [15.09, 37.5079, 10.0],
      },
    },
    {
      type: "Feature",
      properties: {
        eventId: 12346,
        time: "2026-03-24T08:15:00.000Z",
        mag: 1.5,
        magType: "ML",
        place: "5 km N Nicolosi (CT)",
        depth: 5.0,
        author: "INGV",
        status: "reviewed",
        type: "earthquake",
      },
      geometry: {
        type: "Point",
        coordinates: [14.9934, 37.751, 5.0],
      },
    },
  ],
};

describe("parseINGVResponse", () => {
  it("should parse features into normalized events", () => {
    const events = parseINGVResponse(mockINGVGeoJSON);
    expect(events).toHaveLength(2);
  });

  it("should extract correct fields from first event", () => {
    const events = parseINGVResponse(mockINGVGeoJSON);
    const first = events[0];
    expect(first.title).toContain("3.2");
    expect(first.lat).toBeCloseTo(37.5079);
    expect(first.lng).toBeCloseTo(15.09);
    expect(first.source).toBe("INGV");
    expect(first.category).toBe("TERREMOTO");
  });

  it("should calculate severity based on magnitude", () => {
    const events = parseINGVResponse(mockINGVGeoJSON);
    expect(events[0].severity).toBe("MEDIA"); // 3.2 → MEDIA
    expect(events[1].severity).toBe("BASSA"); // 1.5 → BASSA
  });

  it("should filter events below min magnitude (2.0)", () => {
    const filtered = parseINGVResponse(mockINGVGeoJSON, 2.0);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain("3.2");
  });

  it("should generate dedup hash", () => {
    const events = parseINGVResponse(mockINGVGeoJSON);
    expect(events[0].hashDedup).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

- [ ] **Step 6: Run INGV test to verify it fails**

```bash
npx vitest run tests/lib/ingv.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement INGV parser**

Create `lib/ingestion/ingv.ts`:

```typescript
import { createDedupHash } from "./dedup";

interface INGVFeature {
  properties: {
    eventId: number;
    time: string;
    mag: number;
    magType: string;
    place: string;
    depth: number;
    author: string;
    status: string;
    type: string;
  };
  geometry: {
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

interface INGVGeoJSON {
  type: string;
  features: INGVFeature[];
}

export interface ParsedEvent {
  title: string;
  category: "TERREMOTO" | "ERUZIONE";
  severity: "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
  description: string;
  source: string;
  sourceUrl: string;
  lat: number;
  lng: number;
  place: string;
  publishedAt: Date;
  hashDedup: string;
  rawJson: any;
}

function magnitudeToSeverity(mag: number): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  if (mag >= 5.0) return "CRITICA";
  if (mag >= 4.0) return "ALTA";
  if (mag >= 3.0) return "MEDIA";
  return "BASSA";
}

export function parseINGVResponse(data: INGVGeoJSON, minMagnitude = 0): ParsedEvent[] {
  return data.features
    .filter((f) => f.properties.mag >= minMagnitude)
    .map((feature) => {
      const { properties: p, geometry: g } = feature;
      const [lng, lat] = g.coordinates;
      const mag = p.mag;
      const publishedAt = new Date(p.time);

      return {
        title: `Terremoto ML ${mag.toFixed(1)} — ${p.place}`,
        category: "TERREMOTO" as const,
        severity: magnitudeToSeverity(mag),
        description: `Evento sismico di magnitudo ${p.magType} ${mag.toFixed(1)} localizzato a ${p.place}. Profondità: ${p.depth.toFixed(1)} km.`,
        source: "INGV",
        sourceUrl: `https://terremoti.ingv.it/event/${p.eventId}`,
        lat,
        lng,
        place: p.place,
        publishedAt,
        hashDedup: createDedupHash("INGV", String(p.eventId), p.time),
        rawJson: feature,
      };
    });
}

export const INGV_SICILIA_URL =
  "https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&minmagnitude=2.0&minlatitude=36&maxlatitude=38.5&minlongitude=11.5&maxlongitude=15.7&orderby=time&limit=50";

export async function fetchINGVEvents(): Promise<ParsedEvent[]> {
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${INGV_SICILIA_URL}&starttime=${startTime}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`INGV API error: ${response.status}`);
  }

  const data = await response.json();
  return parseINGVResponse(data, 2.0);
}
```

- [ ] **Step 8: Run INGV tests to verify pass**

```bash
npx vitest run tests/lib/ingv.test.ts
```

Expected: PASS — all 5 tests.

- [ ] **Step 9: Set up vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 10: Commit**

```bash
git add lib/ingestion/dedup.ts lib/ingestion/ingv.ts tests/lib/ vitest.config.ts
git commit -m "feat: INGV GeoJSON parser with dedup and unit tests"
```

---

### Task 16: Protezione Civile + ANAS Parsers

**Files:**
- Create: `lib/ingestion/protezione-civile.ts`
- Create: `lib/ingestion/anas.ts`
- Create: `tests/lib/protezione-civile.test.ts`
- Create: `tests/lib/anas.test.ts`

- [ ] **Step 1: Write failing test for PC parser**

Create `tests/lib/protezione-civile.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parsePCAlerts, PCAlertItem } from "@/lib/ingestion/protezione-civile";

const mockAlerts: PCAlertItem[] = [
  {
    name: "allerta_2026-03-24.json",
    date: "2026-03-24",
    zones: [
      { zone: "Sic-A", level: "arancione", phenomena: ["piogge", "temporali"] },
      { zone: "Sic-B", level: "gialla", phenomena: ["vento"] },
    ],
  },
];

describe("parsePCAlerts", () => {
  it("should parse alert zones into events", () => {
    const events = parsePCAlerts(mockAlerts);
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it("should map arancione to ALTA severity", () => {
    const events = parsePCAlerts(mockAlerts);
    const arancione = events.find((e) => e.title.includes("arancione"));
    expect(arancione?.severity).toBe("ALTA");
  });

  it("should map gialla to MEDIA severity", () => {
    const events = parsePCAlerts(mockAlerts);
    const gialla = events.find((e) => e.title.includes("gialla"));
    expect(gialla?.severity).toBe("MEDIA");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/protezione-civile.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement PC parser**

Create `lib/ingestion/protezione-civile.ts`:

```typescript
import { createDedupHash } from "./dedup";
import type { ParsedEvent } from "./ingv";

export interface PCAlertZone {
  zone: string;
  level: string;
  phenomena: string[];
}

export interface PCAlertItem {
  name: string;
  date: string;
  zones: PCAlertZone[];
}

const levelToSeverity: Record<string, "BASSA" | "MEDIA" | "ALTA" | "CRITICA"> = {
  verde: "BASSA",
  gialla: "MEDIA",
  arancione: "ALTA",
  rossa: "CRITICA",
};

const SICILIA_ZONE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "Sic-A": { lat: 37.5, lng: 15.1, name: "Sicilia orientale" },
  "Sic-B": { lat: 38.1, lng: 13.4, name: "Sicilia settentrionale" },
  "Sic-C": { lat: 37.3, lng: 13.6, name: "Sicilia centro-meridionale" },
};

export function parsePCAlerts(alerts: PCAlertItem[]): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  for (const alert of alerts) {
    for (const zone of alert.zones) {
      if (!zone.zone.startsWith("Sic")) continue;
      if (zone.level === "verde") continue;

      const coords = SICILIA_ZONE_COORDS[zone.zone] || { lat: 37.5, lng: 14.0, name: zone.zone };
      const severity = levelToSeverity[zone.level] || "MEDIA";

      events.push({
        title: `Allerta meteo ${zone.level} — ${coords.name}`,
        category: "ALLERTA",
        severity,
        description: `Allerta ${zone.level} per ${zone.phenomena.join(", ")} nella zona ${coords.name}. Data: ${alert.date}.`,
        source: "Protezione Civile",
        sourceUrl: "https://www.protezionecivile.gov.it/it/allerta-meteo",
        lat: coords.lat,
        lng: coords.lng,
        place: coords.name,
        publishedAt: new Date(alert.date),
        hashDedup: createDedupHash("PC", `${zone.zone}-${zone.level}`, alert.date),
        rawJson: { alert: alert.name, zone },
      });
    }
  }

  return events;
}

export async function fetchPCAlerts(): Promise<ParsedEvent[]> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Meteo-Regionali/contents/files/allerte",
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      console.warn(`PC API returned ${response.status}, using empty result`);
      return [];
    }

    const files = await response.json();

    // Get the most recent alert file
    const sortedFiles = Array.isArray(files)
      ? files.sort((a: any, b: any) => b.name.localeCompare(a.name)).slice(0, 3)
      : [];

    const alerts: PCAlertItem[] = [];

    for (const file of sortedFiles) {
      try {
        const contentRes = await fetch(file.download_url);
        const content = await contentRes.json();

        // Parse the DPC format — structure varies, adapt as needed
        if (content && content.zone) {
          const zones: PCAlertZone[] = Object.entries(content.zone)
            .filter(([key]) => key.startsWith("Sic"))
            .map(([key, val]: [string, any]) => ({
              zone: key,
              level: val.level || "verde",
              phenomena: val.phenomena || [],
            }));

          alerts.push({
            name: file.name,
            date: file.name.replace(/[^0-9-]/g, "").slice(0, 10),
            zones,
          });
        }
      } catch {
        // Skip malformed files
      }
    }

    return parsePCAlerts(alerts);
  } catch (error) {
    console.error("Error fetching PC alerts:", error);
    return [];
  }
}
```

- [ ] **Step 4: Run PC tests**

```bash
npx vitest run tests/lib/protezione-civile.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing test for ANAS parser**

Create `tests/lib/anas.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseANASRss } from "@/lib/ingestion/anas";

const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>A19 Palermo-Catania: lavori in corso - Sicilia</title>
      <link>https://www.stradeanas.it/comunicato/1</link>
      <description>Chiusura corsia autostrada A19 in Sicilia per lavori</description>
      <pubDate>Mon, 24 Mar 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>A1 Milano-Napoli: cantiere attivo</title>
      <link>https://www.stradeanas.it/comunicato/2</link>
      <description>Lavori di manutenzione ordinaria</description>
      <pubDate>Mon, 24 Mar 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("parseANASRss", () => {
  it("should filter only Sicilia-related items", () => {
    const events = parseANASRss(mockRssXml);
    expect(events).toHaveLength(1);
    expect(events[0].title).toContain("Sicilia");
  });

  it("should set category to TRAFFICO", () => {
    const events = parseANASRss(mockRssXml);
    expect(events[0].category).toBe("TRAFFICO");
  });

  it("should generate dedup hash", () => {
    const events = parseANASRss(mockRssXml);
    expect(events[0].hashDedup).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

- [ ] **Step 6: Implement ANAS RSS parser**

Create `lib/ingestion/anas.ts`:

```typescript
import { createDedupHash } from "./dedup";
import type { ParsedEvent } from "./ingv";

export function parseANASRss(xml: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  // Simple XML parsing without external dependency
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const description = extractTag(item, "description");
    const pubDate = extractTag(item, "pubDate");

    if (!title || !pubDate) continue;

    // Filter only Sicilia-related items
    const text = `${title} ${description}`.toLowerCase();
    if (!text.includes("sicilia") && !text.includes("siciliana") &&
        !text.includes("catania") && !text.includes("palermo") &&
        !text.includes("messina") && !text.includes("siracusa") &&
        !text.includes("trapani") && !text.includes("agrigento") &&
        !text.includes("ragusa") && !text.includes("caltanissetta") &&
        !text.includes("enna")) {
      continue;
    }

    events.push({
      title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
      category: "TRAFFICO",
      severity: "BASSA",
      description: description?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || title,
      source: "ANAS",
      sourceUrl: link || "https://www.stradeanas.it",
      lat: 37.5, // Default center of Sicily — no coords in RSS
      lng: 14.0,
      place: "Sicilia",
      publishedAt: new Date(pubDate),
      hashDedup: createDedupHash("ANAS", title, pubDate),
      rawJson: { title, link, description, pubDate },
    });
  }

  return events;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : "";
}

export async function fetchANASEvents(): Promise<ParsedEvent[]> {
  try {
    const response = await fetch(
      "https://www.stradeanas.it/it/le-strade/viabilit%C3%A0/comunicati-stampa/rss",
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      console.warn(`ANAS RSS returned ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseANASRss(xml);
  } catch (error) {
    console.error("Error fetching ANAS RSS:", error);
    return [];
  }
}
```

- [ ] **Step 7: Run ANAS tests**

```bash
npx vitest run tests/lib/anas.test.ts
```

Expected: PASS — all 3 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/ingestion/protezione-civile.ts lib/ingestion/anas.ts tests/lib/protezione-civile.test.ts tests/lib/anas.test.ts
git commit -m "feat: Protezione Civile and ANAS parsers with unit tests"
```

---

### Task 17: WordPress.com Sync

**Files:**
- Create: `lib/ingestion/wordpress.ts`

- [ ] **Step 1: Implement WordPress sync**

Create `lib/ingestion/wordpress.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
  };
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function syncWordPressPosts(): Promise<{ synced: number; errors: number }> {
  const siteId = process.env.WP_SITE_ID || "emergenzasicilia.wordpress.com";
  const url = `https://public-api.wordpress.com/wp/v2/sites/${siteId}/posts?per_page=50&status=publish&_embed`;

  let synced = 0;
  let errors = 0;

  try {
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) {
      console.warn(`WordPress API returned ${response.status}`);
      return { synced: 0, errors: 1 };
    }

    const posts: WPPost[] = await response.json();

    for (const post of posts) {
      try {
        const sanitizedContent = purify.sanitize(post.content.rendered);
        const imageUrl =
          post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;

        await prisma.editorialPost.upsert({
          where: { wpId: post.id },
          update: {
            title: stripHtml(post.title.rendered),
            slug: post.slug,
            summary: stripHtml(post.excerpt.rendered).slice(0, 300),
            content: sanitizedContent,
            publishedAt: new Date(post.date),
            readingTime: estimateReadingTime(sanitizedContent),
            imageUrl,
          },
          create: {
            wpId: post.id,
            title: stripHtml(post.title.rendered),
            slug: post.slug,
            summary: stripHtml(post.excerpt.rendered).slice(0, 300),
            content: sanitizedContent,
            type: "EDITORIALE",
            featured: false,
            paywall: "FREE",
            publishedAt: new Date(post.date),
            readingTime: estimateReadingTime(sanitizedContent),
            imageUrl,
          },
        });

        synced++;
      } catch (e) {
        console.error(`Error syncing post ${post.id}:`, e);
        errors++;
      }
    }
  } catch (error) {
    console.error("Error fetching WordPress posts:", error);
    return { synced: 0, errors: 1 };
  }

  return { synced, errors };
}
```

- [ ] **Step 2: Install jsdom for DOMPurify server-side**

```bash
npm install jsdom
npm install -D @types/jsdom
```

- [ ] **Step 3: Commit**

```bash
git add lib/ingestion/wordpress.ts package.json
git commit -m "feat: WordPress.com sync with DOMPurify sanitization"
```

---

### Task 18: Ingestion API Routes + GitHub Actions

**Files:**
- Create: `app/api/ingest/route.ts`
- Create: `app/api/ingest/wordpress/route.ts`
- Create: `.github/workflows/ingest-feeds.yml`
- Create: `.github/workflows/ingest-wordpress.yml`

- [ ] **Step 1: Create feed ingestion route**

Create `app/api/ingest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchINGVEvents } from "@/lib/ingestion/ingv";
import { fetchPCAlerts } from "@/lib/ingestion/protezione-civile";
import { fetchANASEvents } from "@/lib/ingestion/anas";
import { sendPushToMatching } from "@/lib/push";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { ingv: 0, pc: 0, anas: 0, errors: [] as string[] };

  // 1. INGV
  try {
    const ingvEvents = await fetchINGVEvents();
    for (const parsed of ingvEvents) {
      const existing = await prisma.sourceItem.findUnique({
        where: { hashDedup: parsed.hashDedup },
      });
      if (existing) continue;

      const sourceItem = await prisma.sourceItem.create({
        data: {
          source: "INGV",
          type: "API",
          title: parsed.title,
          text: parsed.description,
          url: parsed.sourceUrl,
          publishedAt: parsed.publishedAt,
          hashDedup: parsed.hashDedup,
          rawJson: parsed.rawJson,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: parsed.title,
          category: parsed.category,
          severity: parsed.severity,
          description: parsed.description,
          source: parsed.source,
          sourceUrl: parsed.sourceUrl,
          lat: parsed.lat,
          lng: parsed.lng,
          publishedAt: parsed.publishedAt,
          tags: ["terremoto", "ingv"],
          sourceItemId: sourceItem.id,
        },
      });

      // Auto-push for ALTA/CRITICA
      if (parsed.severity === "ALTA" || parsed.severity === "CRITICA") {
        await sendPushToMatching(event);
      }

      results.ingv++;
    }
  } catch (e: any) {
    results.errors.push(`INGV: ${e.message}`);
  }

  // 2. Protezione Civile
  try {
    const pcEvents = await fetchPCAlerts();
    for (const parsed of pcEvents) {
      const existing = await prisma.sourceItem.findUnique({
        where: { hashDedup: parsed.hashDedup },
      });
      if (existing) continue;

      const sourceItem = await prisma.sourceItem.create({
        data: {
          source: "PC",
          type: "API",
          title: parsed.title,
          text: parsed.description,
          url: parsed.sourceUrl,
          publishedAt: parsed.publishedAt,
          hashDedup: parsed.hashDedup,
          rawJson: parsed.rawJson,
        },
      });

      const event = await prisma.event.create({
        data: {
          title: parsed.title,
          category: parsed.category,
          severity: parsed.severity,
          description: parsed.description,
          source: parsed.source,
          sourceUrl: parsed.sourceUrl,
          lat: parsed.lat,
          lng: parsed.lng,
          publishedAt: parsed.publishedAt,
          tags: ["allerta", "protezione-civile"],
          sourceItemId: sourceItem.id,
        },
      });

      if (parsed.severity === "ALTA" || parsed.severity === "CRITICA") {
        await sendPushToMatching(event);
      }

      results.pc++;
    }
  } catch (e: any) {
    results.errors.push(`PC: ${e.message}`);
  }

  // 3. ANAS
  try {
    const anasEvents = await fetchANASEvents();
    for (const parsed of anasEvents) {
      const existing = await prisma.sourceItem.findUnique({
        where: { hashDedup: parsed.hashDedup },
      });
      if (existing) continue;

      const sourceItem = await prisma.sourceItem.create({
        data: {
          source: "ANAS",
          type: "RSS",
          title: parsed.title,
          text: parsed.description,
          url: parsed.sourceUrl,
          publishedAt: parsed.publishedAt,
          hashDedup: parsed.hashDedup,
          rawJson: parsed.rawJson,
        },
      });

      await prisma.event.create({
        data: {
          title: parsed.title,
          category: "TRAFFICO",
          severity: parsed.severity,
          description: parsed.description,
          source: "ANAS",
          sourceUrl: parsed.sourceUrl,
          lat: parsed.lat,
          lng: parsed.lng,
          publishedAt: parsed.publishedAt,
          tags: ["traffico", "anas"],
          sourceItemId: sourceItem.id,
        },
      });

      results.anas++;
    }
  } catch (e: any) {
    results.errors.push(`ANAS: ${e.message}`);
  }

  // 4. Cleanup old SourceItems (>30 days)
  await prisma.sourceItem.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  return NextResponse.json(results);
}
```

- [ ] **Step 2: Create WordPress sync route**

Create `app/api/ingest/wordpress/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { syncWordPressPosts } from "@/lib/ingestion/wordpress";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncWordPressPosts();
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Create GitHub Actions workflows**

Create `.github/workflows/ingest-feeds.yml`:

```yaml
name: Ingest feeds (ogni 15 min)

on:
  schedule:
    - cron: "*/15 * * * *"
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger feed ingestion
        run: |
          curl -f -X POST \
            -H "x-ingest-secret: ${{ secrets.INGEST_SECRET }}" \
            ${{ secrets.APP_URL }}/api/ingest
```

Create `.github/workflows/ingest-wordpress.yml`:

```yaml
name: Sync WordPress editoriali (ogni 30 min)

on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:

jobs:
  sync-wp:
    runs-on: ubuntu-latest
    steps:
      - name: Sync WordPress.com posts
        run: |
          curl -f -X POST \
            -H "x-ingest-secret: ${{ secrets.INGEST_SECRET }}" \
            ${{ secrets.APP_URL }}/api/ingest/wordpress
```

- [ ] **Step 4: Commit**

```bash
git add app/api/ingest/ .github/
git commit -m "feat: ingestion API routes and GitHub Actions cron workflows"
```

---

## Phase 4: Public Pages

### Task 19: Home Page

**Files:**
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx`

- [ ] **Step 1: Create public layout with TopBar + Footer**

Create `app/[locale]/layout.tsx`:

```typescript
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create Home page**

Create `app/[locale]/page.tsx`:

```typescript
import { prisma } from "@/lib/prisma";
import { EventList } from "@/components/events/event-list";
import { SeverityBadge } from "@/components/events/severity-badge";
import Link from "next/link";

const categoryIcons: Record<string, string> = {
  TERREMOTO: "🔴",
  MALTEMPO: "🌧",
  TRAFFICO: "🚗",
  ERUZIONE: "🌋",
  INCENDIO: "🔥",
  ALLERTA: "⚠️",
  TRASPORTI: "🚂",
};

export const revalidate = 60; // ISR every 60 seconds

export default async function HomePage() {
  const [events, feedItems, editorials, stats] = await Promise.all([
    prisma.event.findMany({
      where: { status: { not: "CHIUSO" } },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
    prisma.sourceItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.editorialPost.findMany({
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        type: true,
        featured: true,
        paywall: true,
        publishedAt: true,
        readingTime: true,
        imageUrl: true,
      },
    }),
    prisma.event.groupBy({
      by: ["category"],
      where: { status: { not: "CHIUSO" } },
      _count: true,
    }),
  ]);

  // Calculate overall severity
  const maxSeverity = events.reduce((max, e) => {
    const order = ["BASSA", "MEDIA", "ALTA", "CRITICA"];
    return order.indexOf(e.severity) > order.indexOf(max) ? e.severity : max;
  }, "BASSA" as string);

  const featured = editorials.find((e) => e.featured);
  const otherEditorials = editorials.filter((e) => !e.featured).slice(0, 3);

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* Hero: Stato attuale */}
      <section className="bg-es-bg rounded-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-h2 font-heading text-es-text">Situazione in tempo reale</h1>
          <SeverityBadge severity={maxSeverity as any} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(categoryIcons).map(([cat, icon]) => {
            const count = stats.find((s) => s.category === cat)?._count || 0;
            return (
              <div key={cat} className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-h3 font-heading text-es-text">{count}</div>
                <div className="text-caption text-es-text-secondary capitalize">
                  {cat.toLowerCase()}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: Events */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 font-heading text-es-text">Eventi attivi</h2>
            <Link
              href="/mappa"
              className="text-es-blue text-sm font-heading font-semibold hover:underline"
            >
              Vedi mappa →
            </Link>
          </div>
          <EventList
            events={events.map((e) => ({
              ...e,
              publishedAt: e.publishedAt.toISOString(),
            }))}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Quick Alert */}
          <div className="bg-es-blue/5 rounded-card p-4 border border-es-blue/20">
            <h3 className="text-h3 font-heading text-es-text mb-2">Imposta Alert</h3>
            <p className="text-sm text-es-text-secondary mb-3 font-body">
              Ricevi notifiche per le emergenze nella tua zona.
            </p>
            <Link
              href="/alert"
              className="block bg-es-blue text-white text-center py-2 rounded-lg font-heading font-semibold text-sm hover:bg-es-blue-hover transition-colors duration-150"
            >
              Configura alert
            </Link>
          </div>

          {/* Feed ufficiali */}
          <div>
            <h3 className="text-h3 font-heading text-es-text mb-3">Fonti ufficiali</h3>
            <div className="space-y-2">
              {feedItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-es-bg rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold">
                      {item.source}
                    </span>
                    <time className="text-caption text-es-text-secondary">
                      {item.publishedAt.toLocaleDateString("it-IT")}
                    </time>
                  </div>
                  <p className="text-sm font-body text-es-text line-clamp-2">{item.title}</p>
                </a>
              ))}
            </div>
            <Link
              href="/fonti"
              className="block text-es-blue text-sm font-heading font-semibold mt-2 hover:underline"
            >
              Tutte le fonti →
            </Link>
          </div>
        </aside>
      </div>

      {/* Editorial section — full width, prominent */}
      {editorials.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-heading text-es-text">Editoriale</h2>
            <Link
              href="/editoriale"
              className="text-es-blue text-sm font-heading font-semibold hover:underline"
            >
              Tutti gli articoli →
            </Link>
          </div>

          {/* Featured article */}
          {featured && (
            <Link href={`/editoriale/${featured.slug}`}>
              <article className="relative bg-es-bg rounded-card overflow-hidden mb-6 grid grid-cols-1 md:grid-cols-2 gap-0 hover:shadow-lg transition-shadow duration-200">
                {featured.imageUrl && (
                  <div
                    className="h-48 md:h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${featured.imageUrl})` }}
                  />
                )}
                <div className="p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold">
                      {featured.type}
                    </span>
                    {featured.paywall === "PREMIUM" && (
                      <span className="text-xs bg-es-yellow/20 text-es-yellow px-2 py-0.5 rounded-chip font-heading font-semibold">
                        Premium
                      </span>
                    )}
                  </div>
                  <h3 className="text-h2 font-heading text-es-text mb-2">{featured.title}</h3>
                  <p className="text-body text-es-text-secondary font-body mb-4 line-clamp-3">
                    {featured.summary}
                  </p>
                  <div className="text-caption text-es-text-secondary font-body">
                    {featured.readingTime} min di lettura · {new Date(featured.publishedAt).toLocaleDateString("it-IT")}
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Other editorials — 3-col grid */}
          {otherEditorials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherEditorials.map((post) => (
                <Link key={post.id} href={`/editoriale/${post.slug}`}>
                  <article className="bg-es-bg rounded-card overflow-hidden hover:shadow-md transition-shadow duration-150">
                    {post.imageUrl && (
                      <div
                        className="h-36 bg-cover bg-center"
                        style={{ backgroundImage: `url(${post.imageUrl})` }}
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-es-text-secondary font-body">{post.type}</span>
                        {post.paywall === "PREMIUM" && (
                          <span className="text-xs bg-es-yellow/20 text-es-yellow px-1.5 py-0.5 rounded font-heading font-semibold">
                            Premium
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-semibold text-sm text-es-text mb-1 line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-caption text-es-text-secondary font-body line-clamp-2">
                        {post.summary}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify home page renders**

```bash
npm run dev
```

Visit http://localhost:3000 — should render hero with category counts, event list, sidebar, editorial section.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/
git commit -m "feat: Home page with hero, events, feed sidebar, editorial section"
```

---

### Task 20: Map Page

**Files:**
- Create: `components/map/map-view.tsx`
- Create: `components/map/map-popup.tsx`
- Create: `app/[locale]/mappa/page.tsx`

- [ ] **Step 1: Create MapView component (dynamic import, SSR-safe)**

Create `components/map/map-view.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { FilterChips } from "@/components/events/filter-chips";

interface MapEvent {
  id: string;
  title: string;
  category: string;
  severity: string;
  lat: number | null;
  lng: number | null;
  source: string;
  publishedAt: string;
}

interface MapViewProps {
  events: MapEvent[];
}

const severityColors: Record<string, string> = {
  BASSA: "#2C6B2F",
  MEDIA: "#F5A623",
  ALTA: "#D0021B",
  CRITICA: "#D0021B",
};

export default function MapView({ events }: MapViewProps) {
  const [L, setL] = useState<any>(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
    ]).then(([leaflet]) => {
      setL(leaflet.default);
    });
  }, []);

  const filtered = filter === "ALL"
    ? events
    : events.filter((e) => e.category === filter);

  const geoEvents = filtered.filter((e) => e.lat && e.lng);

  if (!L) {
    return (
      <div className="h-[calc(100vh-56px)] bg-es-bg flex items-center justify-center">
        <div className="skeleton-shimmer w-full h-full" />
      </div>
    );
  }

  // We need to render this client-side only
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <div className="p-3 bg-white border-b border-es-border">
        <FilterChips selected={filter} onSelect={setFilter} />
      </div>
      <div className="flex-1 relative">
        <LeafletMap events={geoEvents} severityColors={severityColors} />
      </div>
    </div>
  );
}

// Separate component for actual Leaflet rendering
function LeafletMap({ events, severityColors }: { events: MapEvent[]; severityColors: Record<string, string> }) {
  const { MapContainer, TileLayer, CircleMarker, Popup } = require("react-leaflet");

  return (
    <MapContainer
      center={[37.6, 14.0]}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <CircleMarker
          key={event.id}
          center={[event.lat!, event.lng!]}
          radius={event.severity === "CRITICA" ? 12 : event.severity === "ALTA" ? 10 : 8}
          fillColor={severityColors[event.severity] || "#0056A0"}
          fillOpacity={0.7}
          stroke
          color={severityColors[event.severity] || "#0056A0"}
          weight={2}
        >
          <Popup>
            <div className="font-body text-sm max-w-xs">
              <h4 className="font-heading font-semibold text-sm mb-1">{event.title}</h4>
              <p className="text-es-text-secondary text-xs mb-2">
                Fonte: {event.source} · {new Date(event.publishedAt).toLocaleString("it-IT")}
              </p>
              <a
                href={`/eventi/${event.id}`}
                className="text-es-blue text-xs font-heading font-semibold hover:underline"
              >
                Dettagli →
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
```

- [ ] **Step 2: Create map page**

Create `app/[locale]/mappa/page.tsx`:

```typescript
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-56px)] bg-es-bg skeleton-shimmer" />
  ),
});

export const revalidate = 30;

export default async function MapPage() {
  const events = await prisma.event.findMany({
    where: {
      status: { not: "CHIUSO" },
      lat: { not: null },
      lng: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      severity: true,
      lat: true,
      lng: true,
      source: true,
      publishedAt: true,
    },
  });

  return (
    <MapView
      events={events.map((e) => ({
        ...e,
        publishedAt: e.publishedAt.toISOString(),
      }))}
    />
  );
}
```

- [ ] **Step 3: Add Leaflet CSS to root layout**

Add to `app/layout.tsx` in the `<head>`:
```html
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossOrigin=""
/>
```

- [ ] **Step 4: Verify map renders**

Visit http://localhost:3000/mappa — should show Sicily map with colored markers.

- [ ] **Step 5: Commit**

```bash
git add components/map/ app/\[locale\]/mappa/ app/layout.tsx
git commit -m "feat: interactive Leaflet map page with filtered markers"
```

---

### Task 21: Event Detail Page

**Files:**
- Create: `app/[locale]/eventi/[id]/page.tsx`

- [ ] **Step 1: Create event detail page**

Create `app/[locale]/eventi/[id]/page.tsx`:

```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SeverityBadge } from "@/components/events/severity-badge";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return {};
  return {
    title: `${event.title} — Emergenza Sicilia`,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      type: "article",
    },
  };
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      sourceItem: true,
      reports: {
        where: { status: "APPROVATO" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  // Related editorials (by category tag)
  const relatedEditorials = await prisma.editorialPost.findMany({
    where: { paywall: "FREE" },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { id: true, title: true, slug: true, summary: true, readingTime: true },
  });

  const categoryLabels: Record<string, string> = {
    TERREMOTO: "Terremoto", MALTEMPO: "Maltempo", TRAFFICO: "Traffico",
    ERUZIONE: "Eruzione", INCENDIO: "Incendio", ALLERTA: "Allerta", TRASPORTI: "Trasporti",
  };

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-es-blue/10 text-es-blue text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
            {categoryLabels[event.category] || event.category}
          </span>
          <SeverityBadge severity={event.severity} />
          <span className={`text-xs px-2 py-0.5 rounded-chip font-heading font-semibold ${
            event.status === "CHIUSO" ? "bg-gray-200 text-gray-600" :
            event.status === "MONITORAGGIO" ? "bg-es-yellow/10 text-es-yellow" :
            "bg-es-green/10 text-es-green"
          }`}>
            {event.status}
          </span>
        </div>
        <h1 className="text-h1 font-heading text-es-text mb-2">{event.title}</h1>
        <div className="flex items-center gap-4 text-sm text-es-text-secondary font-body">
          <span>Fonte: {event.source}</span>
          <time dateTime={event.publishedAt.toISOString()}>
            {event.publishedAt.toLocaleString("it-IT")}
          </time>
          {event.provincia && <span>{event.comune ? `${event.comune} (${event.provincia})` : event.provincia}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-es-bg rounded-card p-6">
            <p className="text-body font-body text-es-text leading-relaxed">{event.description}</p>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-es-blue text-sm font-heading font-semibold hover:underline"
              >
                Fonte originale →
              </a>
            )}
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span key={tag} className="bg-es-bg text-es-text-secondary text-xs px-2 py-1 rounded font-body">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Approved reports */}
          {event.reports.length > 0 && (
            <div>
              <h2 className="text-h3 font-heading text-es-text mb-3">Segnalazioni verificate</h2>
              <div className="space-y-3">
                {event.reports.map((report) => (
                  <div key={report.id} className="bg-es-bg rounded-card p-4 border-l-4 border-l-es-green">
                    <p className="text-sm font-body text-es-text mb-2">{report.text}</p>
                    <time className="text-caption text-es-text-secondary font-body">
                      {report.createdAt.toLocaleString("it-IT")}
                    </time>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* CTA Alert */}
          <div className="bg-es-blue/5 rounded-card p-4 border border-es-blue/20">
            <h3 className="text-h3 font-heading text-es-text mb-2">Ricevi alert</h3>
            <p className="text-sm text-es-text-secondary font-body mb-3">
              Attiva le notifiche per eventi di tipo {categoryLabels[event.category]?.toLowerCase()}{event.provincia ? ` in provincia di ${event.provincia}` : ""}.
            </p>
            <Link
              href="/alert"
              className="block bg-es-blue text-white text-center py-2 rounded-lg font-heading font-semibold text-sm hover:bg-es-blue-hover transition-colors"
            >
              Imposta alert
            </Link>
          </div>

          {/* Related editorials */}
          {relatedEditorials.length > 0 && (
            <div>
              <h3 className="text-h3 font-heading text-es-text mb-3">Approfondimenti</h3>
              <div className="space-y-3">
                {relatedEditorials.map((post) => (
                  <Link key={post.id} href={`/editoriale/${post.slug}`}>
                    <div className="bg-es-bg rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <h4 className="font-heading font-semibold text-sm text-es-text line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <span className="text-caption text-es-text-secondary font-body">
                        {post.readingTime} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div>
            <h3 className="text-h3 font-heading text-es-text mb-2">Condividi</h3>
            <button
              className="bg-es-bg text-es-text-secondary text-sm px-4 py-2 rounded-lg font-body hover:bg-es-border transition-colors w-full"
              onClick={() => {}}
            >
              Copia link
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\[locale\]/eventi/
git commit -m "feat: Event detail page with reports, CTA, related articles"
```

---

### Task 22: Fonti + Editoriale Pages

**Files:**
- Create: `app/[locale]/fonti/page.tsx`
- Create: `app/[locale]/editoriale/page.tsx`
- Create: `app/[locale]/editoriale/[slug]/page.tsx`

- [ ] **Step 1: Create Fonti page**

Create `app/[locale]/fonti/page.tsx` — page listing all official sources with their recent items (fetching from `/api/sources` or directly from Prisma). Server component that renders SOURCE_INFO with recent SourceItems.

- [ ] **Step 2: Create Editoriale list page**

Create `app/[locale]/editoriale/page.tsx` — grid of editorial cards with type filter chips. Featured article at top. Premium badge on paywall articles.

- [ ] **Step 3: Create single article page with paywall**

Create `app/[locale]/editoriale/[slug]/page.tsx` — full article with SEO metadata (generateMetadata), reading time, type badge. If `paywall === "PREMIUM"` and user not premium, show first paragraph + blur + CTA to `/premium`. DOMPurify the content before render.

- [ ] **Step 4: Verify pages render**

Visit `/fonti`, `/editoriale`, `/editoriale/ciclone-harry-cosa-abbiamo-imparato` in browser.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/fonti/ app/\[locale\]/editoriale/
git commit -m "feat: Fonti and Editoriale pages with paywall"
```

---

## Phase 5: User Features

### Task 23: Segnalazioni Page

**Files:**
- Create: `components/reports/report-form.tsx`
- Create: `app/[locale]/segnala/page.tsx`

- [ ] **Step 1: Create ReportForm component**

Create `components/reports/report-form.tsx` — client component with:
- Textarea (max 500 chars, char counter)
- File input for media (jpg/png/mp4, max 5MB) — upload via multipart to `/api/reports`
- Optional geolocation button (navigator.geolocation, opt-in)
- Submit button with loading state
- Success/error feedback (status: "In verifica")
- Form validation with Zod client-side

- [ ] **Step 2: Create Segnala page**

Create `app/[locale]/segnala/page.tsx` — wrapper with explanatory text ("La tua segnalazione sarà verificata...") + ReportForm.

- [ ] **Step 3: Verify form submission works**

Submit a test report and verify it appears in Prisma Studio with status NUOVO.

- [ ] **Step 4: Commit**

```bash
git add components/reports/ app/\[locale\]/segnala/
git commit -m "feat: report submission form with geolocation and validation"
```

---

### Task 24: Alert Page + PWA

**Files:**
- Create: `components/alerts/alert-form.tsx`
- Create: `components/alerts/push-permission.tsx`
- Create: `app/[locale]/alert/page.tsx`
- Create: `public/manifest.json`
- Create: `public/sw.js`

- [ ] **Step 1: Create AlertForm component**

Create `components/alerts/alert-form.tsx` — client component with:
- Multi-select checkboxes for categories
- Multi-select for provinces (dropdown with all 9 Sicilian provinces)
- Min severity select (BASSA/MEDIA/ALTA/CRITICA)
- PushPermission sub-component for browser notification permission
- Submit to `/api/alerts/subscribe`

- [ ] **Step 2: Create PushPermission component**

Create `components/alerts/push-permission.tsx` — handles `Notification.requestPermission()`, subscribes to push via `registration.pushManager.subscribe()` with VAPID public key. Returns PushSubscription keys for API.

- [ ] **Step 3: Create Alert page**

Create `app/[locale]/alert/page.tsx` — AlertForm + explanation text.

- [ ] **Step 4: Create PWA manifest**

Create `public/manifest.json`:

```json
{
  "name": "Emergenza Sicilia",
  "short_name": "EmergenzaSI",
  "description": "Informazione in tempo reale sulle emergenze in Sicilia",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#0056A0",
  "icons": [
    { "src": "/logo_emergenza_sicilia.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo_emergenza_sicilia.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 5: Create Service Worker**

Create `public/sw.js`:

```javascript
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Emergenza Sicilia", {
      body: data.body || "Nuovo aggiornamento",
      icon: "/logo_emergenza_sicilia.png",
      badge: "/logo_emergenza_sicilia.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});

// Basic cache for offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("es-v1").then((cache) =>
      cache.addAll(["/", "/manifest.json", "/logo_emergenza_sicilia.png"])
    )
  );
});
```

- [ ] **Step 6: Register service worker in root layout**

Add script to `app/layout.tsx`:
```html
<script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')` }} />
```

- [ ] **Step 7: Commit**

```bash
git add components/alerts/ app/\[locale\]/alert/ public/manifest.json public/sw.js app/layout.tsx
git commit -m "feat: alert preferences, push notifications, PWA manifest and service worker"
```

---

### Task 25: Premium + Privacy Pages

**Files:**
- Create: `app/[locale]/premium/page.tsx`
- Create: `app/[locale]/privacy/page.tsx`

- [ ] **Step 1: Create Premium page**

Create `app/[locale]/premium/page.tsx` — pricing card (Free vs Premium), feature comparison table, mock "Abbonati" CTA button (no Stripe integration). Premium features: all editorials, advanced alerts, no sponsor banners.

- [ ] **Step 2: Create Privacy page**

Create `app/[locale]/privacy/page.tsx` — GDPR-compliant privacy policy with: titolare trattamento, dati raccolti, finalità, base giuridica, periodo conservazione, diritti interessato, contatti DPO.

- [ ] **Step 3: Create GDPR account deletion endpoint**

Create `app/api/user/me/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ deleted: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/premium/ app/\[locale\]/privacy/ app/api/user/
git commit -m "feat: Premium pricing page, GDPR privacy page, account deletion endpoint"
```

---

## Phase 6: Admin Panel

### Task 26: Admin Layout + Login + Dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/page.tsx`
- Create: `components/admin/kpi-cards.tsx`

- [ ] **Step 1: Create Admin login page**

Create `app/admin/login/page.tsx` — brand-styled login form with email/password, calls `signIn("credentials", ...)`. Error handling for invalid credentials.

- [ ] **Step 2: Create Admin layout with sidebar**

Create `app/admin/layout.tsx` — sidebar navigation with links to all admin sections: Dashboard, Eventi, Segnalazioni, Editoriali, Sponsor, Alert (Push), Audit. Brand logo at top. Logout button. Uses the admin auth check via middleware.

- [ ] **Step 3: Create Admin dashboard**

Create `app/admin/page.tsx` — server component with KPI cards:
- N. eventi attivi
- N. segnalazioni in coda (status NUOVO)
- N. feed ingestiti oggi (SourceItem createdAt >= today)
- N. subscriber alert

Plus tables: 5 recent events, urgent reports (score > 60, status NUOVO), quick action "Crea evento manuale" button.

- [ ] **Step 4: Commit**

```bash
git add app/admin/ components/admin/
git commit -m "feat: admin layout, login, dashboard with KPIs"
```

---

### Task 27: Admin Events CRUD

**Files:**
- Create: `app/admin/eventi/page.tsx`
- Create: `components/admin/event-form.tsx`

- [ ] **Step 1: Create events admin page**

Create `app/admin/eventi/page.tsx` — table of all events with search, filters (category, status). "Crea evento" button opens dialog/form. Each row has "Modifica" and "Chiudi" actions. Uses Prisma server queries + client actions via fetch to API routes.

- [ ] **Step 2: Create EventForm component**

Create `components/admin/event-form.tsx` — form with all Event fields (title, category select, severity select, description textarea, source, coordinates, comune, provincia, tags). Used for both create and edit. Calls POST /api/events or PATCH /api/events/[id].

- [ ] **Step 3: Commit**

```bash
git add app/admin/eventi/ components/admin/event-form.tsx
git commit -m "feat: admin events CRUD page"
```

---

### Task 28: Admin Segnalazioni Moderation

**Files:**
- Create: `app/admin/segnalazioni/page.tsx`
- Create: `components/admin/moderation-panel.tsx`

- [ ] **Step 1: Create moderation page**

Create `app/admin/segnalazioni/page.tsx` — split panel layout:
- Left: list of reports with tabs (Tutti/Nuovo/In verifica/Approvati/Rifiutati), score bar, text preview
- Right: detail panel with full text, media, mini map if coords, score breakdown, "Collega a evento" select, moderation note textarea, Approva/Rifiuta/Metti in verifica buttons
- Each action calls PATCH `/api/admin/reports/[id]`

- [ ] **Step 2: Commit**

```bash
git add app/admin/segnalazioni/ components/admin/moderation-panel.tsx
git commit -m "feat: admin report moderation panel with split view"
```

---

### Task 29: Admin Editoriali + Sponsor + Push + Audit

**Files:**
- Create: `app/admin/editoriali/page.tsx`
- Create: `app/admin/sponsor/page.tsx`
- Create: `app/admin/alert/page.tsx`
- Create: `app/admin/audit/page.tsx`
- Create: `components/admin/sponsor-form.tsx`
- Create: `components/admin/audit-table.tsx`

- [ ] **Step 1: Create Editoriali admin page**

Create `app/admin/editoriali/page.tsx` — table of cached WP posts with toggle paywall (FREE/PREMIUM), toggle featured, "Force sync" button that calls POST `/api/ingest/wordpress`.

- [ ] **Step 2: Create Sponsor admin page**

Create `app/admin/sponsor/page.tsx` + `components/admin/sponsor-form.tsx` — CRUD for SponsorBanner: position select, image URL, link URL, active toggle, date range.

- [ ] **Step 3: Create Push simulation page**

Create `app/admin/alert/page.tsx` — select event from list, preview push message, "Invia" button calls POST `/api/push/send`. Shows log of last 10 push sends from AuditLog.

- [ ] **Step 4: Create Audit log page**

Create `app/admin/audit/page.tsx` + `components/admin/audit-table.tsx` — paginated table of AuditLog entries with filters: admin, action type, entity type, date range.

- [ ] **Step 5: Commit**

```bash
git add app/admin/editoriali/ app/admin/sponsor/ app/admin/alert/ app/admin/audit/ components/admin/
git commit -m "feat: admin pages for editoriali, sponsor, push sim, audit log"
```

---

## Phase 7: i18n + SEO + Polish

### Task 30: i18n Setup (next-intl)

**Files:**
- Create: `i18n/request.ts`
- Create: `i18n/routing.ts`
- Create: `messages/it.json`
- Create: `messages/en.json`
- Modify: `middleware.ts`
- Modify: `next.config.mjs`

- [ ] **Step 1: Create i18n config**

Create `i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
});
```

Create `i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 2: Create Italian translations**

Create `messages/it.json` — all UI labels, buttons, headings, status messages in Italian.

- [ ] **Step 3: Create English translations**

Create `messages/en.json` — all UI labels translated to English.

- [ ] **Step 4: Update middleware for i18n + admin auth**

Update `middleware.ts` to combine next-intl locale detection with admin auth guard. Admin routes skip locale prefix.

- [ ] **Step 5: Update next.config.mjs**

Add next-intl plugin to `next.config.mjs`:

```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Update components to use `useTranslations()`**

Replace hardcoded Italian strings in TopBar, Footer, FilterChips, and other client components with `useTranslations()` hook.

- [ ] **Step 7: Verify locale switching**

Visit `/en` — should show English UI. `/` — should show Italian.

- [ ] **Step 8: Commit**

```bash
git add i18n/ messages/ middleware.ts next.config.mjs components/
git commit -m "feat: i18n with next-intl (IT/EN) for all UI labels"
```

---

### Task 31: SEO (Metadata, Sitemap, Robots)

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Modify: various pages to add `generateMetadata`

- [ ] **Step 1: Create dynamic sitemap**

Create `app/sitemap.ts`:

```typescript
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://emergenza-sicilia.vercel.app";

  const events = await prisma.event.findMany({
    where: { status: { not: "CHIUSO" } },
    select: { id: true, updatedAt: true },
  });

  const editorials = await prisma.editorialPost.findMany({
    select: { slug: true, syncedAt: true },
  });

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "always", priority: 1 },
    { url: `${baseUrl}/mappa`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/fonti`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/editoriale`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/segnala`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/alert`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/premium`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    ...events.map((e) => ({
      url: `${baseUrl}/eventi/${e.id}`,
      lastModified: e.updatedAt,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...editorials.map((e) => ({
      url: `${baseUrl}/editoriale/${e.slug}`,
      lastModified: e.syncedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
```

- [ ] **Step 2: Create robots.ts**

Create `app/robots.ts`:

```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${process.env.NEXTAUTH_URL || "https://emergenza-sicilia.vercel.app"}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Add generateMetadata to key pages**

Ensure all public pages have `generateMetadata` with title, description, openGraph, and twitter card properties.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: SEO sitemap, robots.txt, metadata for all public pages"
```

---

### Task 32: Reliability Score Tests

**Files:**
- Create: `tests/lib/reliability.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/reliability.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calculateReliability } from "@/lib/reliability";

describe("calculateReliability", () => {
  it("should return 0 for minimal anonymous submission", () => {
    const score = calculateReliability({
      hasLocation: false,
      hasMedia: false,
      isRegistered: false,
      isFirstSubmission: false,
      textLength: 10,
    });
    expect(score).toBe(0);
  });

  it("should return max 90 for full verified submission", () => {
    const score = calculateReliability({
      hasLocation: true,
      hasMedia: true,
      isRegistered: true,
      isFirstSubmission: true,
      textLength: 100,
    });
    expect(score).toBe(90);
  });

  it("should subtract 10 for short text", () => {
    const withShort = calculateReliability({
      hasLocation: true,
      hasMedia: false,
      isRegistered: false,
      isFirstSubmission: false,
      textLength: 20,
    });
    expect(withShort).toBe(20); // 30 - 10
  });

  it("should never go below 0", () => {
    const score = calculateReliability({
      hasLocation: false,
      hasMedia: false,
      isRegistered: false,
      isFirstSubmission: false,
      textLength: 5,
    });
    expect(score).toBe(0);
  });

  it("should never exceed 100", () => {
    const score = calculateReliability({
      hasLocation: true,
      hasMedia: true,
      isRegistered: true,
      isFirstSubmission: true,
      textLength: 200,
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run tests/lib/reliability.test.ts
```

Expected: PASS — all 5 tests.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/reliability.test.ts
git commit -m "test: reliability score unit tests"
```

---

### Task 33: Run All Tests + Fix Issues

**Files:**
- Modify: various files if tests fail

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (dedup, INGV, PC, ANAS, reliability).

- [ ] **Step 2: Fix any failing tests**

If any test fails, fix the implementation or test.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: all unit tests passing"
```

---

### Task 34: README + Deploy Config

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md` with:
- Project description (copy from spec)
- Stack overview
- Setup instructions (clone, env vars, database, seed, dev)
- Deploy instructions (Vercel + Neon + GitHub Actions)
- Environment variables documentation
- API endpoints summary
- Brand guidelines reference

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes without errors.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README with setup, deploy, and API documentation"
```

---

### Task 35: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Test key flows manually**

1. Home page loads with events
2. Map shows markers
3. Event detail page renders
4. Report form submits
5. Admin login works
6. Admin can moderate reports
7. `/en` shows English UI

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Emergenza Sicilia MVP complete"
```
