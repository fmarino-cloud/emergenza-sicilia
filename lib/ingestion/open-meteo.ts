import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// Open-Meteo — meteo operativo per le 9 province siciliane (gratuito, no API key)
// https://open-meteo.com/en/docs

const SICILIA_PROVINCES = [
  { code: "PA", name: "Palermo",       lat: 38.1157, lng: 13.3615 },
  { code: "CT", name: "Catania",       lat: 37.5079, lng: 15.0830 },
  { code: "ME", name: "Messina",       lat: 38.1938, lng: 15.5540 },
  { code: "EN", name: "Enna",          lat: 37.5653, lng: 14.2797 },
  { code: "AG", name: "Agrigento",     lat: 37.3120, lng: 13.5765 },
  { code: "CL", name: "Caltanissetta", lat: 37.4927, lng: 14.0626 },
  { code: "RG", name: "Ragusa",        lat: 36.9247, lng: 14.7259 },
  { code: "SR", name: "Siracusa",      lat: 37.0755, lng: 15.2866 },
  { code: "TP", name: "Trapani",       lat: 37.9982, lng: 12.5185 },
];

// WMO Weather Interpretation Codes
// https://open-meteo.com/en/docs#weathervariables
function wmoToSeverity(code: number): "MEDIA" | "ALTA" | "CRITICA" | null {
  if (code >= 96) return "CRITICA"; // Temporale con grandine intensa
  if (code === 95) return "ALTA";   // Temporale
  if (code === 82) return "ALTA";   // Rovesci intensi
  if (code >= 65) return "ALTA";    // Pioggia intensa
  if (code >= 80) return "MEDIA";   // Rovesci
  if (code >= 61) return "MEDIA";   // Pioggia moderata
  if (code >= 55) return "MEDIA";   // Pioviggine intensa
  return null;
}

function wmoToLabel(code: number): string {
  if (code >= 96) return "Temporale con grandine intensa";
  if (code === 95) return "Temporale";
  if (code === 82) return "Rovesci di pioggia intensi";
  if (code >= 80) return "Rovesci di pioggia";
  if (code >= 65) return "Pioggia intensa";
  if (code >= 61) return "Pioggia";
  if (code >= 55) return "Pioviggine intensa";
  return "Condizioni avverse";
}

interface OpenMeteoResponse {
  current: {
    weather_code: number;
    precipitation: number;
    wind_speed_10m: number;
    temperature_2m: number;
  };
}

export async function fetchOpenMeteoEvents(): Promise<ParsedIngestionEvent[]> {
  const events: ParsedIngestionEvent[] = [];

  for (const prov of SICILIA_PROVINCES) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${prov.lat}&longitude=${prov.lng}` +
        `&current=weather_code,precipitation,wind_speed_10m,temperature_2m` +
        `&timezone=Europe%2FRome&forecast_days=1`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;

      const data: OpenMeteoResponse = await res.json();
      const { weather_code, wind_speed_10m, precipitation } = data.current;

      const weatherSeverity = wmoToSeverity(weather_code);
      const windSeverity: "ALTA" | "CRITICA" | null =
        wind_speed_10m > 100 ? "CRITICA" : wind_speed_10m > 70 ? "ALTA" : null;

      const severity = weatherSeverity ?? windSeverity;
      if (!severity) continue;

      const label = wmoToLabel(weather_code);
      const now = new Date();
      const parts: string[] = [`${label} su ${prov.name}.`];
      if (precipitation > 0) parts.push(`Precipitazioni: ${precipitation.toFixed(1)} mm/h.`);
      if (windSeverity)       parts.push(`Vento: ${wind_speed_10m.toFixed(0)} km/h.`);

      events.push({
        title: `${label} — ${prov.name} (${prov.code})`,
        category: "MALTEMPO" as const,
        severity,
        description: parts.join(" "),
        source: "Open-Meteo",
        sourceUrl: "https://open-meteo.com",
        lat: prov.lat,
        lng: prov.lng,
        place: prov.name,
        publishedAt: now,
        // Dedup su base oraria: stesso fenomeno nella stessa provincia nelle stesse ore
        hashDedup: createDedupHash("OPEN_METEO", `${prov.code}-${weather_code}`, now.toISOString().slice(0, 13)),
        rawJson: data.current,
      });
    } catch {
      // Skip singola provincia, continua con le altre
    }
  }

  return events;
}
