import { prisma } from "./prisma";
import { createHash } from "crypto";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

export function hashIP(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET ?? "default-salt";
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}

export async function checkRateLimit(
  ipHash: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);

  const existing = await prisma.rateLimit.findUnique({
    where: { ipHash_windowStart: { ipHash, windowStart } },
  });

  if (!existing) {
    await prisma.rateLimit.create({ data: { ipHash, windowStart, count: 1 } });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: MAX_REQUESTS - existing.count - 1 };
}
