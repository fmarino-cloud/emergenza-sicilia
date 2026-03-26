import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

/**
 * SIAS – Servizio Informativo Agrometeorologico Siciliano
 *
 * The SIAS open-data portal (dati.regione.sicilia.it) publishes monthly
 * historical ZIP archives (JSON/CSV) for precipitation, temperature and
 * pressure. There is no public near-real-time REST endpoint; the official
 * site (http://www.sias.regione.sicilia.it) shows live pages via
 * server-side HTML rendering but does not expose a machine-readable API.
 *
 * Until an official real-time API becomes available this module:
 *  1. Warns in the server log.
 *  2. Returns an empty array so the ingestion pipeline continues normally.
 *
 * Severity thresholds (kept here for when a live feed is enabled):
 *  - Precipitation: > 20 mm/h → MEDIA | > 50 mm/h → ALTA
 *  - Wind speed:    > 70 km/h → MEDIA | > 100 km/h → ALTA
 *  - Temperature:   > 40 °C   → MEDIA | > 45 °C    → ALTA
 */

// Province capitals used as fallback coordinates when station lat/lng are unavailable.
export const PROVINCE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  PA: { lat: 38.115688, lng: 13.361267, name: "Palermo" },
  CT: { lat: 37.502669, lng: 15.087269, name: "Catania" },
  ME: { lat: 38.193958, lng: 15.554154, name: "Messina" },
  AG: { lat: 37.310769, lng: 13.576569, name: "Agrigento" },
  CL: { lat: 37.491261, lng: 14.065483, name: "Caltanissetta" },
  EN: { lat: 37.566389, lng: 14.274722, name: "Enna" },
  RG: { lat: 36.926441, lng: 14.725467, name: "Ragusa" },
  SR: { lat: 37.065774, lng: 15.29366,  name: "Siracusa" },
  TP: { lat: 37.869018, lng: 12.432637, name: "Trapani" },
};

export interface SIASStationReading {
  stationId: string;
  stationName: string;
  provincia?: string;
  lat?: number;
  lng?: number;
  /** mm/h */
  precipitation?: number;
  /** km/h */
  windSpeed?: number;
  /** °C */
  temperature?: number;
  timestamp: Date;
}

export function siasReadingToEvent(
  reading: SIASStationReading
): ParsedIngestionEvent | null {
  const alerts: { param: string; value: number; unit: string; severity: "MEDIA" | "ALTA" }[] = [];

  if (reading.precipitation !== undefined) {
    if (reading.precipitation > 50) {
      alerts.push({ param: "Precipitazioni", value: reading.precipitation, unit: "mm/h", severity: "ALTA" });
    } else if (reading.precipitation > 20) {
      alerts.push({ param: "Precipitazioni", value: reading.precipitation, unit: "mm/h", severity: "MEDIA" });
    }
  }

  if (reading.windSpeed !== undefined) {
    if (reading.windSpeed > 100) {
      alerts.push({ param: "Vento", value: reading.windSpeed, unit: "km/h", severity: "ALTA" });
    } else if (reading.windSpeed > 70) {
      alerts.push({ param: "Vento", value: reading.windSpeed, unit: "km/h", severity: "MEDIA" });
    }
  }

  if (reading.temperature !== undefined) {
    if (reading.temperature > 45) {
      alerts.push({ param: "Temperatura", value: reading.temperature, unit: "°C", severity: "ALTA" });
    } else if (reading.temperature > 40) {
      alerts.push({ param: "Temperatura", value: reading.temperature, unit: "°C", severity: "MEDIA" });
    }
  }

  if (alerts.length === 0) return null;

  const maxSeverity: "MEDIA" | "ALTA" = alerts.some((a) => a.severity === "ALTA") ? "ALTA" : "MEDIA";
  const alertList = alerts.map((a) => `${a.param}: ${a.value} ${a.unit}`).join(", ");
  const title = `SIAS – Maltempo a ${reading.stationName}: ${alertList}`;
  const description = `Stazione SIAS ${reading.stationName} (${reading.provincia ?? "Sicilia"}) rileva valori critici: ${alertList}.`;

  const provincia = reading.provincia?.toUpperCase();
  const coords =
    reading.lat && reading.lng
      ? { lat: reading.lat, lng: reading.lng }
      : provincia && PROVINCE_COORDS[provincia]
        ? { lat: PROVINCE_COORDS[provincia].lat, lng: PROVINCE_COORDS[provincia].lng }
        : { lat: 37.5, lng: 14.0 };

  const ts = reading.timestamp.toISOString();

  return {
    title: title.slice(0, 200),
    category: "MALTEMPO",
    severity: maxSeverity,
    description: description.slice(0, 500),
    source: "SIAS",
    sourceUrl: "https://www.sias.regione.sicilia.it",
    lat: coords.lat,
    lng: coords.lng,
    place: reading.stationName,
    publishedAt: reading.timestamp,
    hashDedup: createDedupHash("SIAS", `${reading.stationId}-${alertList}`, ts),
    rawJson: { ...reading, timestamp: ts },
  };
}

export async function fetchSIASEvents(): Promise<ParsedIngestionEvent[]> {
  // No public real-time API is currently available from SIAS.
  // The open-data portal only publishes monthly historical archives (up to 2022).
  // When a live endpoint becomes available, implement the fetch here and use
  // siasReadingToEvent() to convert readings to ingestion events.
  console.warn(
    "[SIAS] Nessun endpoint in tempo reale disponibile. " +
    "Il portale open data pubblica solo archivi storici mensili (ZIP). " +
    "Restituzione array vuoto – aggiornare quando sarà disponibile un'API live."
  );
  return [];
}
