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
  {
    key: "PC_NATIONAL",
    name: "Protezione Civile Nazionale",
    description: "Comunicati e allerte del Dipartimento della Protezione Civile nazionale, filtrati per Sicilia",
    url: "https://www.protezionecivile.gov.it",
  },
  {
    key: "PC_SICILIA",
    name: "Protezione Civile Sicilia",
    description: "Avvisi regionali su rischio incendi, ondate di calore e allerta idrogeologica",
    url: "https://www.protezionecivilesicilia.it",
  },
  {
    key: "ARPA_ARIA",
    name: "ARPA Sicilia — Qualità dell'Aria",
    description: "Superamenti soglia PM10, NO2 e O3 dalla rete di monitoraggio ARPA Sicilia",
    url: "https://www.arpa.sicilia.it/temi-ambientali/aria/",
  },
  {
    key: "ARPA_PREVISIONI",
    name: "ARPA Sicilia — Previsioni Aria 72h",
    description: "Previsioni qualità dell'aria a 72 ore per la Sicilia",
    url: "https://www.arpa.sicilia.it/temi-ambientali/aria/previsioni-della-qualita-dellaria-in-sicilia/",
  },
  {
    key: "ISPRA_MARE",
    name: "ISPRA — Rete Mareografica Nazionale",
    description: "Livello del mare e condizioni meteo-marine dalle stazioni siciliane",
    url: "https://www.mareografico.it",
  },
  {
    key: "NASA_FIRMS",
    name: "NASA FIRMS — Incendi Attivi",
    description: "Rilevamenti satellitari VIIRS SNPP di incendi attivi in Sicilia",
    url: "https://firms.modaps.eosdis.nasa.gov",
  },
  {
    key: "CCISS",
    name: "CCISS – Viaggiare Informati e Sicuri",
    description: "Centro Coordinamento Informazioni sulla Sicurezza Stradale. Feed RSS con avvisi traffico, incidenti e viabilità sulle strade siciliane.",
    url: "https://www.viaggiareinformati.it",
  },
  {
    key: "METEOALARM",
    name: "Meteoalarm – Allerte Meteo Europee",
    description: "Sistema europeo di allerta meteo. Fornisce avvisi ufficiali di livello giallo/arancione/rosso per la Sicilia.",
    url: "https://www.meteoalarm.org",
  },
  {
    key: "SIAS",
    name: "SIAS – Servizio Agrometeorologico Siciliano",
    description: "Rete di stazioni meteo siciliane. Dati di precipitazioni, vento e temperatura in tempo reale per le 9 province.",
    url: "https://www.sias.regione.sicilia.it",
  },
  {
    key: "PC_SICILIA_IDRO",
    name: "PC Sicilia — Avvisi Idrogeologici",
    description: "Avvisi di rischio idrogeologico emessi dal Dipartimento Regionale della Protezione Civile Siciliana.",
    url: "https://www.protezionecivilesicilia.it",
  },
  {
    key: "PC_SICILIA_INCENDI",
    name: "PC Sicilia — Avvisi Incendi e Calore",
    description: "Avvisi di rischio incendi boschivi e ondate di calore emessi dalla Protezione Civile Siciliana.",
    url: "https://www.protezionecivilesicilia.it",
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
