import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// Protezione Civile Sicilia publishes daily alerts as HTML pages and PDF links.
// News feed page: https://www.protezionecivilesicilia.it/it/news/?pageid=75
// Incendi/calore page: https://www.protezionecivilesicilia.it/it/76-rischio-incendi.asp
// No RSS feed exists; we scrape the HTML news list for alert titles and links.
//
// PC_SICILIA_IDRO and PC_SICILIA_INCENDI attempt the CKAN Open Data portal
// (https://dati.regione.siciliana.it) first; if unavailable they fall back to
// scraping the corresponding HTML section of protezionecivilesicilia.it.

const BASE_URL = "https://www.protezionecivilesicilia.it";
const NEWS_URL = `${BASE_URL}/it/news/?pageid=75`;
const IDRO_URL = `${BASE_URL}/it/news/?pageid=75`;   // idrogeologico avvisi appear in the general news feed
const INCENDI_URL = `${BASE_URL}/it/76-rischio-incendi.asp`;

// CKAN portal for Regione Siciliana open data
const CKAN_BASE = "https://dati.regione.siciliana.it/api/3/action";
const CKAN_IDRO_PACKAGE = "protezione-civile-avvisi-idrogeologico";
const CKAN_INCENDI_PACKAGE = "protezione-civile-avvisi-incendi";

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

// ---------------------------------------------------------------------------
// Helper: scrape a PC Sicilia HTML page filtering by keyword and source tag
// ---------------------------------------------------------------------------
async function scrapeHtmlAlerts(
  pageUrl: string,
  sourceTag: "PC_SICILIA_IDRO" | "PC_SICILIA_INCENDI",
  categoryFilter: ParsedIngestionEvent["category"],
  keywordFilter: string[]
): Promise<ParsedIngestionEvent[]> {
  const events: ParsedIngestionEvent[] = [];
  const res = await fetch(pageUrl, {
    cache: "no-store",
    headers: { "User-Agent": "EmergenzaSicilia/1.0 (+https://emergenzasicilia.it)" },
  });
  if (!res.ok) {
    console.warn(`[${sourceTag}] HTTP ${res.status} fetching ${pageUrl}`);
    return [];
  }
  const html = await res.text();
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const pattern = /<a\s+href="(\/it\/\d{4,6}-[^"]+\.asp)"[^>]*>([\s\S]*?)<\/a>/gi;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(html)) !== null) {
    const href = match[1];
    const rawTitle = match[2].replace(STRIP_HTML, "").trim();
    if (!rawTitle || rawTitle.length < 5) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const lower = rawTitle.toLowerCase();
    if (!keywordFilter.some((kw) => lower.includes(kw))) continue;
    const title = rawTitle.slice(0, 200);
    const publishedAt = extractDateFromTitle(title) ?? new Date();
    const fullUrl = `${BASE_URL}${href}`;
    events.push({
      title,
      category: categoryFilter,
      severity: parseSeverity(title),
      description: title,
      source: sourceTag,
      sourceUrl: fullUrl,
      lat: 37.5,
      lng: 14.0,
      place: "Sicilia",
      publishedAt,
      hashDedup: createDedupHash(sourceTag, href, publishedAt.toISOString().slice(0, 10)),
      rawJson: { href, title, sourceTag },
    });
    if (events.length >= 20) break;
  }
  return events;
}

