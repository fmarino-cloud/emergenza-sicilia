import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// ARPA Sicilia - Previsioni qualità dell'aria 72h
// Official page: https://www.arpa.sicilia.it/temi-ambientali/aria/previsioni-della-qualita-dellaria-in-sicilia/
// ARPA Sicilia publishes air quality forecasts as HTML pages and embedded images/maps.
// There is no documented JSON/CSV API for forecast data.
// We scrape the forecast page for the current alert level text.

const FORECAST_URL = "https://www.arpa.sicilia.it/temi-ambientali/aria/previsioni-della-qualita-dellaria-in-sicilia/";

// Regex patterns for finding forecast info in the HTML
const LEVEL_PATTERN = /(?:livello|indice|classe|qualit[àa])\s*(?:dell.aria)?\s*[:\-–]?\s*(buona|accettabile|scarsa|pessima|molto\s+buona|molto\s+scarsa|media)/gi;
const POLLUTANT_PATTERN = /(PM10|PM2\.5|PM25|NO2|O3|ozono|biossido|particolato)/gi;
const DATE_PATTERN = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})|(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g;

function levelToSeverity(level: string): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  const l = level.toLowerCase().replace(/\s+/g, " ");
  if (l.includes("pessima") || l.includes("molto scarsa")) return "CRITICA";
  if (l.includes("scarsa")) return "ALTA";
  if (l.includes("accettabile") || l.includes("media")) return "MEDIA";
  return "BASSA"; // buona, molto buona
}

function extractFirstDate(text: string): Date {
  const m = DATE_PATTERN.exec(text);
  DATE_PATTERN.lastIndex = 0;
  if (!m) return new Date();
  // Try both date formats captured
  if (m[3]) {
    // dd/mm/yyyy
    const d = new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T12:00:00Z`);
    if (!isNaN(d.getTime())) return d;
  }
  if (m[4]) {
    // yyyy/mm/dd
    const d = new Date(`${m[4]}-${m[5].padStart(2, "0")}-${m[6].padStart(2, "0")}T12:00:00Z`);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

export async function fetchARPAPrevisioniEvents(): Promise<ParsedIngestionEvent[]> {
  try {
    const res = await fetch(FORECAST_URL, {
      cache: "no-store",
      headers: { "User-Agent": "EmergenzaSicilia/1.0 (+https://emergenzasicilia.it)" },
    });
    if (!res.ok) {
      console.warn(`[ARPA_PREVISIONI] HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const text = stripHtml(html);

    const levels: string[] = [];
    let lm: RegExpExecArray | null;
    LEVEL_PATTERN.lastIndex = 0;
    while ((lm = LEVEL_PATTERN.exec(text)) !== null) {
      levels.push(lm[1]);
    }

    const pollutants: string[] = [];
    let pm: RegExpExecArray | null;
    POLLUTANT_PATTERN.lastIndex = 0;
    const seen = new Set<string>();
    while ((pm = POLLUTANT_PATTERN.exec(text)) !== null) {
      const p = pm[1].toUpperCase().replace(/\./g, "");
      if (!seen.has(p)) { seen.add(p); pollutants.push(p); }
    }

    if (levels.length === 0) {
      // No parseable forecast level found
      console.warn("[ARPA_PREVISIONI] No forecast level found in page HTML");
      return [];
    }

    const dominantLevel = levels[0];
    const severity = levelToSeverity(dominantLevel);
    const publishedAt = extractFirstDate(text);
    const today = new Date().toISOString().slice(0, 10);

    const pollutantStr = pollutants.length > 0 ? ` (${pollutants.slice(0, 3).join(", ")})` : "";
    const title = `ARPA Previsioni Aria — Qualità ${dominantLevel}${pollutantStr} — Sicilia`;

    return [
      {
        title: title.slice(0, 200),
        category: "ALLERTA",
        severity,
        description: `Previsione qualità dell'aria ARPA Sicilia (72h): qualità ${dominantLevel}. Inquinanti monitorati: ${pollutants.join(", ") || "n/d"}.`,
        source: "ARPA_PREVISIONI",
        sourceUrl: FORECAST_URL,
        lat: 37.5,
        lng: 14.0,
        place: "Sicilia",
        publishedAt,
        hashDedup: createDedupHash("ARPA_PREVISIONI", dominantLevel + pollutantStr, today),
        rawJson: { levels, pollutants, dominantLevel },
      },
    ];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ARPA_PREVISIONI] Error: ${msg}`);
    return [];
  }
}
