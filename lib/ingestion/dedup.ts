import { createHash } from "crypto";

export function createDedupHash(
  source: string,
  identifier: string,
  date: string
): string {
  return createHash("sha256")
    .update(`${source}|${identifier}|${date}`)
    .digest("hex");
}
