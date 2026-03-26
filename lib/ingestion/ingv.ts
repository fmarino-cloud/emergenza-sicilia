import { createDedupHash } from "./dedup";

export interface ParsedIngestionEvent {
  title: string;
  category: "TERREMOTO" | "ERUZIONE" | "ALLERTA" | "MALTEMPO" | "TRAFFICO" | "INCENDIO" | "TRASPORTI";
  severity: "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
  description: string;
  source: string;
  sourceUrl: string;
  lat: number;
  lng: number;
  place: string;
  publishedAt: Date;
  hashDedup: string;
  rawJson: unknown;
}

interface INGVFeature {
  properties: {
    eventId: number;
    time: string;
    mag: number;
    magType: string;
    place: string;
  };
  geometry: { coordinates: [number, number, number] };
}

interface INGVGeoJSON {
  type: string;
  features: INGVFeature[];
}

function magnitudeToSeverity(mag: number): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  if (mag >= 5.0) return "CRITICA";
  if (mag >= 4.0) return "ALTA";
  if (mag >= 3.0) return "MEDIA";
  return "BASSA";
}

export function parseINGVResponse(
  data: INGVGeoJSON,
  minMagnitude = 0
): ParsedIngestionEvent[] {
  // Sicilia bbox incluse isole minori (Lampedusa lat 35.48, Pantelleria lat 36.83)
  const LAT_MIN = 35.48, LAT_MAX = 38.35, LNG_MIN = 11.93, LNG_MAX = 15.65;

  return data.features
    .filter((f) => {
      if (f.properties.mag < minMagnitude) return false;
      const [lng, lat] = f.geometry.coordinates;
      return lat >= LAT_MIN && lat <= LAT_MAX && lng >= LNG_MIN && lng <= LNG_MAX;
    })
    .map((feature) => {
      const p = feature.properties;
      const [lng, lat, depth] = feature.geometry.coordinates;
      return {
        title: `Terremoto ML ${p.mag.toFixed(1)} — ${p.place}`,
        category: "TERREMOTO" as const,
        severity: magnitudeToSeverity(p.mag),
        description: `Evento sismico ${p.magType} ${p.mag.toFixed(1)} a ${p.place}. Profondità: ${depth?.toFixed(1) ?? "n/d"} km.`,
        source: "INGV",
        sourceUrl: `https://terremoti.ingv.it/event/${p.eventId}`,
        lat,
        lng,
        place: p.place,
        publishedAt: new Date(p.time),
        hashDedup: createDedupHash("INGV", String(p.eventId), p.time),
        rawJson: feature,
      };
    });
}

// Bounding box include isole minori: Lampedusa lat ~35.50, Pantelleria lat ~36.83
const INGV_BASE =
  "https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&minmagnitude=2.0&minlatitude=35.48&maxlatitude=38.35&minlongitude=11.93&maxlongitude=15.65&orderby=time&limit=50";

export async function fetchINGVEvents(): Promise<ParsedIngestionEvent[]> {
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
  const url = `${INGV_BASE}&starttime=${startTime}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`INGV API error: ${res.status}`);
  const data = await res.json();
  return parseINGVResponse(data, 2.0);
}
