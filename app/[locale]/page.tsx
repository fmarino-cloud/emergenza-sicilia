import { prisma } from "@/lib/prisma";
import { EventList } from "@/components/events/event-list";
import { SeverityBadge } from "@/components/events/severity-badge";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Emergenza Sicilia — Situazione in tempo reale",
  description:
    "Portale di informazione in tempo reale su emergenze in Sicilia: terremoti, maltempo, traffico, eruzioni Etna, incendi, allerte protezione civile.",
  openGraph: {
    title: "Emergenza Sicilia",
    description: "Informazione in tempo reale sulle emergenze in Sicilia",
    type: "website",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  TERREMOTO: "🔴",
  MALTEMPO: "🌧️",
  TRAFFICO: "🚗",
  ERUZIONE: "🌋",
  INCENDIO: "🔥",
  ALLERTA: "⚠️",
  TRASPORTI: "🚂",
};

const ALL_CATEGORIES = ["TERREMOTO", "MALTEMPO", "TRAFFICO", "ERUZIONE", "INCENDIO", "ALLERTA", "TRASPORTI"];

export default async function HomePage() {
  const [events, feedItems, editorials, categoryStats] = await Promise.all([
    prisma.event.findMany({
      where: { status: { not: "CHIUSO" } },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: {
        id: true, title: true, category: true, severity: true,
        description: true, source: true, publishedAt: true, provincia: true, status: true,
      },
    }),
    prisma.sourceItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, source: true, title: true, url: true, publishedAt: true },
    }),
    prisma.editorialPost.findMany({
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 4,
      select: {
        id: true, title: true, slug: true, summary: true,
        type: true, featured: true, paywall: true,
        publishedAt: true, readingTime: true, imageUrl: true,
      },
    }),
    prisma.event.groupBy({
      by: ["category"],
      where: { status: { not: "CHIUSO" } },
      _count: true,
    }),
  ]);

  // Overall severity = max of active events
  const SORDER = ["BASSA", "MEDIA", "ALTA", "CRITICA"];
  const maxSev = events.reduce((max, e) => {
    return SORDER.indexOf(e.severity) > SORDER.indexOf(max) ? e.severity : max;
  }, "BASSA" as string);

  const featured = editorials.find((e) => e.featured);
  const otherEditorials = editorials.filter((e) => !e.featured).slice(0, 3);

  const serializedEvents = events.map((e) => ({
    ...e,
    publishedAt: e.publishedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-content px-4 py-6 space-y-10">
      {/* Hero: Stato attuale */}
      <section className="bg-es-bg rounded-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h1 className="text-h2 font-heading text-es-text">Situazione in tempo reale</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-es-text-secondary font-body">Livello generale:</span>
            <SeverityBadge severity={maxSev as any} />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {ALL_CATEGORIES.map((cat) => {
            const count = categoryStats.find((s) => s.category === cat)?._count ?? 0;
            return (
              <div key={cat} className="bg-white rounded-lg p-3 text-center shadow-sm border border-es-border">
                <div className="text-2xl mb-1" aria-hidden="true">{CATEGORY_ICONS[cat]}</div>
                <div className="text-xl font-heading font-bold text-es-text">{count}</div>
                <div className="text-[10px] text-es-text-secondary font-body capitalize mt-0.5 leading-tight">
                  {cat.toLowerCase()}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events list */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 font-heading text-es-text">Eventi attivi</h2>
            <Link href="/mappa" className="text-es-blue text-sm font-heading font-semibold hover:underline">
              Vedi mappa →
            </Link>
          </div>
          <EventList events={serializedEvents} />
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Alert CTA */}
          <div className="bg-es-blue/5 rounded-card p-5 border border-es-blue/20">
            <h3 className="text-h3 font-heading text-es-text mb-2">🔔 Imposta Alert</h3>
            <p className="text-sm text-es-text-secondary font-body mb-4 leading-relaxed">
              Ricevi notifiche per le emergenze nella tua zona, per le categorie che ti interessano.
            </p>
            <Link
              href="/alert"
              className="block bg-es-blue text-white text-center py-2.5 rounded-lg font-heading font-semibold text-sm hover:bg-es-blue-hover transition-colors duration-150"
            >
              Configura alert gratuiti
            </Link>
          </div>

          {/* Feed ufficiali */}
          <div>
            <h3 className="text-h3 font-heading text-es-text mb-3">Fonti ufficiali</h3>
            <div className="space-y-2">
              {feedItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-es-bg rounded-lg p-3 hover:shadow-sm transition-shadow border border-es-border hover:border-es-blue/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold uppercase">
                      {item.source}
                    </span>
                    <time className="text-[10px] text-es-text-secondary font-body">
                      {new Date(item.publishedAt).toLocaleDateString("it-IT")}
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
        </aside>
      </div>

      {/* Editorial section — full-width, prominent */}
      {editorials.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-heading text-es-text">Editoriale</h2>
            <Link href="/editoriale" className="text-es-blue text-sm font-heading font-semibold hover:underline">
              Tutti gli articoli →
            </Link>
          </div>

          {/* Featured article — 2 column hero */}
          {featured && (
            <Link href={`/editoriale/${featured.slug}`} className="block mb-6">
              <article className="grid grid-cols-1 md:grid-cols-2 bg-es-bg rounded-card overflow-hidden border border-es-border hover:shadow-lg transition-shadow duration-200">
                {featured.imageUrl && (
                  <div className="relative h-48 md:h-full min-h-[200px]">
                    <Image
                      src={featured.imageUrl}
                      alt={featured.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold uppercase">
                      {featured.type}
                    </span>
                    {featured.paywall === "PREMIUM" && (
                      <span className="text-xs bg-es-yellow/20 text-es-yellow px-2 py-0.5 rounded-chip font-heading font-semibold">
                        ⭐ Premium
                      </span>
                    )}
                  </div>
                  <h3 className="text-h2 font-heading text-es-text mb-3 leading-tight">{featured.title}</h3>
                  <p className="text-body font-body text-es-text-secondary mb-4 line-clamp-3 leading-relaxed">
                    {featured.summary}
                  </p>
                  <div className="text-xs text-es-text-secondary font-body flex items-center gap-2">
                    <span>{featured.readingTime} min di lettura</span>
                    <span>·</span>
                    <time dateTime={featured.publishedAt.toISOString()}>
                      {new Date(featured.publishedAt).toLocaleDateString("it-IT")}
                    </time>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Other editorials — 3-col grid */}
          {otherEditorials.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherEditorials.map((post) => (
                <Link key={post.id} href={`/editoriale/${post.slug}`} className="block">
                  <article className="bg-es-bg rounded-card overflow-hidden border border-es-border hover:shadow-md transition-shadow duration-150 h-full flex flex-col">
                    {post.imageUrl && (
                      <div className="relative h-40">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-es-text-secondary font-body uppercase tracking-wide">
                          {post.type}
                        </span>
                        {post.paywall === "PREMIUM" && (
                          <span className="text-[10px] bg-es-yellow/20 text-es-yellow px-1.5 py-0.5 rounded font-heading font-semibold">
                            Premium
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-semibold text-sm text-es-text mb-2 line-clamp-2 leading-snug flex-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-es-text-secondary font-body line-clamp-2 mb-3">
                        {post.summary}
                      </p>
                      <span className="text-xs text-es-text-secondary font-body">
                        {post.readingTime} min
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
