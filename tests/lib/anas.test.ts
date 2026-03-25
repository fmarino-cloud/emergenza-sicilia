import { describe, it, expect } from "vitest";
import { parseANASRss } from "@/lib/ingestion/anas";

const MOCK_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>A19 Palermo-Catania: lavori in Sicilia</title>
      <link>https://www.stradeanas.it/comunicato/1</link>
      <description>Chiusura corsia autostrada A19 in Sicilia</description>
      <pubDate>Mon, 24 Mar 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>A1 Milano-Napoli: cantiere attivo</title>
      <link>https://www.stradeanas.it/comunicato/2</link>
      <description>Lavori ordinari</description>
      <pubDate>Mon, 24 Mar 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe("parseANASRss", () => {
  it("filters only Sicilia-related items", () => {
    const events = parseANASRss(MOCK_RSS);
    expect(events).toHaveLength(1);
  });

  it("sets category to TRAFFICO", () => {
    const events = parseANASRss(MOCK_RSS);
    expect(events[0].category).toBe("TRAFFICO");
  });

  it("generates dedup hash", () => {
    const events = parseANASRss(MOCK_RSS);
    expect(events[0].hashDedup).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns empty array for non-Sicily content", () => {
    const xml = MOCK_RSS
      .replace(/Sicilia/g, "Lombardia")
      .replace(/A19/g, "A1")
      .replace(/Palermo/g, "Milano")
      .replace(/Catania/g, "Torino");
    expect(parseANASRss(xml)).toHaveLength(0);
  });
});
