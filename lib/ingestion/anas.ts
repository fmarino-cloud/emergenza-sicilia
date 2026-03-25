import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

const SICILIA_KEYWORDS = [
  "sicilia", "siciliana", "catania", "palermo", "messina",
  "siracusa", "trapani", "agrigento", "ragusa", "caltanissetta", "enna",
  "a18", "a19", "a20", "a29", "ss114", "ss113", "ss115",
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

    const combined = `${title} ${description}`.toLowerCase();
    if (!SICILIA_KEYWORDS.some((kw) => combined.includes(kw))) continue;

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
