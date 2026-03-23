# Emergenza Sicilia — Design Spec

**Data:** 2026-03-23
**Stato:** Approvato
**Tipo:** MVP production-ready monorepo

---

## 1. Visione del prodotto

Emergenza Sicilia è un portale di informazione in tempo reale sulle emergenze improvvise in Sicilia (terremoti, maltempo, traffico/incidenti, eruzioni/attività Etna, incendi, allerte protezione civile, criticità trasporti). Nasce dopo eventi estremi come il ciclone Harry, che hanno evidenziato la vulnerabilità dell'isola su meteo e viabilità.

**Obiettivi:**
- Centralizzare fonti ufficiali (INGV, Protezione Civile, ANAS)
- Mostrare eventi geolocalizzati su mappa interattiva
- Supportare segnalazioni dei lettori con flusso di verifica anti-fake
- Abilitare alert personalizzati (PWA + web push) per categorie e aree
- Supportare turisti con interfaccia IT/EN
- Monetizzazione freemium + premium + sponsor

---

## 2. Stack tecnico

| Layer | Tecnologia | Hosting | Piano |
|-------|-----------|---------|-------|
| Frontend + API | Next.js 14 App Router + TypeScript | Vercel | Free |
| Database | PostgreSQL + Prisma ORM | Neon | Free (0.5GB) |
| CMS editoriale | WordPress.com REST API | WordPress.com | Free |
| Mappa | Leaflet + react-leaflet + OpenStreetMap | CDN | Gratuito |
| Auth | NextAuth.js v5 (email/password) | — | — |
| Ingestion scheduler | GitHub Actions cron workflow | GitHub | Free |
| UI | Tailwind CSS + shadcn/ui (reskinned Material/Google) | — | — |
| Push notifications | Web Push API + VAPID | — | — |
| Storage media | Vercel Blob o filesystem temporaneo MVP | Vercel | Free tier |
| i18n | next-intl (IT/EN) | — | — |

---

## 3. Architettura

### 3.1 Flusso ingestion dati

```
GitHub Actions (cron ogni 15 min)
  └─ POST /api/ingest?secret=INGEST_SECRET
      └─ Ingestion Service (Next.js API route)
          ├─ Fetch INGV GeoJSON feed (terremoti + Etna)
          ├─ Fetch Protezione Civile RSS/GeoJSON (allerte)
          ├─ Fetch ANAS RSS (traffico/incidenti)
          ├─ Deduplica per hashDedup (SHA-256 di url+titolo+data)
          ├─ Normalizza → SourceItem
          └─ Crea/aggiorna Event se nuovo/cambiato
```

Il workflow `ingest-feeds.yml` include anche il cleanup dei SourceItem > 30 giorni.

### 3.2 Ingestion WordPress.com (editoriali)

```
GitHub Actions ingest-wordpress.yml (cron ogni 30 min)
  └─ POST /api/ingest/wordpress
      └─ GET https://public-api.wordpress.com/wp/v2/sites/{WP_SITE_ID}/posts
          └─ Upsert EditorialPost in Neon (wpId come chiave)
```

I contenuti editoriali sono serviti dalla cache locale Neon, non da WordPress.com a runtime. Questo garantisce performance e resilienza.

### 3.3 Notifiche push

```
Admin trigger (POST /api/push/send)
  └─ Query AlertRule matching (categoria + provincia + minSeverity)
  └─ Per ogni PushSubscription matching:
      └─ web-push (VAPID) → browser utente
```

### 3.4 Deployment

- **Vercel**: deploy automatico da branch `main` su push
- **Neon**: DATABASE_URL in env vars Vercel + GitHub Actions
- **GitHub Actions**: secret `INGEST_SECRET` condiviso con Vercel env
- **VAPID keys**: generate una volta, salvate in env vars

---

## 4. Schema database (Prisma)

### Event
```
id            String      @id @default(cuid())
title         String
category      EventCategory  // TERREMOTO | MALTEMPO | TRAFFICO | ERUZIONE | INCENDIO | ALLERTA | TRASPORTI
severity      Severity    // BASSA | MEDIA | ALTA | CRITICA
description   String
source        String
sourceUrl     String?
lat           Float?
lng           Float?
comune        String?
provincia     String?
status        EventStatus // ATTIVO | MONITORAGGIO | CHIUSO
tags          String[]
publishedAt   DateTime
updatedAt     DateTime    @updatedAt
sourceItemId  String?
sourceItem    SourceItem? @relation(fields: [sourceItemId], references: [id])
reports       Report[]
```

