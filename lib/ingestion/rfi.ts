import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// RFI (Rete Ferroviaria Italiana) — notizie/interruzioni linee in Sicilia

const SICILIA_RAIL_KEYWORDS = [
  // Province e varianti
  "sicilia", "siciliana", "siciliano", "siciliane", "siciliani",
  "palermo", "catania", "messina", "agrigento", "caltanissetta",
  "enna", "ragusa", "siracusa", "trapani",
  // Codici provincia (con spazi per evitare falsi positivi)
  " pa ", " ct ", " me ", " ag ", " cl ", " en ", " rg ", " sr ", " tp ",
  // Stazioni e linee ferroviarie siciliane
  "palermo centrale", "catania centrale", "messina centrale",
  "linea messina", "linea palermo", "linea catania",
  "circumetnea",
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

function isSicilia(text: string): boolean {
  const lower = ` ${text.toLowerCase()} `;
  return SICILIA_RAIL_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

const DISRUPTION_KEYWORDS = [
  "interrupt", "soppres", "ritard", "cancel", "guasto",
  "emergenz", "incidente", "fermo", "sospens", "lavori",
];

function extractXmlTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseRFIRss(xml: string): ParsedIngestionEvent[] {
  const events: ParsedIngestionEvent[] = [];
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = stripHtml(extractXmlTag(item, "title"));
    const link = extractXmlTag(item, "link");
    const description = stripHtml(extractXmlTag(item, "description"));
    const pubDate = extractXmlTag(item, "pubDate");
    if (!title || !pubDate) continue;

    const combined = ` ${title} ${description} `.toLowerCase();
    if (!isSicilia(combined)) continue;

    const isDisruption = DISRUPTION_KEYWORDS.some((kw) => combined.includes(kw));
    const severity = isDisruption ? "ALTA" : "MEDIA";

    events.push({
      title: title.slice(0, 200),
      category: "TRASPORTI" as const,
      severity,
      description: (description || title).slice(0, 500),
      source: "RFI",
      sourceUrl: link || "https://www.rfi.it",
      lat: 37.5,
      lng: 14.0,
      place: "Sicilia",
      publishedAt: new Date(pubDate),
      hashDedup: createDedupHash("RFI", title, pubDate),
      rawJson: { title, link, pubDate },
    });
  }

  return events;
}

// RFI pubblica comunicati stampa e news — proviamo più URL possibili
const RFI_FEED_URLS = [
  "https://www.rfi.it/it/comunicati-stampa.html?type=97",
  "https://www.rfi.it/it/news.html?type=97",
  "https://www.rfi.it/rss",
];

export async function fetchRFIEvents(): Promise<ParsedIngestionEvent[]> {
  for (const url of RFI_FEED_URLS) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": "EmergenzaSicilia/1.0" },
      });
      if (!res.ok) continue;

      const text = await res.text();
      if (!text.includes("<rss") && !text.includes("<feed") && !text.includes("<item>")) continue;

      return parseRFIRss(text);
    } catch {
      continue;
    }
  }
  return [];
}
