import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// ISPRA Rete Mareografica Nazionale
// The site mareografico.it serves data via JavaScript form submissions (stazOut/stazGO).
// The CKAN dataset on dati.gov.it and Linked ISPRA expose static historic data, not real-time.
// We attempt the Linked ISPRA SPARQL / REST endpoint if available, otherwise
// we parse the public HTML page for each Sicilian station.
//
// Station IDs from mareografico.it (derived from the mappa-interattiva page):
//   Palermo     → stazione ID varies; typical slug "palermo"
//   Catania     → "catania"
//   Messina     → "messina"
//   Porto Empedocle → "porto-empedocle"
//   (Trapani is NOT in the national network per page analysis)

interface StationDef {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  provincia: string;
}

const SICILIAN_STATIONS: StationDef[] = [
  { id: "PAL", name: "Palermo",         slug: "palermo",         lat: 38.115, lng: 13.365, provincia: "PA" },
  { id: "CAT", name: "Catania",          slug: "catania",          lat: 37.502, lng: 15.090, provincia: "CT" },
  { id: "MES", name: "Messina",          slug: "messina",          lat: 38.196, lng: 15.556, provincia: "ME" },
  { id: "PEM", name: "Porto Empedocle",  slug: "porto-empedocle",  lat: 37.290, lng: 13.530, provincia: "AG" },
];

// mareografico.it station data page pattern
const STATION_DATA_URL = "https://www.mareografico.it/it/stazioni.html";

// Thresholds for storm surge / extreme water levels (cm above mean sea level)
const SURGE_THRESHOLD_MEDIA = 30;   // cm — MEDIA
const SURGE_THRESHOLD_ALTA = 50;    // cm — ALTA
const SURGE_THRESHOLD_CRITICA = 80; // cm — CRITICA

function surgeSeverity(level: number): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  if (level >= SURGE_THRESHOLD_CRITICA) return "CRITICA";
  if (level >= SURGE_THRESHOLD_ALTA) return "ALTA";
  if (level >= SURGE_THRESHOLD_MEDIA) return "MEDIA";
  return "BASSA";
}

// Attempt to parse the mareografico.it HTML page for current water level data.
// The page uses JS to render data tables, so plain fetch may only get skeleton HTML.
async function tryMareograficoHTML(): Promise<ParsedIngestionEvent[]> {
  const res = await fetch(STATION_DATA_URL, {
    cache: "no-store",
    headers: { "User-Agent": "EmergenzaSicilia/1.0 (+https://emergenzasicilia.it)" },
  });
  if (!res.ok) return [];
  const html = await res.text();

  // Look for inline data tables or JSON-LD embedded in the page
  const jsonLdMatch = html.match(/<script[^>]+type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (Array.isArray(data)) {
        const events: ParsedIngestionEvent[] = [];
        for (const row of data) {
          const stationName: string = row.station ?? row.stazione ?? row.name ?? "";
          const level: number = parseFloat(row.level ?? row.livello ?? row.LI ?? "");
          if (!stationName || isNaN(level)) continue;
          const station = SICILIAN_STATIONS.find((s) =>
            stationName.toLowerCase().includes(s.slug.replace("-", " "))
          );
          if (!station) continue;
          const severity = surgeSeverity(Math.abs(level));
          if (severity === "BASSA") continue;
          const now = new Date();
          events.push({
            title: `ISPRA Mare — Livello acqua ${level > 0 ? "+" : ""}${level} cm — ${station.name}`,
            category: "ALLERTA",
            severity,
            description: `Stazione mareografica ${station.name}: livello ${level} cm rispetto al medio. Soglia superata.`,
            source: "ISPRA_MARE",
            sourceUrl: STATION_DATA_URL,
            lat: station.lat,
            lng: station.lng,
            place: station.name,
            publishedAt: now,
            hashDedup: createDedupHash("ISPRA_MARE", `${station.id}-${level}`, now.toISOString().slice(0, 13)),
            rawJson: row,
          });
        }
        return events;
      }
    } catch {
      // not JSON
    }
  }
  return [];
}

export async function fetchISPRAMareEvents(): Promise<ParsedIngestionEvent[]> {
  try {
    // Attempt to get data from mareografico.it HTML
    const events = await tryMareograficoHTML();
    if (events.length > 0) return events;

    // The mareografico.it data tables are JavaScript-rendered and
    // the download form uses POST with session state.
    // The Linked ISPRA and Mistral APIs require registration or return
    // only historic static files.
    // Graceful degradation: return empty until a documented REST endpoint is available.
    console.warn("[ISPRA_MARE] No accessible real-time API endpoint. Data is JS-rendered on mareografico.it.");
    return [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[ISPRA_MARE] Error: ${msg}`);
    return [];
  }
}