### SourceItem
```
id            String    @id @default(cuid())
source        SourceName  // INGV | PC | ANAS | MANUALE
type          SourceType  // RSS | API | MANUAL
title         String
text          String?
url           String?
publishedAt   DateTime
hashDedup     String    @unique
rawJson       Json?
createdAt     DateTime  @default(now())
event         Event?
```

### AlertRule
```
id            String             @id @default(cuid())
userId        String?
user          User?              @relation(fields: [userId], references: [id])
anonSessionId String?
categories    String[]
provinces     String[]
minSeverity   Severity
channels      AlertChannel[]     // WEB | PUSH  (EMAIL rimosso da MVP)
active        Boolean            @default(true)
createdAt     DateTime           @default(now())
pushSubs      PushSubscription[]
```

### PushSubscription
```
id            String    @id @default(cuid())
alertRuleId   String
alertRule     AlertRule @relation(fields: [alertRuleId], references: [id])
endpoint      String    @unique
p256dh        String
auth          String
createdAt     DateTime  @default(now())
```

### Report (segnalazioni lettori)
```
id                String       @id @default(cuid())
userId            String?
anonId            String?
text              String
mediaUrls         String[]
lat               Float?
lng               Float?
status            ReportStatus // NUOVO | IN_VERIFICA | APPROVATO | RIFIUTATO
reliabilityScore  Int          // 0–100, calcolato una volta all'invio (statico)
moderationNote    String?
eventId           String?
event             Event?       @relation(fields: [eventId], references: [id])
ipHash            String       // SHA-256 dell'IP per rate limiting
createdAt         DateTime     @default(now())
```

### EditorialPost (cache WordPress.com)
```
id            String    @id @default(cuid())
wpId          Int       @unique
title         String
slug          String    @unique
summary       String
content       String    @db.Text
type          EditorialType  // EDITORIALE | INTERVISTA | APPROFONDIMENTO
featured      Boolean   @default(false)
paywall       PaywallType  // FREE | PREMIUM
publishedAt   DateTime
syncedAt      DateTime  @updatedAt
readingTime   Int       // minuti stimati
imageUrl      String?
```

### SponsorBanner
```
id            String    @id @default(cuid())
position      String    // sidebar | header | footer | in-feed
imageUrl      String
linkUrl       String
active        Boolean   @default(true)
startAt       DateTime?
endAt         DateTime?
```

### User
```
id            String    @id @default(cuid())
email         String    @unique
passwordHash  String
role          UserRole  // ADMIN | USER
isPremium     Boolean   @default(false)
createdAt     DateTime  @default(now())
alertRules    AlertRule[]
```

### AuditLog
```
id            String   @id @default(cuid())
adminId       String
admin         User     @relation(fields: [adminId], references: [id])
action        String   // APPROVE_REPORT | REJECT_REPORT | CREATE_EVENT | CLOSE_EVENT | ecc.
entityType    String
entityId      String
metadata      Json?
createdAt     DateTime @default(now())
```

---

## 5. Struttura routing Next.js

### Area pubblica

| Route | Descrizione |
|-------|-------------|
| `/` | Home: hero stato, eventi attivi, feed ufficiali, sezione editoriale |
| `/mappa` | Mappa Leaflet full-screen con cluster e filtri |
| `/eventi/[id]` | Pagina evento: timeline, segnalazioni collegate, CTA alert |
| `/fonti` | Elenco fonti ufficiali con ultimi item ingestiti |
| `/editoriale` | Griglia articoli (da cache WP) con filtri |
| `/editoriale/[slug]` | Articolo singolo con SEO/OG, paywall soft per premium |
| `/segnala` | Form segnalazione con upload media e geolocalizzazione opt-in |
| `/alert` | Preferenze alert: categorie + provincia + attiva push |
| `/premium` | Pagina pricing freemium/premium (mock checkout MVP) |

### Area admin (`/admin/*`, protetta NextAuth)

