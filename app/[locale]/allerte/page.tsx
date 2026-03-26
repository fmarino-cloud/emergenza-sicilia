import { prisma } from "@/lib/prisma";
import { SeverityBadge } from "@/components/events/severity-badge";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Allerte per Provincia — Emergenza Sicilia",
  description:
    "Situazione in tempo reale delle emergenze nelle 9 province siciliane: Palermo, Catania, Messina, Agrigento, Caltanissetta, Enna, Ragusa, Siracusa, Trapani.",
  openGraph: {
    title: "Allerte per Provincia — Emergenza Sicilia",
    description: "Mappa delle emergenze attive nelle province della Sicilia",
    type: "website",
  },
};

const PROVINCE = [
  { slug: "palermo",       nome: "Palermo",       codice: "PA" },
  { slug: "catania",       nome: "Catania",        codice: "CT" },
  { slug: "messina",       nome: "Messina",        codice: "ME" },
  { slug: "agrigento",     nome: "Agrigento",      codice: "AG" },
  { slug: "caltanissetta", nome: "Caltanissetta",  codice: "CL" },
  { slug: "enna",          nome: "Enna",            codice: "EN" },
  { slug: "ragusa",        nome: "Ragusa",          codice: "RG" },
  { slug: "siracusa",      nome: "Siracusa",        codice: "SR" },
  { slug: "trapani",       nome: "Trapani",         codice: "TP" },
];

type Severity = "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
const SEVERITY_ORDER: Severity[] = ["BASSA", "MEDIA", "ALTA", "CRITICA"];

const SEVERITY_CARD_CONFIG: Record<Severity, { border: string; bg: string }> = {
  BASSA:   { border: "border-es-green/30",  bg: "bg-es-green/5" },
  MEDIA:   { border: "border-es-yellow/40", bg: "bg-es-yellow/5" },
  ALTA:    { border: "border-es-red/30",    bg: "bg-es-red/5" },
  CRITICA: { border: "border-es-red/60",    bg: "bg-es-red/10" },
};

export default async function AllertePage() {
  // Get event counts and max severity per province
  const provinceCodes = PROVINCE.map((p) => p.codice);

  const [eventGroups, maxSeverities] = await Promise.all([
    prisma.event.groupBy({
      by: ["provincia"],
      where: {
        provincia: { in: provinceCodes },
        status: { not: "CHIUSO" },
      },
      _count: true,
    }),
    prisma.event.findMany({
      where: {
        provincia: { in: provinceCodes },
        status: { not: "CHIUSO" },
      },
      select: { provincia: true, severity: true },
    }),
  ]);

  // Build per-province stats
  const provStats = PROVINCE.map((prov) => {
    const count = eventGroups.find((g) => g.provincia === prov.codice)?._count ?? 0;
    const sevEvents = maxSeverities.filter((e) => e.provincia === prov.codice);
    const maxSev = sevEvents.reduce<Severity>((max, e) => {
      const sev = e.severity as Severity;
      return SEVERITY_ORDER.indexOf(sev) > SEVERITY_ORDER.indexOf(max) ? sev : max;
    }, "BASSA");
    return { ...prov, count, maxSev };
  });

  const totalEvents = provStats.reduce((sum, p) => sum + p.count, 0);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-es-navy to-es-blue text-white py-10 px-4">
        <div className="mx-auto max-w-content">
          {/* Breadcrumb */}
          <nav className="text-sm font-body text-white/60 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-semibold">Allerte</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2 leading-tight">
            Allerte per provincia
          </h1>
          <p className="text-white/70 font-body text-sm">
            {totalEvents} eventi attivi nelle 9 province siciliane
          </p>
        </div>
      </section>

      {/* Province grid */}
      <div className="mx-auto max-w-content px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {provStats.map((prov) => {
            const cardConf = prov.count > 0 ? SEVERITY_CARD_CONFIG[prov.maxSev] : { border: "border-es-border", bg: "" };
            return (
              <Link
                key={prov.slug}
                href={`/allerte/${prov.slug}`}
                className="block focus:outline-none focus:ring-2 focus:ring-es-blue focus:ring-offset-2 rounded-card"
              >
                <article
                  className={`bg-white rounded-card border ${cardConf.border} ${cardConf.bg} p-6 hover:shadow-md transition-shadow duration-150 h-full flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className="text-xl font-heading font-bold text-es-text">{prov.nome}</h2>
                      <span className="text-xs font-heading font-semibold text-es-text-secondary bg-es-bg border border-es-border px-2 py-0.5 rounded shrink-0">
                        {prov.codice}
                      </span>
                    </div>

                    <p className="text-3xl font-heading font-bold text-es-text mb-1">
                      {prov.count}
                    </p>
                    <p className="text-sm text-es-text-secondary font-body mb-4">
                      {prov.count === 0
                        ? "Nessun evento attivo"
                        : prov.count === 1
                        ? "evento attivo"
                        : "eventi attivi"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    {prov.count > 0 ? (
                      <SeverityBadge severity={prov.maxSev} />
                    ) : (
                      <span className="text-xs text-es-green font-heading font-semibold bg-es-green/10 px-2.5 py-0.5 rounded-chip">
                        Situazione normale
                      </span>
                    )}
                    <span className="text-es-blue text-sm font-heading font-semibold">
                      Vedi allerte →
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* Informational note */}
        <p className="text-xs text-es-text-secondary font-body mt-8 text-center">
          Dati aggiornati in tempo reale. Ultimo aggiornamento: ogni 60 secondi.
        </p>
      </div>
    </>
  );
}