// ---------------------------------------------------------------------------
// Helper: try CKAN package_show; return null if portal is unreachable or the
// dataset does not exist.
// ---------------------------------------------------------------------------
async function tryCKANPackage(packageId: string): Promise<{ url: string; name: string } | null> {
  try {
    const res = await fetch(
      `${CKAN_BASE}/package_show?id=${encodeURIComponent(packageId)}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json() as { success?: boolean; result?: { resources?: { url: string; name: string; format: string }[] } };
    if (!json.success || !json.result?.resources?.length) return null;
    // Prefer CSV/JSON resource; fall back to first resource
    const resource =
      json.result.resources.find((r) => /csv|json/i.test(r.format)) ??
      json.result.resources[0];
    return resource ? { url: resource.url, name: resource.name } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PC Sicilia — Avvisi Idrogeologici (PC_SICILIA_IDRO)
// ---------------------------------------------------------------------------
export async function fetchPCSiciliaIdroEvents(): Promise<ParsedIngestionEvent[]> {
  // 1. Try CKAN open data portal first
  try {
    const resource = await tryCKANPackage(CKAN_IDRO_PACKAGE);
    if (resource) {
      // Download resource and attempt to parse as JSON array or CSV
      const dataRes = await fetch(resource.url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (dataRes.ok) {
        const text = await dataRes.text();
        // Minimal JSON array parsing: look for array of objects
        if (text.trimStart().startsWith("[")) {
          try {
            const rows = JSON.parse(text) as Record<string, string>[];
            const events: ParsedIngestionEvent[] = [];
            for (const row of rows.slice(0, 20)) {
              const title = (row["titolo"] || row["title"] || row["descrizione"] || JSON.stringify(row)).slice(0, 200);
              const dateStr = row["data"] || row["date"] || row["pubblicazione"] || new Date().toISOString();
              const publishedAt = new Date(dateStr);
              events.push({
                title,
                category: "MALTEMPO",
                severity: parseSeverity(title),
                description: title,
                source: "PC_SICILIA_IDRO",
                sourceUrl: resource.url,
                lat: 37.5,
                lng: 14.0,
                place: "Sicilia",
                publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                hashDedup: createDedupHash("PC_SICILIA_IDRO", title, dateStr),
                rawJson: row,
              });
            }
            if (events.length > 0) return events;
          } catch {
            // fall through to HTML scrape
          }
        }
      }
    }
  } catch {
    // CKAN unavailable — fall through
  }

  // 2. Fall back: scrape PC Sicilia HTML news page for idrogeologico keywords
  console.warn("[PC_SICILIA_IDRO] CKAN portal non disponibile — fallback a scraping HTML PC Sicilia");
  try {
    return await scrapeHtmlAlerts(IDRO_URL, "PC_SICILIA_IDRO", "MALTEMPO", [
      "idrogeolog", "idraulic", "alluvion", "frana", "pioggia", "maltempo", "temporale",
    ]);
  } catch (err) {
    console.warn("[PC_SICILIA_IDRO] Fallback HTML scrape failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// PC Sicilia — Avvisi Incendi e Calore (PC_SICILIA_INCENDI)
// ---------------------------------------------------------------------------
export async function fetchPCSiciliaIncendiEvents(): Promise<ParsedIngestionEvent[]> {
  // 1. Try CKAN open data portal first
  try {
    const resource = await tryCKANPackage(CKAN_INCENDI_PACKAGE);
    if (resource) {
      const dataRes = await fetch(resource.url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (dataRes.ok) {
        const text = await dataRes.text();
        if (text.trimStart().startsWith("[")) {
          try {
            const rows = JSON.parse(text) as Record<string, string>[];
            const events: ParsedIngestionEvent[] = [];
            for (const row of rows.slice(0, 20)) {
              const title = (row["titolo"] || row["title"] || row["descrizione"] || JSON.stringify(row)).slice(0, 200);
              const dateStr = row["data"] || row["date"] || row["pubblicazione"] || new Date().toISOString();
              const publishedAt = new Date(dateStr);
              events.push({
                title,
                category: "INCENDIO",
                severity: parseSeverity(title),
                description: title,
                source: "PC_SICILIA_INCENDI",
                sourceUrl: resource.url,
                lat: 37.5,
                lng: 14.0,
                place: "Sicilia",
                publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                hashDedup: createDedupHash("PC_SICILIA_INCENDI", title, dateStr),
                rawJson: row,
              });
            }
            if (events.length > 0) return events;
          } catch {
            // fall through to HTML scrape
          }
        }
      }
    }
  } catch {
    // CKAN unavailable — fall through
  }

  // 2. Fall back: scrape PC Sicilia incendi/calore HTML page
  console.warn("[PC_SICILIA_INCENDI] CKAN portal non disponibile — fallback a scraping HTML PC Sicilia incendi");
  try {
    return await scrapeHtmlAlerts(INCENDI_URL, "PC_SICILIA_INCENDI", "INCENDIO", [
      "incend", "calore", "ondata", "fuoco", "boschiv", "siccit",
    ]);
  } catch (err) {
    console.warn("[PC_SICILIA_INCENDI] Fallback HTML scrape failed:", err);
    return [];
  }
}
