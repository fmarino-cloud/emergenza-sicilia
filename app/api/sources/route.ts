import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SOURCE_META = [
  {
    key: "INGV",
    name: "Istituto Nazionale di Geofisica e Vulcanologia",
    description: "Monitoraggio sismico e vulcanico del territorio nazionale",
    url: "https://www.ingv.it",
  },
  {
    key: "PC",
    name: "Protezione Civile",
    description: "Allerte meteo, rischio idrogeologico e gestione emergenze",
    url: "https://www.protezionecivile.gov.it",
  },
  {
    key: "ANAS",
    name: "ANAS — Rete Stradale Nazionale",
    description: "Viabilità, traffico e manutenzione della rete stradale siciliana",
    url: "https://www.stradeanas.it",
  },
  {
    key: "PC_RADAR",
    name: "PC Radar — Nowcasting Precipitazioni",
    description: "Vigilanza meteorologica e nowcasting precipitazioni per la Sicilia",
    url: "https://radar.protezionecivile.it",
  },
  {
    key: "OPEN_METEO",
    name: "Open-Meteo — Meteo Province Siciliane",
    description: "Meteo operativo in tempo reale per tutte le 9 province siciliane",
    url: "https://open-meteo.com",
  },
  {
    key: "RFI",
    name: "RFI — Rete Ferroviaria Italiana",
    description: "Notizie, interruzioni e comunicazioni sulle linee ferroviarie siciliane",
    url: "https://www.rfi.it",
  },
] as const;

export async function GET() {
  const sources = await Promise.all(
    SOURCE_META.map(async (src) => {
      const recentItems = await prisma.sourceItem.findMany({
        where: { source: src.key as any },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, url: true, publishedAt: true, createdAt: true },
      });
      return { ...src, recentItems };
    })
  );
  return NextResponse.json(sources);
}
