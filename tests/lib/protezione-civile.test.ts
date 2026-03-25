import { describe, it, expect } from "vitest";
import { parsePCAlerts, type PCAlertItem } from "@/lib/ingestion/protezione-civile";

const mockAlerts: PCAlertItem[] = [
  {
    name: "allerta_2026-03-24.json",
    date: "2026-03-24",
    zones: [
      { zone: "Sic-A", level: "arancione", phenomena: ["piogge", "temporali"] },
      { zone: "Sic-B", level: "gialla", phenomena: ["vento"] },
      { zone: "Sic-A", level: "verde", phenomena: [] },
    ],
  },
];

describe("parsePCAlerts", () => {
  it("parses non-verde Sicilia zones", () => {
    const events = parsePCAlerts(mockAlerts);
    expect(events).toHaveLength(2);
  });

  it("filters out verde zones", () => {
    const events = parsePCAlerts(mockAlerts);
    expect(events.every((e) => !e.title.includes("verde"))).toBe(true);
  });

  it("maps arancione to ALTA severity", () => {
    const events = parsePCAlerts(mockAlerts);
    const a = events.find((e) => e.title.includes("arancione"));
    expect(a?.severity).toBe("ALTA");
  });

  it("maps gialla to MEDIA severity", () => {
    const events = parsePCAlerts(mockAlerts);
    const a = events.find((e) => e.title.includes("gialla"));
    expect(a?.severity).toBe("MEDIA");
  });

  it("generates dedup hash", () => {
    const events = parsePCAlerts(mockAlerts);
    expect(events[0].hashDedup).toMatch(/^[a-f0-9]{64}$/);
  });
});
