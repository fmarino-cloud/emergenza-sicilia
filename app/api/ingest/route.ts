import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchINGVEvents } from "@/lib/ingestion/ingv";
import { fetchPCAlerts, parsePCAlerts } from "@/lib/ingestion/protezione-civile";
import { fetchANASEvents } from "@/lib/ingestion/anas";
import { fetchPCRadarNowcasting } from "@/lib/ingestion/pc-radar";
import { fetchOpenMeteoEvents } from "@/lib/ingestion/open-meteo";
import { fetchRFIEvents } from "@/lib/ingestion/rfi";
import { fetchPCNationalEvents } from "@/lib/ingestion/pc-national";
import { fetchPCSiciliaEvents } from "@/lib/ingestion/pc-sicilia";
import { fetchARPAAriaEvents } from "@/lib/ingestion/arpa-aria";
import { fetchARPAPrevisioniEvents } from "@/lib/ingestion/arpa-previsioni";
import { fetchISPRAMareEvents } from "@/lib/ingestion/ispra-mare";
import { fetchNASAFIRMSEvents } from "@/lib/ingestion/nasa-firms";
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

  const results = { ingv: 0, pc: 0, anas: 0, pc_radar: 0, open_meteo: 0, rfi: 0, pc_national: 0, pc_sicilia: 0, arpa_aria: 0, arpa_previsioni: 0, ispra_mare: 0, nasa_firms: 0, errors: [] as string[] };

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

  // PC Radar (Nowcasting precipitazioni)
  try {
    const events = await fetchPCRadarNowcasting();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "PC_RADAR", type: "API", category: "MALTEMPO" });
      if (created) results.pc_radar++;
    }
  } catch (err: any) {
    results.errors.push(`PC_RADAR: ${err.message}`);
  }

  // Open-Meteo (Meteo province siciliane)
  try {
    const events = await fetchOpenMeteoEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "OPEN_METEO", type: "API", category: "MALTEMPO" });
      if (created) results.open_meteo++;
    }
  } catch (err: any) {
    results.errors.push(`OPEN_METEO: ${err.message}`);
  }

  // RFI (Ferrovie Sicilia)
  try {
    const events = await fetchRFIEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "RFI", type: "RSS", category: "TRASPORTI" });
      if (created) results.rfi++;
    }
  } catch (err: any) {
    results.errors.push(`RFI: ${err.message}`);
  }

  // PC National (Protezione Civile Nazionale RSS)
  try {
    const events = await fetchPCNationalEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "PC_NATIONAL", type: "RSS", category: e.category });
      if (created) results.pc_national++;
    }
  } catch (err: any) {
    results.errors.push(`PC_NATIONAL: ${err.message}`);
  }

  // PC Sicilia (Protezione Civile Sicilia HTML scraping)
  try {
    const events = await fetchPCSiciliaEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "PC_SICILIA", type: "RSS", category: e.category });
      if (created) results.pc_sicilia++;
    }
  } catch (err: any) {
    results.errors.push(`PC_SICILIA: ${err.message}`);
  }

  // ARPA Aria (qualità aria Sicilia)
  try {
    const events = await fetchARPAAriaEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "ARPA_ARIA", type: "API", category: "ALLERTA" });
      if (created) results.arpa_aria++;
    }
  } catch (err: any) {
    results.errors.push(`ARPA_ARIA: ${err.message}`);
  }

  // ARPA Previsioni (previsioni qualità aria 72h)
  try {
    const events = await fetchARPAPrevisioniEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "ARPA_PREVISIONI", type: "API", category: "ALLERTA" });
      if (created) results.arpa_previsioni++;
    }
  } catch (err: any) {
    results.errors.push(`ARPA_PREVISIONI: ${err.message}`);
  }

  // ISPRA Mare (rete mareografica stazioni siciliane)
  try {
    const events = await fetchISPRAMareEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "ISPRA_MARE", type: "API", category: "ALLERTA" });
      if (created) results.ispra_mare++;
    }
  } catch (err: any) {
    results.errors.push(`ISPRA_MARE: ${err.message}`);
  }

  // NASA FIRMS (incendi attivi)
  try {
    const events = await fetchNASAFIRMSEvents();
    for (const e of events) {
      const created = await upsertIngestionEvent(e, { source: "NASA_FIRMS", type: "API", category: "INCENDIO" });
      if (created) results.nasa_firms++;
    }
  } catch (err: any) {
    results.errors.push(`NASA_FIRMS: ${err.message}`);
  }

  // Cleanup SourceItems older than 30 days
  await prisma.sourceItem.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  }).catch(console.error);

  return NextResponse.json(results);
}
