import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// DPC Bollettini Vigilanza Meteorologica — nowcasting/radar-based precipitation
// Repo: https://github.com/pcm-dpc/DPC-Bollettini-Vigilanza-Meteorologica

const ZONE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "Sic_A": { lat: 37.5,  lng: 15.1,  name: "Sicilia orientale" },
  "Sic_B": { lat: 38.1,  lng: 13.4,  name: "Sicilia settentrionale" },
  "Sic_C": { lat: 37.3,  lng: 13.6,  name: "Sicilia centro-meridionale" },
  "Sic_D": { lat: 37.7,  lng: 12.8,  name: "Sicilia occidentale" },
  // Fallback: partial zone key match
  "Sic":   { lat: 37.5,  lng: 14.0,  name: "Sicilia" },
};

const COLOR_TO_SEVERITY: Record<string, "MEDIA" | "ALTA" | "CRITICA"> = {
  giallo:    "MEDIA",
  gialla:    "MEDIA",
  arancione: "ALTA",
  rosso:     "CRITICA",
  rossa:     "CRITICA",
};

function getZoneCoords(key: string) {
  return ZONE_COORDS[key] ?? Object.entries(ZONE_COORDS).find(([k]) => key.startsWith(k))?.[1] ?? { lat: 37.5, lng: 14.0, name: key };
}

export async function fetchPCRadarNowcasting(): Promise<ParsedIngestionEvent[]> {
  try {
    const listRes = await fetch(
      "https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Vigilanza-Meteorologica/contents/files/json",
      { cache: "no-store", headers: { "User-Agent": "EmergenzaSicilia/1.0" } }
    );
    if (!listRes.ok) return [];

    const files: Array<{ name: string; download_url: string }> = await listRes.json();
    if (!Array.isArray(files) || !files.length) return [];

    const latest = files.sort((a, b) => b.name.localeCompare(a.name))[0];
    const dataRes = await fetch(latest.download_url, { cache: "no-store" });
    if (!dataRes.ok) return [];

    const data = await dataRes.json();
    const events: ParsedIngestionEvent[] = [];
    const publishedAt = new Date();

    const zones: Record<string, unknown> = data.zone ?? data.zones ?? data.aree ?? {};

    for (const [zoneKey, zoneData] of Object.entries(zones)) {
      if (!zoneKey.startsWith("Sic") && !zoneKey.toLowerCase().includes("sicil")) continue;

      const z = zoneData as Record<string, unknown>;
      const rawColor = (
        (z.colore ?? z.color ?? z.livello ?? z.level ?? "verde") as string
      ).toLowerCase();

      if (rawColor === "verde" || rawColor === "green") continue;
      const severity = COLOR_TO_SEVERITY[rawColor];
      if (!severity) continue;

      const coords = getZoneCoords(zoneKey);
      const phenomena: string[] = [];
      if (z.piogge)    phenomena.push(`Piogge: ${z.piogge}`);
      if (z.temporali) phenomena.push(`Temporali: ${z.temporali}`);
      if (z.vento)     phenomena.push(`Vento: ${z.vento}`);
      if (z.neve)      phenomena.push(`Neve: ${z.neve}`);

      events.push({
        title: `Nowcasting precipitazioni ${rawColor} — ${coords.name}`,
        category: "MALTEMPO" as const,
        severity,
        description: `Vigilanza meteorologica ${rawColor} per ${coords.name}. ${phenomena.join(". ") || "Condizioni meteorologiche avverse previste."}`,
        source: "PC Radar",
        sourceUrl: "https://radar.protezionecivile.it",
        lat: coords.lat,
        lng: coords.lng,
        place: coords.name,
        publishedAt,
        hashDedup: createDedupHash("PC_RADAR", `${zoneKey}-${rawColor}`, publishedAt.toISOString().slice(0, 10)),
        rawJson: { file: latest.name, zone: zoneKey, data: zoneData },
      });
    }

    return events;
  } catch {
    return [];
  }
}
