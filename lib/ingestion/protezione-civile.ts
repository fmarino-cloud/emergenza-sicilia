import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

export interface PCAlertZone {
  zone: string;
  level: string;
  phenomena: string[];
}

export interface PCAlertItem {
  name: string;
  date: string;
  zones: PCAlertZone[];
}

const LEVEL_TO_SEVERITY: Record<string, "BASSA" | "MEDIA" | "ALTA" | "CRITICA"> = {
  verde: "BASSA",
  gialla: "MEDIA",
  arancione: "ALTA",
  rossa: "CRITICA",
};

const ZONE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  "Sic-A": { lat: 37.5, lng: 15.1, name: "Sicilia orientale" },
  "Sic-B": { lat: 38.1, lng: 13.4, name: "Sicilia settentrionale" },
  "Sic-C": { lat: 37.3, lng: 13.6, name: "Sicilia centro-meridionale" },
};

export function parsePCAlerts(alerts: PCAlertItem[]): ParsedIngestionEvent[] {
  const events: ParsedIngestionEvent[] = [];
  for (const alert of alerts) {
    for (const zone of alert.zones) {
      if (!zone.zone.startsWith("Sic")) continue;
      if (zone.level === "verde") continue;
      const severity = LEVEL_TO_SEVERITY[zone.level] ?? "MEDIA";
      const coords = ZONE_COORDS[zone.zone] ?? { lat: 37.5, lng: 14.0, name: zone.zone };
      events.push({
        title: `Allerta meteo ${zone.level} — ${coords.name}`,
        category: "ALLERTA" as const,
        severity,
        description: `Allerta ${zone.level} per ${zone.phenomena.join(", ")} in ${coords.name}. Data: ${alert.date}.`,
        source: "Protezione Civile",
        sourceUrl: "https://www.protezionecivile.gov.it/it/allerta-meteo",
        lat: coords.lat,
        lng: coords.lng,
        place: coords.name,
        publishedAt: new Date(alert.date),
        hashDedup: createDedupHash("PC", `${zone.zone}-${zone.level}`, alert.date),
        rawJson: { name: alert.name, zone },
      });
    }
  }
  return events;
}

export async function fetchPCAlerts(): Promise<PCAlertItem[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Meteo-Regionali/contents/files/allerte",
      { cache: "no-store", headers: { "User-Agent": "EmergenzaSicilia/1.0" } }
    );
    if (!res.ok) return [];
    const files: Array<{ name: string; download_url: string }> = await res.json();
    const sorted = files.sort((a, b) => b.name.localeCompare(a.name)).slice(0, 2);
    const alerts: PCAlertItem[] = [];
    for (const file of sorted) {
      try {
        const r = await fetch(file.download_url, { cache: "no-store" });
        const content = await r.json();
        if (!content?.zone) continue;
        const zones: PCAlertZone[] = Object.entries(content.zone)
          .filter(([k]) => k.startsWith("Sic"))
          .map(([k, v]: [string, any]) => ({
            zone: k,
            level: (v.level ?? "verde") as string,
            phenomena: Array.isArray(v.phenomena) ? v.phenomena : [],
          }));
        const date = file.name.replace(/[^0-9-]/g, "").slice(0, 10) || new Date().toISOString().slice(0, 10);
        alerts.push({ name: file.name, date, zones });
      } catch { /* skip malformed */ }
    }
    return alerts;
  } catch {
    return [];
  }
}
