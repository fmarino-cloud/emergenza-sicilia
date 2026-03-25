import { describe, it, expect } from "vitest";
import { parseINGVResponse } from "@/lib/ingestion/ingv";

const mockGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { eventId: 12345, time: "2026-03-24T14:32:00.000Z", mag: 3.2, magType: "ML", place: "3 km SE Catania (CT)", depth: 10.0 },
      geometry: { coordinates: [15.09, 37.5079, 10.0] },
    },
    {
      type: "Feature",
      properties: { eventId: 12346, time: "2026-03-24T08:15:00.000Z", mag: 1.5, magType: "ML", place: "5 km N Nicolosi (CT)", depth: 5.0 },
      geometry: { coordinates: [14.9934, 37.751, 5.0] },
    },
  ],
};

describe("parseINGVResponse", () => {
  it("parses all features", () => {
    expect(parseINGVResponse(mockGeoJSON)).toHaveLength(2);
  });

  it("extracts title with magnitude", () => {
    const events = parseINGVResponse(mockGeoJSON);
    expect(events[0].title).toContain("3.2");
  });

  it("extracts coordinates correctly (lng, lat order from GeoJSON)", () => {
    const events = parseINGVResponse(mockGeoJSON);
    expect(events[0].lat).toBeCloseTo(37.5079);
    expect(events[0].lng).toBeCloseTo(15.09);
  });

  it("assigns MEDIA severity for mag 3.2", () => {
    const events = parseINGVResponse(mockGeoJSON);
    expect(events[0].severity).toBe("MEDIA");
  });

  it("assigns BASSA severity for mag 1.5", () => {
    const events = parseINGVResponse(mockGeoJSON);
    expect(events[1].severity).toBe("BASSA");
  });

  it("filters below minMagnitude", () => {
    const events = parseINGVResponse(mockGeoJSON, 2.0);
    expect(events).toHaveLength(1);
  });

  it("generates valid SHA-256 dedup hash", () => {
    const events = parseINGVResponse(mockGeoJSON);
    expect(events[0].hashDedup).toMatch(/^[a-f0-9]{64}$/);
  });
});
