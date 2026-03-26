import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Fonti ufficiali — Emergenza Sicilia",
  description: "Le fonti ufficiali utilizzate da Emergenza Sicilia: INGV, Protezione Civile, ANAS",
};

const SOURCE_META = [
  { key: "INGV",       name: "Istituto Nazionale di Geofisica e Vulcanologia", description: "Monitoraggio sismico e vulcanico del territorio nazionale. Pubblica dati in tempo reale su terremoti e attività vulcanica.", url: "https://www.ingv.it", icon: "🔴" },
  { key: "PC",         name: "Protezione Civile", description: "Il Dipartimento della Protezione Civile emette allerte meteo, gestisce emergenze e coordina i soccorsi sul territorio nazionale.", url: "https://www.protezionecivile.gov.it", icon: "⚠️" },
  { key: "ANAS",       name: "ANAS — Rete Stradale Nazionale", description: "Gestisce la rete stradale nazionale. Pubblica comunicati su traffico, incidenti, cantieri e viabilità in tempo reale.", url: "https://www.stradeanas.it", icon: "🚗" },
  { key: "PC_RADAR",   name: "PC Radar — Nowcasting Precipitazioni", description: "Piattaforma radar della Protezione Civile per il nowcasting delle precipitazioni e dei temporali in Sicilia.", url: "https://radar.protezionecivile.it", icon: "🌧️" },
  { key: "OPEN_METEO", name: "Open-Meteo — Meteo Province Siciliane", description: "Meteo operativo in tempo reale per tutte le 9 province siciliane. Rilevamento automatico di piogge intense, temporali e vento forte.", url: "https://open-meteo.com", icon: "🌦️" },
  { key: "RFI",        name: "RFI — Rete Ferroviaria Italiana", description: "Comunicati e notizie sulla rete ferroviaria. Filtra automaticamente le informazioni relative alle linee e stazioni siciliane.", url: "https://www.rfi.it", icon: "🚂" },
] as const;

export default async function FontiPage() {
  const sources = await Promise.all(
    SOURCE_META.map(async (src) => {
      const recentItems = await prisma.sourceItem.findMany({
        where: { source: src.key as any },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { id: true, title: true, url: true, publishedAt: true },
      });
      return { ...src, recentItems };
    })
  );

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <h1 className="text-h1 font-heading text-es-text mb-2">Fonti ufficiali</h1>
      <p className="text-body font-body text-es-text-secondary mb-8">
        Emergenza Sicilia aggrega dati da fonti istituzionali e ufficiali, aggiornate automaticamente ogni 15 minuti.
      </p>

      <div className="space-y-8">
        {sources.map((src) => (
          <div key={src.key} className="bg-es-bg rounded-card border border-es-border overflow-hidden">
            <div className="p-5 border-b border-es-border">
              <div className="flex items-start gap-4">
                <span className="text-3xl" aria-hidden="true">{src.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-h3 font-heading text-es-text">{src.name}</h2>
                    <span className="text-xs bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold">
                      {src.key}
                    </span>
                  </div>
                  <p className="text-sm font-body text-es-text-secondary mt-1">{src.description}</p>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-es-blue text-sm font-heading font-semibold hover:underline"
                  >
                    Visita sito ufficiale →
                  </a>
                </div>
              </div>
            </div>

            {src.recentItems.length > 0 ? (
              <div className="divide-y divide-es-border">
                {src.recentItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-3 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-body text-es-text line-clamp-1 flex-1">{item.title}</p>
                      <time className="text-xs text-es-text-secondary font-body shrink-0">
                        {new Date(item.publishedAt).toLocaleString("it-IT", {
                          day: "2-digit", month: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-es-text-secondary font-body">
                Nessun dato recente disponibile. Gli aggiornamenti avvengono ogni 15 minuti.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
