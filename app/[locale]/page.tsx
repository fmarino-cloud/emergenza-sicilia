import { prisma } from "@/lib/prisma";
import { EventList } from "@/components/events/event-list";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import type { HeroMapEvent } from "@/components/map/hero-map";

const HeroMap = nextDynamic(() => import("@/components/map/hero-map"), { ssr: false });

export const dynamic = 'force-dynamic';
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

type Severity = "BASSA" | "MEDIA" | "ALTA" | "CRITICA";

const STATUS_CONFIG: Record<Severity, { label: string; badge: string; dot: string }> = {
  BASSA:   { label: "Situazione normale",  badge: "bg-green-500/20 border-green-400/50",   dot: "bg-green-400" },
  MEDIA:   { label: "Allerta moderata",    badge: "bg-yellow-500/20 border-yellow-400/50", dot: "bg-yellow-400" },
  ALTA:    { label: "Allerta alta",        badge: "bg-red-500/20 border-red-400/50",        dot: "bg-red-400" },
  CRITICA: { label: "Situazione critica",  badge: "bg-red-500/30 border-red-400",           dot: "bg-red-400 animate-pulse" },
};

export default async function HomePage() {
  const [events, feedItems, editorials, categoryStats, mapEvents] = await Promise.all([
    prisma.event.findMany({
      where: { status: { not: "CHIUSO" } },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: {
        id: true, title: true, category: true, severity: true,
        description: true, source: true, publishedAt: true, provincia: true, status: true,
        lat: true, lng: true,
      },
    }),
    prisma.sourceItem.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
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
    prisma.event.findMany({
      where: { status: { not: "CHIUSO" }, lat: { not: null }, lng: { not: null } },
      select: { id: true, title: true, category: true, severity: true, lat: true, lng: true },
    }),
  ]);

  const SORDER = ["BASSA", "MEDIA", "ALTA", "CRITICA"];
  const maxSev = (events.reduce((max, e) => {
    return SORDER.indexOf(e.severity) > SORDER.indexOf(max) ? e.severity : max;
  }, "BASSA" as string)) as Severity;

  const featured = editorials.find((e) => e.featured);
  const otherEditorials = editorials.filter((e) => !e.featured).slice(0, 3);

  const serializedEvents = events.map((e) => ({
    ...e,
    publishedAt: e.publishedAt.toISOString(),
  }));

  const heroMapEvents: HeroMapEvent[] = mapEvents.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    severity: e.severity,
    lat: e.lat as number,
    lng: e.lng as number,
  }));

  const statusConf = STATUS_CONFIG[maxSev];

  return (
    <>
      {/* Hero — mappa Sicilia full-width */}
      <section className="relative w-full h-[420px] sm:h-[500px] overflow-hidden">
        {/* Mappa */}
        <HeroMap events={heroMapEvents} />

        {/* Overlay gradiente basso */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-es-navy/90 via-es-navy/40 to-transparent z-10 pointer-events-none" />

        {/* Status badge — top right */}
        <div className="absolute top-4 right-4 z-20">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-heading font-semibold text-white backdrop-blur-sm bg-black/30",
              statusConf.badge
            )}
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", statusConf.dot)} aria-hidden="true" />
            {statusConf.label}
          </div>
        </div>

        {/* Chip categorie — bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4">
          <div className="mx-auto max-w-content">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const count = categoryStats.find((s) => s.category === cat)?._count ?? 0;
                return (
                  <div
                    key={cat}
                    className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 text-center"
                  >
                    <div className="text-xl mb-0.5" aria-hidden="true">{CATEGORY_ICONS[cat]}</div>
                    <div className="text-lg font-heading font-bold text-white">{count}</div>
                    <div className="text-[9px] text-white/70 font-body capitalize leading-tight">
                      {cat.toLowerCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Page content */}
      <div className="mx-auto max-w-content px-4 py-8 space-y-10">
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
            <div className="bg-es-blue rounded-card p-5 text-white">
              <h3 className="text-lg font-heading font-bold mb-2">🔔 Imposta Alert</h3>
              <p className="text-sm text-white/80 font-body mb-4 leading-relaxed">
                Ricevi notifiche per le emergenze nella tua zona, per le categorie che ti interessano.
              </p>
              <Link
                href="/alert"
                className="block bg-white text-es-blue text-center py-2.5 rounded-lg font-heading font-semibold text-sm hover:bg-white/90 transition-colors duration-150"
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
          </aside>
        </div>

        {/* Editorial section */}
        {editorials.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2 font-heading text-es-text">Editoriale</h2>
              <Link href="/editoriale" className="text-es-blue text-sm font-heading font-semibold hover:underline">
                Tutti gli articoli →
              </Link>
            </div>

            {/* Featured article — dark card with text overlay */}
            {featured && (
              <Link href={`/editoriale/${featured.slug}`} className="block mb-6">
                <article className="grid grid-cols-1 md:grid-cols-5 bg-es-navy rounded-card overflow-hidden hover:shadow-xl transition-shadow duration-200 min-h-[220px]">
                  {featured.imageUrl ? (
                    <div className="relative md:col-span-3 h-52 md:h-full">
                      <Image
                        src={featured.imageUrl}
                        alt={featured.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 60vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-es-navy/60 hidden md:block" />
                    </div>
                  ) : (
                    <div className="hidden md:block md:col-span-3 bg-gradient-to-br from-es-blue to-es-navy" />
                  )}
                  <div className="md:col-span-2 p-6 flex flex-col justify-center bg-es-navy">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs bg-es-blue text-white px-2 py-0.5 rounded-chip font-heading font-semibold uppercase">
                        {featured.type}
                      </span>
                      {featured.paywall === "PREMIUM" && (
                        <span className="text-xs bg-es-yellow/20 text-es-yellow px-2 py-0.5 rounded-chip font-heading font-semibold">
                          ⭐ Premium
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-white mb-3 leading-tight">{featured.title}</h3>
                    <p className="text-sm font-body text-white/70 mb-4 line-clamp-3 leading-relaxed">
                      {featured.summary}
                    </p>
                    <div className="text-xs text-white/50 font-body flex items-center gap-2">
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
                    <article className="bg-white rounded-card overflow-hidden border border-es-border hover:shadow-md transition-shadow duration-150 h-full flex flex-col">
                      {post.imageUrl ? (
                        <div className="relative h-40">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="h-1.5 bg-gradient-to-r from-es-blue to-es-green" />
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold uppercase tracking-wide">
                            {post.type}
                          </span>
                          {post.paywall === "PREMIUM" && (
                            <span className="text-[10px] bg-es-yellow/20 text-es-yellow px-1.5 py-0.5 rounded font-heading font-semibold">
                              ⭐
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-semibold text-sm text-es-text mb-2 line-clamp-2 leading-snug flex-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-es-text-secondary font-body line-clamp-2 mb-3">
                          {post.summary}
                        </p>
                        <span className="text-xs text-es-text-secondary font-body">{post.readingTime} min</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
