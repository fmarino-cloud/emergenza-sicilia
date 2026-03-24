import {
  PrismaClient,
  EventCategory,
  Severity,
  EventStatus,
  SourceName,
  SourceType,
  ReportStatus,
  EditorialType,
  PaywallType,
  UserRole,
  AlertChannel,
} from "@prisma/client";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hashDedup(source: string, title: string, date: string): string {
  return createHash("sha256").update(`${source}|${title}|${date}`).digest("hex");
}

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (order matters for FK constraints)
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

  // 1. Admin user
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );
  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@emergenzasicilia.it",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // 2. Source Items
  const si1 = await prisma.sourceItem.create({
    data: {
      source: SourceName.INGV,
      type: SourceType.API,
      title: "Terremoto ML 3.2 - Costa orientale Sicilia",
      text: "Evento sismico ML 3.2 localizzato a 15 km da Catania alle 14:32.",
      url: "https://terremoti.ingv.it/event/12345",
      publishedAt: new Date("2026-03-24T14:32:00Z"),
      hashDedup: hashDedup("INGV", "12345", "2026-03-24T14:32:00.000Z"),
    },
  });
  const si2 = await prisma.sourceItem.create({
    data: {
      source: SourceName.INGV,
      type: SourceType.API,
      title: "Terremoto ML 2.1 - Zona etnea",
      text: "Scossa ML 2.1 zona Etna, profondità 5 km.",
      url: "https://terremoti.ingv.it/event/12346",
      publishedAt: new Date("2026-03-24T08:15:00Z"),
      hashDedup: hashDedup("INGV", "12346", "2026-03-24T08:15:00.000Z"),
    },
  });
  const si3 = await prisma.sourceItem.create({
    data: {
      source: SourceName.INGV,
      type: SourceType.API,
      title: "Bollettino attività Etna - Emissione cenere",
      text: "Attività stromboliana al cratere di Sud-Est con emissione cenere.",
      url: "https://www.ct.ingv.it",
      publishedAt: new Date("2026-03-23T16:00:00Z"),
      hashDedup: hashDedup("INGV", "etna-bollettino-cenere", "2026-03-23T16:00:00.000Z"),
    },
  });
  const si4 = await prisma.sourceItem.create({
    data: {
      source: SourceName.PC,
      type: SourceType.API,
      title: "Allerta meteo arancione - Sicilia orientale",
      text: "Allerta arancione piogge intense e rischio idrogeologico.",
      url: "https://www.protezionecivile.gov.it/it/allerta-meteo",
      publishedAt: new Date("2026-03-24T06:00:00Z"),
      hashDedup: hashDedup("PC", "allerta-arancione-sic-a", "2026-03-24"),
    },
  });
  const si5 = await prisma.sourceItem.create({
    data: {
      source: SourceName.PC,
      type: SourceType.API,
      title: "Allerta meteo gialla - Sicilia settentrionale",
      text: "Venti forti e mareggiate costa tirrenica.",
      url: "https://www.protezionecivile.gov.it/it/allerta-meteo",
      publishedAt: new Date("2026-03-24T06:00:00Z"),
      hashDedup: hashDedup("PC", "allerta-gialla-sic-b", "2026-03-24"),
    },
  });
  const si6 = await prisma.sourceItem.create({
    data: {
      source: SourceName.ANAS,
      type: SourceType.RSS,
      title: "A19 Palermo-Catania: chiusura corsia per lavori",
      text: "Chiusura corsia direzione Catania tra Enna e Caltanissetta.",
      url: "https://www.stradeanas.it/comunicato/12345",
      publishedAt: new Date("2026-03-24T10:00:00Z"),
      hashDedup: hashDedup("ANAS", "A19 Palermo-Catania: chiusura corsia per lavori", "Mon, 24 Mar 2026 10:00:00 GMT"),
    },
  });
  const si7 = await prisma.sourceItem.create({
    data: {
      source: SourceName.ANAS,
      type: SourceType.RSS,
      title: "SS114 Catania-Siracusa: incidente con rallentamenti",
      text: "Incidente SS114 presso Augusta, rallentamenti in entrambe le direzioni.",
      url: "https://www.stradeanas.it/comunicato/12346",
      publishedAt: new Date("2026-03-24T12:30:00Z"),
      hashDedup: hashDedup("ANAS", "SS114 Catania-Siracusa: incidente con rallentamenti", "Mon, 24 Mar 2026 12:30:00 GMT"),
    },
  });

  // 3. Events
  const ev1 = await prisma.event.create({
    data: {
      title: "Terremoto ML 3.2 — Costa orientale Sicilia",
      category: EventCategory.TERREMOTO,
      severity: Severity.MEDIA,
      description: "Evento sismico ML 3.2 a 15 km da Catania. Nessun danno segnalato. Avvertito dalla popolazione locale.",
      source: "INGV",
      sourceUrl: "https://terremoti.ingv.it/event/12345",
      lat: 37.5079,
      lng: 15.0900,
      comune: "Catania",
      provincia: "CT",
      status: EventStatus.ATTIVO,
      tags: ["terremoto", "catania", "costa-orientale"],
      publishedAt: new Date("2026-03-24T14:32:00Z"),
      sourceItemId: si1.id,
    },
  });
  const ev2 = await prisma.event.create({
    data: {
      title: "Terremoto ML 2.1 — Zona etnea",
      category: EventCategory.TERREMOTO,
      severity: Severity.BASSA,
      description: "Scossa ML 2.1 nella zona Etna, profondità 5 km. Evento di routine per l'area vulcanica.",
      source: "INGV",
      sourceUrl: "https://terremoti.ingv.it/event/12346",
      lat: 37.7510,
      lng: 14.9934,
      comune: "Nicolosi",
      provincia: "CT",
      status: EventStatus.ATTIVO,
      tags: ["terremoto", "etna"],
      publishedAt: new Date("2026-03-24T08:15:00Z"),
      sourceItemId: si2.id,
    },
  });
  const ev3 = await prisma.event.create({
    data: {
      title: "Attività stromboliana Etna — Emissione cenere",
      category: EventCategory.ERUZIONE,
      severity: Severity.ALTA,
      description: "Incremento attività stromboliana al cratere di Sud-Est. Emissione cenere con possibile ricaduta su centri etnei e aeroporto Catania.",
      source: "INGV-OE",
      sourceUrl: "https://www.ct.ingv.it",
      lat: 37.7510,
      lng: 14.9934,
      comune: "Catania",
      provincia: "CT",
      status: EventStatus.ATTIVO,
      tags: ["etna", "eruzione", "cenere", "aeroporto"],
      publishedAt: new Date("2026-03-23T16:00:00Z"),
      sourceItemId: si3.id,
    },
  });
  const ev4 = await prisma.event.create({
    data: {
      title: "Allerta meteo arancione — Sicilia orientale",
      category: EventCategory.ALLERTA,
      severity: Severity.ALTA,
      description: "Allerta arancione per piogge intense, temporali e rischio idrogeologico. Valida 24 ore.",
      source: "Protezione Civile",
      sourceUrl: "https://www.protezionecivile.gov.it/it/allerta-meteo",
      lat: 37.5,
      lng: 15.1,
      provincia: "CT",
      status: EventStatus.ATTIVO,
      tags: ["allerta-meteo", "arancione", "pioggia"],
      publishedAt: new Date("2026-03-24T06:00:00Z"),
      sourceItemId: si4.id,
    },
  });
  const ev5 = await prisma.event.create({
    data: {
      title: "Allerta meteo gialla — Sicilia settentrionale",
      category: EventCategory.MALTEMPO,
      severity: Severity.MEDIA,
      description: "Venti forti e mareggiate lungo la costa tirrenica. Allerta gialla vento e mare grosso.",
      source: "Protezione Civile",
      sourceUrl: "https://www.protezionecivile.gov.it/it/allerta-meteo",
      lat: 38.1,
      lng: 13.4,
      provincia: "PA",
      status: EventStatus.ATTIVO,
      tags: ["maltempo", "vento", "mare"],
      publishedAt: new Date("2026-03-24T06:00:00Z"),
      sourceItemId: si5.id,
    },
  });
  const ev6 = await prisma.event.create({
    data: {
      title: "Incendio boschivo — Zona Nebrodi (ME)",
      category: EventCategory.INCENDIO,
      severity: Severity.ALTA,
      description: "Incendio di vaste proporzioni nel Parco dei Nebrodi. Canadair in azione. Evacuazione precauzionale case rurali.",
      source: "Protezione Civile",
      lat: 37.96,
      lng: 14.74,
      comune: "Caronia",
      provincia: "ME",
      status: EventStatus.ATTIVO,
      tags: ["incendio", "nebrodi", "evacuazione"],
      publishedAt: new Date("2026-03-23T11:00:00Z"),
    },
  });
  await prisma.event.create({
    data: {
      title: "A19 Palermo-Catania — Chiusura corsia per lavori",
      category: EventCategory.TRAFFICO,
      severity: Severity.BASSA,
      description: "Chiusura corsia di marcia direzione Catania tra Enna e Caltanissetta. Senso unico alternato.",
      source: "ANAS",
      sourceUrl: "https://www.stradeanas.it/comunicato/12345",
      lat: 37.57,
      lng: 14.27,
      comune: "Enna",
      provincia: "EN",
      status: EventStatus.ATTIVO,
      tags: ["traffico", "lavori", "a19"],
      publishedAt: new Date("2026-03-24T10:00:00Z"),
      sourceItemId: si6.id,
    },
  });
  await prisma.event.create({
    data: {
      title: "SS114 Catania-Siracusa — Incidente con rallentamenti",
      category: EventCategory.TRAFFICO,
      severity: Severity.MEDIA,
      description: "Incidente stradale SS114 presso Augusta. Rallentamenti in entrambe le direzioni.",
      source: "ANAS",
      sourceUrl: "https://www.stradeanas.it/comunicato/12346",
      lat: 37.23,
      lng: 15.18,
      comune: "Augusta",
      provincia: "SR",
      status: EventStatus.MONITORAGGIO,
      tags: ["traffico", "incidente", "ss114"],
      publishedAt: new Date("2026-03-24T12:30:00Z"),
      sourceItemId: si7.id,
    },
  });

  // 4. Reports
  await prisma.report.create({
    data: {
      text: "Forte scossa avvertita a Catania, palazzo vibrato per circa 5 secondi. Gente in strada spaventata.",
      mediaUrls: [],
      lat: 37.5079,
      lng: 15.0900,
      status: ReportStatus.APPROVATO,
      reliabilityScore: 70,
      eventId: ev1.id,
      ipHash: createHash("sha256").update("192.168.1.1dev-secret-32-chars-minimum-here").digest("hex"),
    },
  });
  await prisma.report.create({
    data: {
      text: "Vista colonna di fumo nero dalla zona Nebrodi, visibile da Cefalù.",
      mediaUrls: [],
      lat: 38.03,
      lng: 14.02,
      status: ReportStatus.APPROVATO,
      reliabilityScore: 80,
      moderationNote: "Confermata da fonte locale",
      eventId: ev6.id,
      ipHash: createHash("sha256").update("192.168.1.2dev-secret-32-chars-minimum-here").digest("hex"),
    },
  });
  await prisma.report.create({
    data: {
      text: "Allagamento in via Etnea a Catania, acqua alta 30cm, traffico bloccato.",
      mediaUrls: [],
      lat: 37.5023,
      lng: 15.0873,
      status: ReportStatus.NUOVO,
      reliabilityScore: 50,
      ipHash: createHash("sha256").update("192.168.1.3dev-secret-32-chars-minimum-here").digest("hex"),
    },
  });
  await prisma.report.create({
    data: {
      text: "Frana sulla SP22 verso Taormina dopo piogge intense.",
      mediaUrls: [],
      status: ReportStatus.IN_VERIFICA,
      reliabilityScore: 60,
      ipHash: createHash("sha256").update("192.168.1.4dev-secret-32-chars-minimum-here").digest("hex"),
    },
  });
  await prisma.report.create({
    data: {
      text: "spam",
      mediaUrls: [],
      status: ReportStatus.RIFIUTATO,
      reliabilityScore: 0,
      moderationNote: "Segnalazione spam, testo insufficiente",
      ipHash: createHash("sha256").update("192.168.1.5dev-secret-32-chars-minimum-here").digest("hex"),
    },
  });

  // 5. Editorials
  await prisma.editorialPost.create({
    data: {
      wpId: 1001,
      title: "Ciclone Harry: cosa abbiamo imparato",
      slug: "ciclone-harry-cosa-abbiamo-imparato",
      summary: "Un'analisi delle vulnerabilità emerse durante il ciclone Harry e le lezioni per la protezione civile siciliana.",
      content: "<p>Il ciclone Harry ha rappresentato un punto di svolta per la consapevolezza del rischio meteo-idrogeologico in Sicilia. Le infrastrutture viarie, in particolare viadotti e gallerie, hanno mostrato criticità significative che richiedono interventi urgenti.</p><p>La risposta delle autorità locali è stata rapida ma ha evidenziato lacune nella comunicazione con i cittadini e nella diffusione delle allerte in tempo reale.</p>",
      type: EditorialType.EDITORIALE,
      featured: true,
      paywall: PaywallType.FREE,
      publishedAt: new Date("2026-03-20T10:00:00Z"),
      readingTime: 8,
      imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format",
    },
  });
  await prisma.editorialPost.create({
    data: {
      wpId: 1002,
      title: "Intervista al direttore della Protezione Civile Sicilia",
      slug: "intervista-direttore-protezione-civile-sicilia",
      summary: "Il direttore regionale racconta le sfide della prevenzione e la nuova strategia di comunicazione con i cittadini.",
      content: "<p>In esclusiva per Emergenza Sicilia, abbiamo intervistato il direttore della Protezione Civile regionale sulla gestione delle emergenze dell'ultimo anno.</p><p>Questo contenuto è riservato agli abbonati premium.</p>",
      type: EditorialType.INTERVISTA,
      featured: false,
      paywall: PaywallType.PREMIUM,
      publishedAt: new Date("2026-03-18T14:00:00Z"),
      readingTime: 12,
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format",
    },
  });
  await prisma.editorialPost.create({
    data: {
      wpId: 1003,
      title: "Guida: come prepararsi a un terremoto in Sicilia",
      slug: "guida-prepararsi-terremoto-sicilia",
      summary: "Kit di emergenza, piano familiare, punti di raccolta: tutto quello che devi sapere.",
      content: "<p>La Sicilia è tra le regioni a più alto rischio sismico d'Italia. Ecco una guida pratica per preparare la tua famiglia a un possibile evento sismico.</p><p><strong>Il kit di emergenza</strong>: acqua (3 litri a persona per 3 giorni), cibo non deperibile, torcia, radio a batterie, kit di pronto soccorso, documenti importanti.</p><p><strong>Il piano familiare</strong>: stabilisci un punto di incontro fuori casa, condividi i numeri di emergenza con tutti i familiari.</p>",
      type: EditorialType.APPROFONDIMENTO,
      featured: false,
      paywall: PaywallType.FREE,
      publishedAt: new Date("2026-03-15T09:00:00Z"),
      readingTime: 6,
      imageUrl: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800&auto=format",
    },
  });

  // 6. Sponsor Banners
  await prisma.sponsorBanner.create({
    data: {
      position: "sidebar",
      imageUrl: "https://placehold.co/300x250/0056A0/FFFFFF?text=Sponsor+Sidebar",
      linkUrl: "https://example.com/sponsor1",
      active: true,
    },
  });
  await prisma.sponsorBanner.create({
    data: {
      position: "in-feed",
      imageUrl: "https://placehold.co/728x90/0056A0/FFFFFF?text=Sponsor+Banner",
      linkUrl: "https://example.com/sponsor2",
      active: true,
    },
  });

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

  console.log("✅ Seed completato:");
  console.log(`   Admin: ${admin.email}`);
  console.log("   8 eventi, 7 source items, 5 segnalazioni, 3 editoriali, 2 banner, 1 alert rule");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
