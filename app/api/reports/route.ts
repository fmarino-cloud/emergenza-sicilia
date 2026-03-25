import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateReportSchema } from "@/lib/validations";
import { calculateReliability } from "@/lib/reliability";
import { checkRateLimit, hashIP } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
  const ipHashed = hashIP(ip);

  const { allowed, remaining } = await checkRateLimit(ipHashed);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppe segnalazioni. Riprova tra un'ora." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();
  const isRegistered = !!(session?.user);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const previousCount = await prisma.report.count({
    where: { ipHash: ipHashed, createdAt: { gte: dayAgo } },
  });

  const reliabilityScore = calculateReliability({
    hasLocation: !!(parsed.data.lat && parsed.data.lng),
    hasMedia: false,
    isRegistered,
    isFirstSubmission: previousCount === 0,
    textLength: parsed.data.text.length,
  });

  const report = await prisma.report.create({
    data: {
      text: parsed.data.text,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      eventId: parsed.data.eventId ?? null,
      userId: (session?.user as any)?.id ?? null,
      mediaUrls: [],
      reliabilityScore,
      ipHash: ipHashed,
    },
  });

  return NextResponse.json(
    { id: report.id, status: report.status, reliabilityScore },
    {
      status: 201,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    }
  );
}
