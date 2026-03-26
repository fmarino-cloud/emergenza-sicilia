import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// NASA FIRMS — Active fire detections via VIIRS SNPP NRT
// API docs: https://firms.modaps.eosdis.nasa.gov/api/area/
// Endpoint format: https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/{SOURCE}/{BBOX}/{DAYS}
// BBOX for Sicily: west=11.93, south=36.62, east=15.65, north=38.28

const SICILIA_BBOX = "11.93,36.62,15.65,38.28";
const FIRMS_SOURCE = "VIIRS_SNPP_NRT";
const FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

// Column names in VIIRS CSV (from FIRMS documentation)
// latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
const CONFIDENCE_HIGH_THRESHOLD = 50; // nominal confidence value to include

function parseFIRMSCSV(csv: string): ParsedIngestionEvent[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const latIdx      = headers.indexOf("latitude");
  const lngIdx      = headers.indexOf("longitude");
  const dateIdx     = headers.indexOf("acq_date");
  const timeIdx     = headers.indexOf("acq_time");
  const confIdx     = headers.indexOf("confidence");
  const frpIdx      = headers.indexOf("frp");     // Fire Radiative Power MW
  const briIdx      = headers.indexOf("bright_ti4");
  const daynightIdx = headers.indexOf("daynight");

  if (latIdx === -1 || lngIdx === -1) return [];

  const events: ParsedIngestionEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 4) continue;

    const lat = parseFloat(cols[latIdx] ?? "");
    const lng = parseFloat(cols[lngIdx] ?? "");
    if (isNaN(lat) || isNaN(lng)) continue;

    const confRaw = cols[confIdx] ?? "";
    // Confidence can be "h" (high), "n" (nominal), "l" (low) or a numeric 0-100
    let confNum = 0;
    if (confRaw === "h") confNum = 100;
    else if (confRaw === "n") confNum = 50;
    else if (confRaw === "l") confNum = 30;
    else confNum = parseInt(confRaw, 10) || 0;

    if (confNum < CONFIDENCE_HIGH_THRESHOLD) continue;

    const acqDate = cols[dateIdx] ?? "";
    const acqTime = cols[timeIdx] ?? "";
    let publishedAt: Date;
    try {
      // acq_time is HHMM format
      const hh = acqTime.slice(0, 2).padStart(2, "0");
      const mm = acqTime.slice(2, 4).padStart(2, "0");
      publishedAt = new Date(`${acqDate}T${hh}:${mm}:00Z`);
      if (isNaN(publishedAt.getTime())) publishedAt = new Date();
    } catch {
      publishedAt = new Date();
    }

    const frp = frpIdx !== -1 ? parseFloat(cols[frpIdx] ?? "") : NaN;
    const brightness = briIdx !== -1 ? parseFloat(cols[briIdx] ?? "") : NaN;
    const daynight = daynightIdx !== -1 ? (cols[daynightIdx] ?? "D").trim() : "D";

    // Determine severity from FRP (Fire Radiative Power, MW)
    let severity: "BASSA" | "MEDIA" | "ALTA" | "CRITICA" = "MEDIA";
    if (!isNaN(frp)) {
      if (frp >= 100) severity = "CRITICA";
      else if (frp >= 30) severity = "ALTA";
      else if (frp >= 10) severity = "MEDIA";
      else severity = "BASSA";
    } else {
      // Fallback: use confidence
      if (confNum >= 80) severity = "ALTA";
    }

    const frpStr = !isNaN(frp) ? ` FRP ${frp.toFixed(0)} MW` : "";
    const confStr = `conf. ${confNum}%`;
    const timeStr = daynight === "D" ? "diurno" : "notturno";
    const title = `NASA FIRMS — Incendio attivo (${timeStr}, ${confStr}${frpStr}) — Lat ${lat.toFixed(3)}, Lng ${lng.toFixed(3)}`;

    events.push({
      title: title.slice(0, 200),
      category: "INCENDIO",
      severity,
      description: `Rilevamento incendio attivo VIIRS SNPP: ${confStr}${frpStr}. Coordindate: ${lat.toFixed(4)}, ${lng.toFixed(4)}. Rilevamento ${timeStr}.${!isNaN(brightness) ? ` Temperatura brillanza: ${brightness.toFixed(0)} K.` : ""}`,
      source: "NASA_FIRMS",
      sourceUrl: `https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${lng.toFixed(3)},${lat.toFixed(3)},12z`,
      lat,
      lng,
      place: "Sicilia",
      publishedAt,
      hashDedup: createDedupHash("NASA_FIRMS", `${lat.toFixed(4)}-${lng.toFixed(4)}`, acqDate + acqTime),
      rawJson: { lat, lng, confidence: confNum, frp, acqDate, acqTime, brightness },
    });
  }

  return events;
}

export async function fetchNASAFIRMSEvents(): Promise<ParsedIngestionEvent[]> {
  const apiKey = process.env.NASA_FIRMS_API_KEY;
  if (!apiKey) {
    console.warn("[NASA_FIRMS] NASA_FIRMS_API_KEY not set — skipping");
    return [];
  }

  const url = `${FIRMS_BASE}/${apiKey}/${FIRMS_SOURCE}/${SICILIA_BBOX}/1`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[NASA_FIRMS] HTTP ${res.status} — ${await res.text().catch(() => "")}`);
      return [];
    }
    const csv = await res.text();
    // If API key is invalid, FIRMS returns an error message (not CSV)
    if (csv.trim().startsWith("Error") || csv.trim().startsWith("error") || !csv.includes("latitude")) {
      console.warn(`[NASA_FIRMS] Unexpected response: ${csv.slice(0, 200)}`);
      return [];
    }
    return parseFIRMSCSV(csv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[NASA_FIRMS] Error: ${msg}`);
    return [];
  }
}
