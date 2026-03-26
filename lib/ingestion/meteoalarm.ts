import { createDedupHash } from "./dedup";
import type { ParsedIngestionEvent } from "./ingv";

// Sicily EMMA_ID code used by MeteoAlarm
const SICILIA_GEOCODE = "IT018";
const SICILIA_KEYWORDS = [
  "sicilia", "sicily", "it018",
  "siciliana", "siciliano", "siciliane", "siciliani",
  "palermo", "catania", "messina", "agrigento", "caltanissetta",
  "enna", "ragusa", "siracusa", "trapani",
  "etna", "stromboli", "vulcano", "lipari", "eolie", "pantelleria",
  "lampedusa", "linosa", "ustica", "favignana", "marettimo",
  "stretto di messina", "canale di sicilia",
];

const FEED_URL =
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-italy";

function extractTag(xml: string, tag: string): string {
  // Match both namespaced (cap:tag) and plain tags
  const m = xml.match(new RegExp(`<(?:[a-z]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function extractCapTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<cap:${tag}[^>]*>([\\s\\S]*?)<\\/cap:${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return m ? m[1].trim() : "";
}

/**
 * Map MeteoAlarm CAP severity/event string to internal Severity.
 *
 * CAP severity values: Minor | Moderate | Severe | Extreme | Unknown
 * Event strings contain colour: "Green", "Yellow", "Orange", "Red"
 */
function mapSeverity(
  capSeverity: string,
  event: string
): "BASSA" | "MEDIA" | "ALTA" | "CRITICA" {
  const lower = `${capSeverity} ${event}`.toLowerCase();
  if (lower.includes("red") || lower.includes("extreme")) return "CRITICA";
  if (lower.includes("orange") || lower.includes("severe")) return "ALTA";
  if (lower.includes("yellow") || lower.includes("moderate")) return "MEDIA";
  return "BASSA";
}

function mapCategory(event: string): ParsedIngestionEvent["category"] {
  const lower = event.toLowerCase();
  if (lower.includes("fire") || lower.includes("forest")) return "INCENDIO";
  if (lower.includes("earthquake")) return "TERREMOTO";
  return "ALLERTA";
}

function isSicilia(geocodeValue: string, areaDesc: string): boolean {
  if (geocodeValue === SICILIA_GEOCODE) return true;
  const lower = areaDesc.toLowerCase();
  return SICILIA_KEYWORDS.some((kw) => lower.includes(kw));
}

export function parseMeteoAlarmAtom(xml: string): ParsedIngestionEvent[] {
  const events: ParsedIngestionEvent[] = [];

  // Split on <entry> boundaries
  const entries = xml.split(/<entry[\s>]/).slice(1);

  for (const entry of entries) {
    // Extract geocode value (EMMA_ID)
    const geocodeValue = (() => {
      const m = entry.match(/<value>([^<]*)<\/value>/);
      return m ? m[1].trim() : "";
    })();

    const areaDesc = extractCapTag(entry, "areaDesc");
    if (!isSicilia(geocodeValue, areaDesc)) continue;

    const capEvent = extractCapTag(entry, "event");
    const capSeverity = extractCapTag(entry, "severity");
    const capSent = extractCapTag(entry, "sent");
    const capExpires = extractCapTag(entry, "expires");
    const title = extractTag(entry, "title");
    const id = extractTag(entry, "id");

    // Get link href for the warning detail
    const linkHref = extractAttr(entry, 'link[^>]*type="application/cap\\+xml"', "href")
      || extractAttr(entry, "link", "href")
      || "https://www.meteoalarm.org";

    if (!capSent) continue;

    const publishedAt = new Date(capSent);
    if (isNaN(publishedAt.getTime())) continue;

    const severity = mapSeverity(capSeverity, capEvent);
    // Skip "Green" / BASSA alerts (informational, no emergency)
    if (severity === "BASSA") continue;

    const description = capExpires
      ? `${capEvent} per la Sicilia. Valido fino al ${new Date(capExpires).toLocaleString("it-IT")}.`
      : `${capEvent} per la Sicilia.`;

    const dedupeKey = id || title || `${geocodeValue}-${capSent}`;

    events.push({
      title: (title || `${capEvent} – Sicilia`).slice(0, 200),
      category: mapCategory(capEvent),
      severity,
      description: description.slice(0, 500),
      source: "METEOALARM",
      sourceUrl: linkHref || "https://www.meteoalarm.org",
      lat: 37.5,
      lng: 14.0,
      place: `Sicilia – ${areaDesc || "IT018"}`,
      publishedAt,
      hashDedup: createDedupHash("METEOALARM", dedupeKey, capSent),
      rawJson: { geocode: geocodeValue, areaDesc, event: capEvent, severity: capSeverity, sent: capSent, expires: capExpires },
    });
  }

  return events;
}

export async function fetchMeteoAlarmEvents(): Promise<ParsedIngestionEvent[]> {
  try {
    const res = await fetch(FEED_URL, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[METEOALARM] Feed returned HTTP ${res.status}`);
      return [];
    }
    const text = await res.text();
    if (!text.includes("<entry")) {
      console.warn("[METEOALARM] Feed response contains no <entry> elements");
      return [];
    }
    return parseMeteoAlarmAtom(text);
  } catch (err) {
    console.warn("[METEOALARM] Fetch failed:", err);
    return [];
  }
}
