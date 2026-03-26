import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { SeverityBadge } from "@/components/events/severity-badge";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

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

const LOCALES = ["it", "en"];

const CATEGORY_ICONS: Record<string, string> = {
  TERREMOTO: "🔴",
  MALTEMPO:  "🌧️",
  TRAFFICO:  "🚗",
  ERUZIONE:  "🌋",
  INCENDIO:  "🔥",
  ALLERTA:   "⚠️",
  TRASPORTI: "🚂",
};

const ALL_CATEGORIES = ["TERREMOTO", "MALTEMPO", "TRAFFICO", "ERUZIONE", "INCENDIO", "ALLERTA", "TRASPORTI"];

type Severity = "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
const SEVERITY_ORDER: Severity[] = ["BASSA", "MEDIA", "ALTA", "CRITICA"];

export async function generateStaticParams() {
  const params: { locale: string; provincia: string }[] = [];
  for (const locale of LOCALES) {
    for (const prov of PROVINCE) {
      params.push({ locale, provincia: prov.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { provincia: string };
}): Promise<Metadata> {
  const prov = PROVINCE.find((p) => p.slug === params.provincia);
  if (!prov) return {};

  const title = `Allerte e Emergenze a ${prov.nome} — Emergenza Sicilia`;
  const description = `Situazione in tempo reale sulle emergenze nella provincia di ${prov.nome}: terremoti, maltempo, incendi, allerte protezione civile e molto altro.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProvinciaPage({
  params,
}: {
  params: { provincia: string; locale: string };
}) {
  const prov = PROVINCE.find((p) => p.slug === params.provincia);
  if (!prov) notFound();

  const [events, feedItems, categoryStats] = await Promise.all([
    prisma.event.findMany({
      where: { provincia: prov.codice, status: { not: "CHIUSO" } },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        id: true, title: true, category: true, severity: true,
        description: true, source: true, publishedAt: true, provincia: true, status: true,
      },
    }),
    prisma.sourceItem.findMany({
      where: {
        OR: [
          { title: { contains: prov.nome, mode: "insensitive" } },
          { title: { contains: prov.slug, mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: { id: true, source: true, title: true, url: true, publishedAt: true },
    }),
    prisma.event.groupBy({
      by: ["category"],
      where: { provincia: prov.codice, status: { not: "CHIUSO" } },
      _count: true,
    }),
  ]);

  const maxSev = events.reduce<Severity>((max, e) => {
    const sev = e.severity as Severity;
    return SEVERITY_ORDER.indexOf(sev) > SEVERITY_ORDER.indexOf(max) ? sev : max;
  }, "BASSA");

  const lastEvent = events[0];
  const lastEventTime = lastEvent
    ? (() => {
        const diffMs = Date.now() - new Date(lastEvent.publishedAt).getTime();
        const m = Math.floor(diffMs / 60000);
        if (m < 1) return "ora";
        if (m < 60) return `${m} min fa`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h fa`;
        return `${Math.floor(h / 24)}g fa`;
      })()
    : null;

  const serializedEvents = events.map((e) => ({
    ...e,
    publishedAt: e.publishedAt.toISOString(),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Allerte e Emergenze a ${prov.nome}`,
    description: `Situazione in tempo reale sulle emergenze nella provincia di ${prov.nome}, Sicilia.`,
    areaServed: {
      "@type": "AdministrativeArea",
      name: `Provincia di ${prov.nome}`,
      containedInPlace: {
        "@type": "State",
        name: "Sicilia",
        containedInPlace: {
          "@type": "Country",
          name: "Italia",
        },
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-es-navy to-es-blue text-white py-10 px-4">
        <div className="mx-auto max-w-content">
          {/* Breadcrumb */}
          <nav className="text-sm font-body text-white/60 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/allerte" className="hover:text-white transition-colors">Allerte</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-semibold">{prov.nome}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2 leading-tight">
                📍 Allerte a {prov.nome}
              </h1>
              <p className="text-white/70 font-body text-sm">
                {events.length} eventi attivi
                {lastEventTime && ` · Ultima allerta: ${lastEventTime}`}
              </p>
            </div>
            {events.length > 0 && (
              <div className="shrink-0">
                <SeverityBadge severity={maxSev} />
              </div>
            )}
          </div>

          {/* Category stats */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {ALL_CATEGORIES.map((cat) => {
              const count = categoryStats.find((s) => s.category === cat)?._count ?? 0;
              return (
                <div
                  key={cat}
                  className="bg-white/10 border border-white/20 rounded-xl p-3 text-center hover:bg-white/15 transition-colors"
                >
                  <div className="text-2xl mb-1" aria-hidden="true">{CATEGORY_ICONS[cat]}</div>
                  <div className="text-2xl font-heading font-bold text-white">{count}</div>
                  <div className="text-[10px] text-white/70 font-body capitalize mt-0.5 leading-tight">
                    {cat.toLowerCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Page content */}
      <div className="mx-auto max-w-content px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events list */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2 font-heading text-es-text">
                Eventi attivi — {prov.nome}
              </h2>
            </div>
            <EventList events={serializedEvents} />
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Alert CTA */}
            <div className="bg-es-blue rounded-card p-5 text-white">
              <h3 className="text-lg font-heading font-bold mb-2">🔔 Imposta Alert</h3>
              <p className="text-sm text-white/80 font-body mb-4 leading-relaxed">
                Ricevi notifiche per le emergenze in provincia di {prov.nome}.
              </p>
              <Link
                href="/alert"
                className="block bg-white text-es-blue text-center py-2.5 rounded-lg font-heading font-semibold text-sm hover:bg-white/90 transition-colors duration-150"
              >
                Configura alert gratuiti
              </Link>
            </div>

            {/* Province links */}
            <div className="bg-es-bg rounded-card border border-es-border p-5">
              <h3 className="text-h3 font-heading text-es-text mb-3">Altre province</h3>
              <div className="flex flex-wrap gap-2">
                {PROVINCE.filter((p) => p.slug !== prov.slug).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/allerte/${p.slug}`}
                    className="text-xs bg-white border border-es-border text-es-text font-heading font-semibold px-3 py-1.5 rounded-chip hover:border-es-blue/40 hover:text-es-blue transition-colors"
                  >
                    {p.nome}
                  </Link>
                ))}
              </div>
            </div>

            {/* Ultime notizie per provincia */}
            {feedItems.length > 0 && (
              <div>
                <h3 className="text-h3 font-heading text-es-text mb-3">
                  Ultime notizie — {prov.nome}
                </h3>
                <div className="space-y-2">
                  {feedItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white rounded-lg p-3 hover:shadow-sm transition-shadow border border-es-border hover:border-es-blue/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold uppercase">
                          {item.source}
                        </span>
                        <time className="text-[10px] text-es-text-secondary font-body">
                          {new Date(item.publishedAt).toLocaleString("it-IT", {
                            day: "2-digit", month: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p className="text-sm font-body text-es-text line-clamp-2">{item.title}</p>
                    </a>
                  ))}
                </div>
                <Link href="/fonti" className="block text-es-blue text-sm font-heading font-semibold mt-3 hover:underline">
                  Tutte le fonti ufficiali →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
