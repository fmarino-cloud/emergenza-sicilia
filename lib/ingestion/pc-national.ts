import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// Keywords for filtering Sicilia-related content
const SICILIA_KEYWORDS = [
  // Province e varianti
  "sicilia", "siciliana", "siciliano", "siciliane", "siciliani",
  "palermo", "catania", "messina", "agrigento", "caltanissetta",
  "enna", "ragusa", "siracusa", "trapani",
  // Codici provincia (con spazi per evitare falsi positivi)
  " pa ", " ct ", " me ", " ag ", " cl ", " en ", " rg ", " sr ", " tp ",
  // Autostrade siciliane
  "a18", "a19", "a20", "a29", "a29dir",
  // Strade statali siciliane
  "ss113", "ss114", "ss115", "ss117", "ss120", "ss121", "ss188", "ss189",
  "ss626", "ss640", "ss624", "ss284",
  // Isole e luoghi noti
  "etna", "stromboli", "vulcano", "lipari", "eolie", "pantelleria",
  "lampedusa", "linosa", "ustica", "favignana", "marettimo",
  "stretto di messina", "canale di sicilia",
  // Città principali
  "marsala", "mazara", "alcamo", "bagheria", "vittoria", "gela",
  "acireale", "giarre", "paterno", "misterbianco",
  "modica", "scicli", "comiso", "avola", "noto", "pachino",
  "porto empedocle", "licata", "sciacca", "ribera", "bivona",
  "leonforte", "nicosia", "aidone", "piazza armerina",
  "termini imerese", "cefalù", "misilmeri", "monreale", "partinico",
];

// Sicilia bounding box (include isole minori: Lampedusa lat 35.48, Pantelleria lat 36.8)
const SICILIA_LAT = { min: 35.48, max: 38.35 };
const SICILIA_LNG = { min: 11.93, max: 15.65 };

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function isSiciliaRelated(text: string): boolean {
  const lower = ` ${text.toLowerCase()} `;
  return SICILIA_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function parseSeverity(text: string): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  const lower = text.toLowerCase();
  if (lower.includes("allerta rossa") || lower.includes("critica") || lower.includes("emergenza")) return "CRITICA";
  if (lower.includes("allerta arancione") || lower.includes("alta") || lower.includes("pericolo")) return "ALTA";
  if (lower.includes("allerta gialla") || lower.includes("media") || lower.includes("attenzione")) return "MEDIA";
  return "BASSA";
}

function parseCategory(text: string): ParsedIngestionEvent["category"] {
  const lower = text.toLowerCase();
  if (lower.includes("incend") || lower.includes("fire")) return "INCENDIO";
  if (lower.includes("sism") || lower.includes("terremot")) return "TERREMOTO";
  if (lower.includes("eruzion") || lower.includes("vulcan")) return "ERUZIONE";
  if (lower.includes("meteo") || lower.includes("pioggia") || lower.includes("temporale") || lower.includes("vento")) return "MALTEMPO";
  if (lower.includes("traffico") || lower.includes("strada")) return "TRAFFICO";
  return "ALLERTA";
}

export function parsePCNationalRss(xml: string): ParsedIngestionEvent[] {
  const events: ParsedIngestionEvent[] = [];
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const description = extractTag(item, "description");
    const pubDate = extractTag(item, "pubDate");
    if (!title || !pubDate) continue;

    const combined = `${title} ${description}`;
    if (!isSiciliaRelated(combined)) continue;

    const parsed = new Date(pubDate);
    if (isNaN(parsed.getTime())) continue;

    events.push({
      title: title.slice(0, 200),
      category: parseCategory(combined),
      severity: parseSeverity(combined),
      description: (description || title).slice(0, 500),
      source: "PC_NATIONAL",
      sourceUrl: link || "https://www.protezionecivile.gov.it",
      lat: 37.5,
      lng: 14.0,
      place: "Sicilia",
      publishedAt: parsed,
      hashDedup: createDedupHash("PC_NATIONAL", title, pubDate),
      rawJson: { title, link, pubDate },
    });
  }
  return events;
}

// The PC national site has an RSS page at /it/rss/ but the actual feeds are behind JS rendering.
// We try the most common paths for news/notizie feed.
const RSS_URLS = [
  "https://www.protezionecivile.gov.it/it/notizie/rss.xml",
  "https://www.protezionecivile.gov.it/it/notizie/feed/rss.xml",
  "https://www.protezionecivile.gov.it/feed/rss.xml",
];

export async function fetchPCNationalEvents(): Promise<ParsedIngestionEvent[]> {
  for (const url of RSS_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.includes("<item>")) continue;
      const parsed = parsePCNationalRss(text);
      if (parsed.length >= 0) return parsed; // even empty is fine if feed responded
    } catch {
      // try next URL
    }
  }
  // If no RSS works, return empty (graceful degradation)
  console.warn("[PC_NATIONAL] No RSS feed accessible – returning empty");
  return [];
}

// Export bbox for reuse
export { SICILIA_LAT, SICILIA_LNG, isSiciliaRelated };
