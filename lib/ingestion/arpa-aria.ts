import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// ARPA Sicilia - Qualità dell'aria
// Open data from dati.regione.sicilia.it (CKAN portal)
// The datasets are annual ZIP files containing CSV/JSON data.
// For real-time data there is no documented public REST API.
// We download the most recent available annual dataset CSV and generate
// ALLERTA events for stations exceeding EU threshold values:
//   PM10 > 50 µg/m³ (daily limit)
//   NO2  > 100 µg/m³
//   O3   > 120 µg/m³ (8h mean target)

// CKAN dataset pattern (validated 2025 data available from Jan 2026)
const DATASET_URLS = [
  "https://dati.regione.sicilia.it/dataset/arpa-qualita-aria-2025",
  "https://dati.regione.sicilia.it/dataset/arpa-qualita-aria-2024",
];

// Direct CSV download URL pattern from CKAN (zip files discovered from anagrafica page)
// We attempt the CKAN API to get the latest resource URLs
const CKAN_API_BASE = "https://dati.regione.sicilia.it/api/3/action/package_show?id=";

interface CKANResource {
  id: string;
  url: string;
  name: string;
  format: string;
  last_modified?: string;
}

interface CKANPackage {
  success: boolean;
  result?: { resources: CKANResource[] };
}

const THRESHOLDS: Record<string, { limit: number; severity: "MEDIA" | "ALTA" | "CRITICA" }> = {
  PM10: { limit: 50, severity: "ALTA" },
  NO2:  { limit: 100, severity: "ALTA" },
  O3:   { limit: 120, severity: "MEDIA" },
  PM25: { limit: 25, severity: "ALTA" },
  SO2:  { limit: 125, severity: "CRITICA" },
  CO:   { limit: 10000, severity: "CRITICA" },
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectPollutant(colName: string): string | null {
  const upper = colName.toUpperCase().replace(/[^A-Z0-9]/g, "");
  for (const p of Object.keys(THRESHOLDS)) {
    const pclean = p.replace(/[^A-Z0-9]/g, "");
    if (upper.includes(pclean)) return p;
  }
  return null;
}

async function fetchAndParseCSV(url: string): Promise<ParsedIngestionEvent[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const text = await res.text();

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  // Find column indices: station name, pollutant, value, date, lat, lng
  const stationIdx = headers.findIndex((h) => /station|stazion|nome/i.test(h));
  const pollutantIdx = headers.findIndex((h) => /inquinan|pollutant|param/i.test(h));
  const valueIdx = headers.findIndex((h) => /valore|value|concentraz/i.test(h));
  const dateIdx = headers.findIndex((h) => /data|date|giorno/i.test(h));
  const latIdx = headers.findIndex((h) => /lat/i.test(h));
  const lngIdx = headers.findIndex((h) => /lon|lng|long/i.test(h));

  if (valueIdx === -1) return [];

  const events: ParsedIngestionEvent[] = [];

  for (let i = 1; i < Math.min(lines.length, 5000); i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const rawValue = cols[valueIdx] ?? "";
    const value = parseFloat(rawValue.replace(",", "."));
    if (isNaN(value)) continue;

    // Try to determine which pollutant this row is for
    let pollutant: string | null = null;
    if (pollutantIdx !== -1) {
      pollutant = detectPollutant(cols[pollutantIdx] ?? "");
    } else {
      // Maybe the header itself encodes the pollutant
      pollutant = detectPollutant(headers[valueIdx] ?? "");
    }
    if (!pollutant) continue;

    const threshold = THRESHOLDS[pollutant];
    if (!threshold || value <= threshold.limit) continue;

    const station = stationIdx !== -1 ? (cols[stationIdx] ?? "").trim() : "n/d";
    const rawDate = dateIdx !== -1 ? (cols[dateIdx] ?? "").trim() : "";
    const publishedAt = rawDate ? new Date(rawDate) : new Date();
    const latRaw = latIdx !== -1 ? parseFloat((cols[latIdx] ?? "").replace(",", ".")) : NaN;
    const lngRaw = lngIdx !== -1 ? parseFloat((cols[lngIdx] ?? "").replace(",", ".")) : NaN;
    const lat = isNaN(latRaw) ? 37.5 : latRaw;
    const lng = isNaN(lngRaw) ? 14.0 : lngRaw;

    const title = `ARPA Aria — ${pollutant} ${value} µg/m³ (soglia ${threshold.limit}) — ${station}`;

    events.push({
      title: title.slice(0, 200),
      category: "ALLERTA",
      severity: threshold.severity,
      description: `Superamento soglia ${pollutant}: ${value} µg/m³ rilevato dalla stazione "${station}". Limite: ${threshold.limit} µg/m³.`,
      source: "ARPA_ARIA",
      sourceUrl: url,
      lat,
      lng,
      place: station || "Sicilia",
      publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
      hashDedup: createDedupHash("ARPA_ARIA", `${station}-${pollutant}-${value}`, rawDate || new Date().toISOString().slice(0, 10)),
      rawJson: { station, pollutant, value, rawDate },
    });
  }

  return events;
}

async function getCSVUrlFromCKAN(datasetId: string): Promise<string | null> {
  try {
    const res = await fetch(`${CKAN_API_BASE}${datasetId}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: CKANPackage = await res.json();
    if (!data.success || !data.result) return null;
    // Prefer CSV resources
    const csvResource = data.result.resources.find((r) => r.format?.toUpperCase() === "CSV");
    return csvResource?.url ?? null;
  } catch {
    return null;
  }
}

export async function fetchARPAAriaEvents(): Promise<ParsedIngestionEvent[]> {
  try {
    // Try CKAN API first for each dataset year
    for (const datasetUrl of DATASET_URLS) {
      const datasetId = datasetUrl.split("/").pop() ?? "";
      const csvUrl = await getCSVUrlFromCKAN(datasetId);
      if (csvUrl) {
        const events = await fetchAndParseCSV(csvUrl);
        if (events.length > 0) return events;
      }
    }
    // If CKAN API didn't yield results, try known direct CSV URLs (zip format)
    // The anagrafica dataset exposes a stations CSV (not time-series, but useful for validation)
    // ZIP files can't be parsed without decompression lib – skip and return empty
    console.warn("[ARPA_ARIA] No accessible real-time CSV endpoint found. Dataset URLs are ZIP files or require auth.");
    return [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ARPA_ARIA] Error: ${msg}`);
    return [];
  }
}
