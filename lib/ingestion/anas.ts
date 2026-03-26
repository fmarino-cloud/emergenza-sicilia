import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

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

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

export function parseANASRss(xml: string): ParsedIngestionEvent[] {
  const events: ParsedIngestionEvent[] = [];
  const items = xml.split("<item>").slice(1);

  for (const item of items) {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const description = extractTag(item, "description");
    const pubDate = extractTag(item, "pubDate");
    if (!title || !pubDate) continue;

    const combined = ` ${title} ${description} `.toLowerCase();
    if (!SICILIA_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()))) continue;

    events.push({
      title: title.slice(0, 200),
      category: "TRAFFICO",
      severity: "BASSA",
      description: description.slice(0, 500) || title,
      source: "ANAS",
      sourceUrl: link || "https://www.stradeanas.it",
      lat: 37.5,
      lng: 14.0,
      place: "Sicilia",
      publishedAt: new Date(pubDate),
      hashDedup: createDedupHash("ANAS", title, pubDate),
      rawJson: { title, link, pubDate },
    });
  }
  return events;
}

export async function fetchANASEvents(): Promise<ParsedIngestionEvent[]> {
  try {
    const res = await fetch(
      "https://www.stradeanas.it/it/le-strade/viabilit%C3%A0/comunicati-stampa/rss",
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return parseANASRss(await res.text());
  } catch {
    return [];
  }
}
