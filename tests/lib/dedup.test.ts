import { describe, it, expect } from "vitest";
import { createDedupHash } from "@/lib/ingestion/dedup";

describe("createDedupHash", () => {
  it("returns consistent hash for same inputs", () => {
    const h1 = createDedupHash("INGV", "12345", "2026-03-24T14:32:00Z");
    const h2 = createDedupHash("INGV", "12345", "2026-03-24T14:32:00Z");
    expect(h1).toBe(h2);
  });

  it("returns different hash for different inputs", () => {
    const h1 = createDedupHash("INGV", "12345", "2026-03-24T14:32:00Z");
    const h2 = createDedupHash("INGV", "12346", "2026-03-24T08:15:00Z");
    expect(h1).not.toBe(h2);
  });

  it("returns 64-char hex string (SHA-256)", () => {
    const h = createDedupHash("INGV", "test", "2026-01-01");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
});
