import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// Protezione Civile Sicilia publishes daily alerts as HTML pages and PDF links.
// News feed page: https://www.protezionecivilesicilia.it/it/news/?pageid=75
// Incendi/calore page: https://www.protezionecivilesicilia.it/it/76-rischio-incendi.asp
// No RSS feed exists; we scrape the HTML news list for alert titles and links.

const BASE_URL = "https://www.protezionecivilesicilia.it";
const NEWS_URL = `${BASE_URL}/it/news/?pageid=75`;

// Pattern to match individual news items in the HTML
// Each item is a link like: <a href="/it/NNNNN-title.asp">...</a>
const ITEM_PATTERN = /<a\s+href="(\/it\/\d{4,6}-[^"]+\.asp)"[^>]*>([\s\S]*?)<\/a>/gi;
const DATE_PATTERN = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
const STRIP_HTML = /<[^>]+>/g;

function parseSeverity(text: string): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  const lower = text.toLowerCase();
  if (lower.includes("rossa") || lower.includes("critica")) return "CRITICA";
  if (lower.includes("arancione") || lower.includes("alta") || lower.includes("allerta")) return "ALTA";
  if (lower.includes("gialla") || lower.includes("attenzione") || lower.includes("preallerta")) return "MEDIA";
  return "BASSA";
}

function parseCategory(text: string): ParsedIngestionEvent["category"] {
  const lower = text.toLowerCase();
  if (lower.includes("incend") || lower.includes("calore") || lower.includes("ondata")) return "INCENDIO";
  if (lower.includes("sismico") || lower.includes("terremoto")) return "TERREMOTO";
  if (lower.includes("vulcan") || lower.includes("eruzion")) return "ERUZIONE";
  if (lower.includes("idrogeolog") || lower.includes("idraulic") || lower.includes("meteo") || lower.includes("pioggia")) return "MALTEMPO";
  return "ALLERTA";
}

function extractDateFromTitle(title: string): Date | null {
  const m = title.match(DATE_PATTERN);
  if (!m) return null;
  const [, day, month, year] = m;
  const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

export async function fetchPCSiciliaEvents(): Promise<ParsedIngestionEvent[]> {
  const events: ParsedIngestionEvent[] = [];
  try {
    const res = await fetch(NEWS_URL, {
      cache: "no-store",
      headers: { "User-Agent": "EmergenzaSicilia/1.0 (+https://emergenzasicilia.it)" },
    });
    if (!res.ok) {
      console.warn(`[PC_SICILIA] HTTP ${res.status} fetching ${NEWS_URL}`);
      return [];
    }
    const html = await res.text();

    const seen = new Set<string>();
    let match: RegExpExecArray | null;

    ITEM_PATTERN.lastIndex = 0;
    while ((match = ITEM_PATTERN.exec(html)) !== null) {
      const href = match[1];
      const rawTitle = match[2].replace(STRIP_HTML, "").trim();
      if (!rawTitle || rawTitle.length < 5) continue;
      if (seen.has(href)) continue;
      seen.add(href);

      const title = rawTitle.slice(0, 200);
      const publishedAt = extractDateFromTitle(title) ?? new Date();
      const fullUrl = `${BASE_URL}${href}`;

      events.push({
        title,
        category: parseCategory(title),
        severity: parseSeverity(title),
        description: title,
        source: "PC_SICILIA",
        sourceUrl: fullUrl,
        lat: 37.5,
        lng: 14.0,
        place: "Sicilia",
        publishedAt,
        hashDedup: createDedupHash("PC_SICILIA", href, publishedAt.toISOString().slice(0, 10)),
        rawJson: { href, title },
      });

      if (events.length >= 20) break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[PC_SICILIA] Error fetching events: ${msg}`);
    return [];
  }
  return events;
}
