import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchINGVEvents } from "@/lib/ingestion/ingv";
import { fetchPCAlerts, parsePCAlerts } from "@/lib/ingestion/protezione-civile";
import { fetchANASEvents } from "@/lib/ingestion/anas";
import { sendPushToMatching } from "@/lib/push";

export const dynamic = "force-dynamic";

function checkSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-ingest-secret");
  return secret === process.env.INGEST_SECRET;
}

async function upsertIngestionEvent(
  parsed: Awaited<ReturnType<typeof fetchINGVEvents>>[number],
  sourceData: { source: string; type: string; category: string }
) {
  const existing = await prisma.sourceItem.findUnique({
    where: { hashDedup: parsed.hashDedup },
  });
  if (existing) return null;

  const sourceItem = await prisma.sourceItem.create({
    data: {
      source: sourceData.source as any,
      type: sourceData.type as any,
      title: parsed.title,
      text: parsed.description,
      url: parsed.sourceUrl,
      publishedAt: parsed.publishedAt,
      hashDedup: parsed.hashDedup,
      rawJson: parsed.rawJson as any,
    },
  });

  const event = await prisma.event.create({
    data: {
      title: parsed.title,
      category: sourceData.category as any,
      severity: parsed.severity,
      description: parsed.description,
      source: parsed.source,
      sourceUrl: parsed.sourceUrl,
      lat: parsed.lat,
      lng: parsed.lng,
      publishedAt: parsed.publishedAt,
      tags: [sourceData.category.toLowerCase()],
      sourceItemId: sourceItem.id,
    },
  });

  if (event.severity === "ALTA" || event.severity === "CRITICA") {
    await sendPushToMatching(event).catch(console.error);
  }

  return event;
}

export async function POST(request: NextRequest) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { ingv: 0, pc: 0, anas: 0, errors: [] as string[] };

  // INGV
  try {
    const events = await fetchINGVEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "INGV", type: "API", category: e.category });
      if (created) results.ingv++;
    }
  } catch (err: any) {
    results.errors.push(`INGV: ${err.message}`);
  }

  // Protezione Civile
  try {
    const alerts = await fetchPCAlerts();
    const events = parsePCAlerts(alerts);
    for (const e of events) {
      const created = await upsertIngestionEvent(
        { ...e, category: "ALLERTA" as any },
        { source: "PC", type: "API", category: "ALLERTA" }
      );
      if (created) results.pc++;
    }
  } catch (err: any) {
    results.errors.push(`PC: ${err.message}`);
  }

  // ANAS
  try {
    const events = await fetchANASEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "ANAS", type: "RSS", category: "TRAFFICO" });
      if (created) results.anas++;
    }
  } catch (err: any) {
    results.errors.push(`ANAS: ${err.message}`);
  }

  // Cleanup SourceItems older than 30 days
  await prisma.sourceItem.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  }).catch(console.error);

  return NextResponse.json(results);
}