| Route | Descrizione |
|-------|-------------|
| `/admin` | Dashboard: KPI, eventi recenti, segnalazioni in coda |
| `/admin/eventi` | Tabella eventi, crea/modifica/chiudi evento manuale |
| `/admin/segnalazioni` | Queue moderazione: approva/rifiuta/verifica + dettaglio |
| `/admin/editoriali` | Lista cache WP, toggle paywall FREE/PREMIUM, toggle featured, force sync |
| `/admin/sponsor` | CRUD SponsorBanner con preview posizione |
| `/admin/alert` | Simula push notification su evento selezionato |
| `/admin/audit` | Tabella AuditLog con filtri |

### API Routes

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/events` | GET | Lista eventi (query: categoria, severità, provincia, status, limit, offset) |
| `/api/events` | POST | Crea evento manuale (admin) |
| `/api/events/[id]` | GET | Evento singolo con segnalazioni approvate |
| `/api/events/[id]` | PATCH | Aggiorna/chiudi evento (admin) |
| `/api/ingest` | POST | Trigger ingestion feed (protetto da secret) |
| `/api/ingest/wordpress` | POST | Sync editoriali WP (protetto da secret) |
| `/api/reports` | POST | Crea segnalazione (rate limit: 3/ora per IP) |
| `/api/admin/reports/[id]` | PATCH | Modera segnalazione (admin) |
| `/api/editorial` | GET | Lista editoriali dalla cache |
| `/api/editorial/[slug]` | GET | Singolo editoriale (con paywall check) |
| `/api/alerts/subscribe` | POST | Crea AlertRule + PushSubscription |
| `/api/push/send` | POST | Invia push notification (admin) |
| `/api/sources` | GET | Lista fonti con ultimi item |

---

## 6. Fonti dati reali

### INGV — Terremoti
- **URL:** `https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&starttime={ISO}&minmagnitude=2.0&minlatitude=36&maxlatitude=38.5&minlongitude=11.5&maxlongitude=15.7`
- **Tipo:** GeoJSON API
- **Frequenza:** ogni 15 min
- **Normalizzazione:** `magnitude`, `place`, `time`, coordinate → Event TERREMOTO

### INGV-OE — Attività Etna
- **URL:** `https://www.ct.ingv.it/index.php/monitoraggio-e-sorveglianza/prodotti-del-monitoraggio/bollettini-settimanali-multidisciplinari` (RSS bollettini)
- **Fallback:** Mock strutturato se RSS non disponibile
- **Normalizzazione:** → Event ERUZIONE

### Protezione Civile — Allerte meteo
- **URL:** `https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Meteo-Regionali/contents/files/allerte` (DPC open data su GitHub)
- **Tipo:** JSON/GeoJSON open data
- **Frequenza:** ogni 15 min
- **Normalizzazione:** zone allerta Sicilia → Event ALLERTA

### ANAS — Traffico/Incidenti Sicilia
- **URL:** `https://www.stradeanas.it/it/le-strade/viabilit%C3%A0/comunicati-stampa/rss` (RSS comunicati)
- **Filtro:** solo comunicati con "Sicilia" nel testo
- **Normalizzazione:** → Event TRAFFICO

### WordPress.com — Editoriali
- **URL:** `https://public-api.wordpress.com/wp/v2/sites/{WP_SITE_ID}/posts?per_page=50&status=publish`
- **Frequenza:** ogni 30 min
- **Upsert:** per wpId

---

## 7. Design system

### Palette CSS variables
```css
--color-primary:       #1A73E8;  /* Google Blue */
--color-primary-hover: #1967D2;
--color-secondary:     #34A853;  /* Google Green — OK/risolto */
--color-warning:       #FBBC05;  /* Google Yellow — attenzione */
--color-danger:        #EA4335;  /* Google Red — critico */
--color-text-primary:  #202124;
--color-text-secondary:#5F6368;
--color-border:        #DADCE0;
--color-background:    #FFFFFF;
--color-surface:       #F8F9FA;
```

### Tipografia (Inter / Roboto)
| Elemento | Size | Line-height | Weight |
|----------|------|-------------|--------|
| H1 | 32px | 36px | 700 |
| H2 | 24px | 30px | 700 |
| H3 | 20px | 28px | 600 |
| Body | 16px | 24px | 400 |
| Caption | 12px | 16px | 400 |

