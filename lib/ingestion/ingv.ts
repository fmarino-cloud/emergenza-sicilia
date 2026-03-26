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
  return data.features
    .filter((f) => f.properties.mag >= minMagnitude)
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

const INGV_BASE =
  "https://webservices.ingv.it/fdsnws/event/1/query?format=geojson&minmagnitude=2.0&minlatitude=36&maxlatitude=38.5&minlongitude=11.5&maxlongitude=15.7&orderby=time&limit=50";

export async function fetchINGVEvents(): Promise<ParsedIngestionEvent[]> {
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
  const url = `${INGV_BASE}&starttime=${startTime}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`INGV API error: ${res.status}`);
  const data = await res.json();
  return parseINGVResponse(data, 2.0);
}