### Severità eventi (UI)
- **BASSA:** chip verde (#34A853), border-left verde su card, testo "● Bassa"
- **MEDIA:** chip giallo (#FBBC05), border-left giallo, testo "● Media"
- **ALTA:** chip rosso (#EA4335), border-left rosso, testo "● Alta"
- **CRITICA:** chip rosso scuro + pulsante, animazione pulse, testo "● Critica"

Regola accessibilità: la severità è sempre indicata sia con colore che con testo (non solo colore).

### Layout
- Desktop: 12 colonne, max-width 1200px
- Mobile: 4 colonne, padding 16px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48px
- Border radius: 8px (input), 12px (card), 20px (chip/button pill)

### Componenti principali
- TopAppBar sticky (altezza 56px)
- EventCard (border-left colored, badge severità testuale, fonte+timestamp sempre visibili)
- FilterChip (categoria, stato)
- SeverityBadge (chip + testo)
- SkeletonLoader (shimmer animation)
- Snackbar/Toast (bottom-center, 4s auto-dismiss)
- SourceFeedItem
- EditorialCard (featured 2-col + griglia 3-col)
- AdminModerationPanel (lista + dettaglio affiancati)

---

## 8. Funzionalità principali MVP

### A) Home "Situazione in tempo reale"
- Hero con stato aggregato (N eventi per categoria, livello generale calcolato da max severity attiva)
- Lista eventi attivi con filtri chip (categoria) e ordinamento (recente/severità/distanza)
- Modulo rapido "Imposta alert" (categorie + provincia)
- Box feed ufficiali (ultimi 4-5 SourceItem recenti)
- **Sezione editoriale full-width prominente**: articolo featured (2 colonne) + griglia 3 card secondarie

### B) Mappa interattiva (Leaflet + OSM)
- Marker cluster per eventi geolocalizzati
- Colore marker per severità
- Filtri sidebar: categoria, severità, data
- Popup click → scheda rapida evento → link pagina completa
- Geolocalizzazione utente opt-in per ordinamento per distanza

### C) Pagina evento
- Header: titolo, chip categoria+severità, fonte+timestamp
- Mappa mini con pin
- Timeline aggiornamenti (ordinata, con fonte per ogni update)
- Segnalazioni verificate collegate (solo APPROVATO)
- Editoriali correlati da cache WP (per tag/categoria)
- CTA "Ricevi alert per questa categoria/area"
- Share buttons (URL nativo)
- SEO: meta title/description, OG, Twitter card

### D) Fonti ufficiali
- Lista fonti con descrizione e logo
- Per ciascuna: ultimi 5 SourceItem con link originale
- Badge "aggiornato X minuti fa" (da SourceItem.createdAt)

### E) Editoriali (da cache WordPress.com)
- Griglia con filtri tipo (EDITORIALE/INTERVISTA/APPROFONDIMENTO)
- Badge PREMIUM sulle card bloccate
- Paywall soft: anteprima 1 paragrafo + blur + CTA upgrade
- Pagina articolo: SEO completo (meta, OG, Twitter), reading time, related articles

### F) Segnalazioni lettori
- Form: testo (max 500 char) + upload foto/video (max 5MB, jpg/png/mp4) + posizione opt-in
- Rate limit: max 3 invii/ora per IP hash — implementato con **DB counter** (Neon), necessario su Vercel serverless dove l'in-memory non è affidabile tra istanze concorrenti. La tabella `RateLimit` tiene `ipHash + windowStart + count`.
- Media upload: client POST multipart a `/api/reports` → API route salva su **Vercel Blob** via `@vercel/blob` (richiede `BLOB_READ_WRITE_TOKEN`). URL restituito salvato in `mediaUrls[]`.
- Pipeline affidabilità (score 0-100, calcolato una volta all'invio — valore statico):
  - +30 se posizione fornita e verificata
  - +20 se media allegato
  - +20 se utente registrato (vs anonimo)
  - +20 se primo invio da questo IP (nelle ultime 24h)
  - −10 se testo < 30 char
  - Placeholder AI: campo `aiScore` per futuro scoring ML
- Stato iniziale: NUOVO → visibile pubblicamente solo se APPROVATO
- Feedback utente: pagina "La tua segnalazione è in verifica" con stato aggiornabile

### G) Alert personalizzati + PWA
- Form `/alert`: seleziona categorie multiple + provincia + soglia severità minima
- Richiede permesso notifiche browser (Web Push API)
- Salva PushSubscription + AlertRule in DB
- **Trigger automatico:** quando l'ingestion pipeline crea un nuovo Event con severity `ALTA` o `CRITICA`, chiama internamente `sendPushToMatching(event)` — stessa logica del trigger manuale admin
- Admin può triggerare push manualmente da `/admin/alert` per qualsiasi evento
- Struttura push notification: titolo evento, severità, area, link pagina evento
- Service Worker: installazione PWA, cache offline per home e mappa
- `manifest.json`: nome, icone, theme_color, display standalone

### H) Monetizzazione
- **Free:** tutto accessibile tranne contenuti premium
- **Premium:** paywall soft su articoli marcati `paywall: PREMIUM` + alert avanzati (più categorie, soglia severità personalizzata)
- **Mock checkout:** pagina `/premium` con pricing card e CTA "Abbonati" (Stripe-ready, ma non integrato nell'MVP)
- **Sponsor:** SponsorBanner gestiti da admin, posizioni: sidebar, in-feed, footer. Mostrati lato client con controllo `active + startAt/endAt`

---

## 9. Pannello admin

### Protezione
- Route `/admin/*` protetta da NextAuth middleware
- Role check: solo utenti con `role: ADMIN`
- Login page: `/admin/login`

### Dashboard
- KPI: eventi attivi, segnalazioni in coda, feed ingestiti oggi, subscriber alert
- Tabella eventi recenti (5 ultimi)
- Tabella segnalazioni urgenti (score > 60, status NUOVO)
- Quick action: "Crea evento manuale"

### Moderazione segnalazioni
- Tabs: Tutte / Nuovo / In verifica / Approvate / Rifiutate
- Lista con score bar colorata (verde/giallo/rosso), anteprima testo, timestamp
- Pannello dettaglio affiancato:
  - Testo completo, media allegato, mappa mini posizione
  - Score breakdown (puntini dettaglio)
  - Select "Collega a evento esistente"
  - Textarea nota moderazione
  - Bottoni: Approva / Rifiuta / Metti in verifica
- Ogni azione scrive su AuditLog

### Gestione eventi
- Tabella con filtri e ricerca
- Form crea/modifica: tutti i campi Event
- Pulsante "Chiudi evento" → status: CHIUSO

### Editoriali (sync WP)
- Lista articoli cache con stato sync
- Toggle paywall FREE/PREMIUM
- Toggle featured
- Pulsante "Force sync" → chiama `/api/ingest/wordpress`

### Sponsor
- CRUD SponsorBanner
- Preview posizione (mockup contestuale)

### Simula push
- Select evento esistente
- Preview messaggio push
- Bottone "Invia a tutti i subscriber matching"
- Log ultimi 10 invii

### Audit log
- Tabella AuditLog con filtri: admin, action, entityType, date range

---

## 10. SEO e performance

- `generateMetadata()` per ogni pagina con titolo, description, OG, Twitter card
- `sitemap.ts` generato dinamicamente (eventi attivi + articoli)
- `robots.ts`: allow tutto tranne `/admin`
- `next/image` per ottimizzazione immagini
- ISR (Incremental Static Regeneration): home ogni 60s, pagine evento ogni 30s. **Nota:** per un portale emergenze, 30–60s di dati potenzialmente stale è accettabile per i casi normali. Per eventi `CRITICA`, il componente `EventCard` e la hero usano SWR client-side polling (ogni 30s) come layer aggiuntivo per ridurre la latenza percepita senza costi server.
- Skeleton loading per lista eventi e mappa
- Bundle split: mappa Leaflet caricata solo su `/mappa` e `/eventi/[id]` (dynamic import)

---

## 11. i18n

- Libreria: `next-intl`
- Lingue: IT (default), EN
- File: `messages/it.json`, `messages/en.json`
- Routing: basato su `middleware.ts` con prefisso `/en/...` per inglese e `/...` per italiano (locale-prefix strategy). Il layout App Router usa `app/[locale]/` come segmento wrapper con `generateStaticParams` per IT e EN.
- `middleware.ts` (nella root) gestisce redirect e cookie locale
- Scope MVP: UI principale (navigation, labels, stati, CTA). Contenuti editoriali e testi evento non tradotti (fonte esterna).

---

## 12. Sicurezza

- **Input validation:** Zod su tutti gli API routes
- **Rate limiting:** endpoint `/api/reports` limitato a 3 req/ora per IP hash
- **Sanitizzazione:** DOMPurify per contenuti WP prima del render
- **Ingestion secret:** header `x-ingest-secret` validato su `/api/ingest*`
- **Admin auth:** NextAuth session + middleware route protection
- **SQL injection:** prevenuta da Prisma ORM (query parametrizzate)
- **XSS:** React escaping + DOMPurify per contenuto WP
- **CORS:** limitato alle origini Vercel del progetto
- **Geolocalizzazione:** solo opt-in esplicito, non salvata se non concessa

---

## 13. Testing

- **Unit:** parser INGV GeoJSON, parser PC GeoJSON, score affidabilità segnalazione, deduplica hash
- **Integration:** API routes principali (GET /api/events, POST /api/reports, POST /api/ingest)
- **E2E (opzionale MVP):** flusso submit segnalazione, flusso attiva alert
- Framework: Vitest + supertest per API

---

## 14. Struttura cartelle

```
emergenza-sicilia/
├── middleware.ts                 # next-intl locale routing + admin auth guard
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Wrapper locale (IT/EN) — next-intl
│   │   ├── layout.tsx            # Layout pubblico con TopBar e Footer
│   │   ├── page.tsx              # Home
│   │   ├── mappa/page.tsx
│   │   ├── eventi/[id]/page.tsx
│   │   ├── fonti/page.tsx
│   │   ├── editoriale/page.tsx
│   │   ├── editoriale/[slug]/page.tsx
│   │   ├── segnala/page.tsx
│   │   ├── alert/page.tsx
│   │   ├── premium/page.tsx
│   │   └── privacy/page.tsx      # Privacy policy (GDPR)
│   ├── admin/                    # Layout admin (protetto, fuori da [locale])
│   │   ├── layout.tsx            # Shell admin con sidebar nav
│   │   ├── login/page.tsx        # Pagina login admin (custom, design system)
│   │   ├── page.tsx              # Dashboard
│   │   ├── eventi/page.tsx
│   │   ├── segnalazioni/page.tsx
│   │   ├── editoriali/page.tsx
│   │   ├── sponsor/page.tsx
│   │   ├── alert/page.tsx
│   │   └── audit/page.tsx
│   ├── api/
│   │   ├── events/route.ts
│   │   ├── events/[id]/route.ts
│   │   ├── ingest/route.ts
│   │   ├── ingest/wordpress/route.ts
│   │   ├── reports/route.ts
│   │   ├── admin/reports/[id]/route.ts
│   │   ├── editorial/route.ts
│   │   ├── editorial/[slug]/route.ts  # Singolo editoriale + paywall check
│   │   ├── alerts/subscribe/route.ts
│   │   ├── push/send/route.ts
│   │   └── sources/route.ts
│   ├── layout.tsx                # Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui reskinned
│   ├── events/                   # EventCard, EventList, FilterChips
│   ├── map/                      # MapView, MapMarker (dynamic import)
│   ├── editorial/                # EditorialCard, EditorialFeatured
│   ├── reports/                  # ReportForm, ReportStatus
│   ├── alerts/                   # AlertForm, PushPermission
│   ├── admin/                    # ModerationPanel, AuditTable
│   └── layout/                   # TopBar, Footer, SponsorBanner
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── ingestion/
│   │   ├── ingv.ts               # Parser INGV GeoJSON
│   │   ├── protezione-civile.ts  # Parser PC GeoJSON/RSS
│   │   ├── anas.ts               # Parser ANAS RSS
│   │   └── wordpress.ts          # Sync WP REST API
│   ├── push.ts                   # web-push VAPID helpers
│   ├── reliability.ts            # Score affidabilità segnalazioni
│   ├── rate-limit.ts             # IP hash rate limiter
│   └── auth.ts                   # NextAuth config
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Seed dati fittizi
├── messages/
│   ├── it.json
│   └── en.json
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
├── .github/
│   └── workflows/
│       └── ingest.yml            # Cron ingestion ogni 15 min
├── tests/
│   ├── ingv.test.ts
│   ├── reliability.test.ts
│   └── api.test.ts
├── .env.example
├── README.md
└── package.json
```

---

## 15. Variabili d'ambiente

```env
# Database
DATABASE_URL=postgresql://...neon.tech/...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://emergenza-sicilia.vercel.app

# Ingestion
INGEST_SECRET=...

# WordPress.com
WP_SITE_ID=emergenzasicilia.wordpress.com

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@emergenzasicilia.it

# Media upload (Vercel Blob)
BLOB_READ_WRITE_TOKEN=...

# Admin iniziale (seed)
ADMIN_EMAIL=admin@emergenzasicilia.it
ADMIN_PASSWORD=...
```

---

## 16. GitHub Actions workflow (ingestion)

Due workflow separati per frequenze diverse:

```yaml
# .github/workflows/ingest-feeds.yml
name: Ingest feeds (ogni 15 min)

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger feed ingestion
        run: |
          curl -f -X POST \
            -H "x-ingest-secret: ${{ secrets.INGEST_SECRET }}" \
            https://emergenza-sicilia.vercel.app/api/ingest
```

```yaml
# .github/workflows/ingest-wordpress.yml
name: Sync WordPress editoriali (ogni 30 min)

on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  sync-wp:
    runs-on: ubuntu-latest
    steps:
      - name: Sync WordPress.com posts
        run: |
          curl -f -X POST \
            -H "x-ingest-secret: ${{ secrets.INGEST_SECRET }}" \
            https://emergenza-sicilia.vercel.app/api/ingest/wordpress
```

**Nota:** i due workflow sono separati intenzionalmente: frequenze diverse, failure isolation, retry indipendente. Il flag `-f` su curl fa fallire il job se l'endpoint risponde con errore HTTP.

---

## 17. Seed data

Il seed (`prisma/seed.ts`) crea:
- 1 utente admin
- 8 eventi fittizi (2 terremoti, 1 eruzione Etna, 2 allerte meteo, 1 incendio, 2 traffico) con coordinate siciliane reali
- 15 SourceItem corrispondenti
- 5 Report segnalazioni in vari stati (NUOVO, IN_VERIFICA, APPROVATO, RIFIUTATO)
- 3 EditorialPost (1 FREE, 1 PREMIUM, 1 FREE featured)
- 2 SponsorBanner (1 sidebar, 1 in-feed)
- 1 AlertRule di esempio

---

## 18. GDPR e Privacy (EU)

L'app raccoglie dati personali di utenti EU (email, IP hash, geolocalizzazione, push subscription). Requisiti minimi MVP:

### Pagine obbligatorie
- `/privacy` — informativa privacy completa (GDPR Art. 13): titolare, dati raccolti, finalità, base giuridica, periodo di conservazione, diritti dell'interessato
- Cookie banner minimale (solo cookie tecnici necessari; no analytics di terze parti nell'MVP)

### Conservazione dati
| Entità | Periodo conservazione | Motivazione |
|--------|----------------------|-------------|
| Report (segnalazioni) | 90 giorni dopo chiusura evento collegato | Necessario per flusso moderazione |
| SourceItem | 30 giorni | Cleanup automatico via ingestion job |
| PushSubscription | Fino a revoca utente o 12 mesi inattività | Necessario per erogare servizio |
| AuditLog | 12 mesi | Accountability admin |
| User (registrato) | Fino a cancellazione account | Servizio attivo |

### Diritti interessato
- Cancellazione account: endpoint `DELETE /api/user/me` (cancella User, AlertRule, PushSubscription associati)
- Portabilità: fuori scope MVP, segnalato come backlog

### IP hashing
- Gli IP vengono hashati (SHA-256 + salt env) prima del salvataggio — non memorizzati in chiaro
- Usati solo per rate limiting, non per profilazione

## 19. Decisioni di design chiave

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Mappa | Leaflet + OSM | Gratuito, nessuna API key, ottimo con react-leaflet |
| CMS | WordPress.com free + cache locale | Zero costo, resilienza, performance |
| Ingestion scheduler | GitHub Actions | Gratuito, frequenza libera, familiarità |
| DB hosting | Neon free | PostgreSQL serverless, Prisma-native, free tier generoso |
| Auth | NextAuth v5 | Standard Next.js, estensibile, email/password + futuro OAuth |
| Editorial cache | Sync ogni 30 min in Neon | Nessuna call WP a runtime, resiliente |
| Media upload | Vercel Blob (MVP) | Gratuito su free tier per MVP, migrazione S3/Cloudinary semplice. Richiede BLOB_READ_WRITE_TOKEN |
| i18n scope | IT/EN UI only | Contenuti da fonti esterne non traducibili automaticamente |
| Geoloc | Opt-in esplicito | Privacy, GDPR, affidabilità |

---

*Spec approvata dal product owner il 2026-03-23*
