import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SeverityBadge } from "@/components/events/severity-badge";
import { ShareButton } from "@/components/events/share-button";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { title: true, description: true },
  });
  if (!event) return {};
  return {
    title: `${event.title} — Emergenza Sicilia`,
    description: event.description.slice(0, 160),
    openGraph: { title: event.title, description: event.description.slice(0, 160), type: "article" },
    twitter: { card: "summary", title: event.title, description: event.description.slice(0, 160) },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  TERREMOTO: "Terremoto", MALTEMPO: "Maltempo", TRAFFICO: "Traffico",
  ERUZIONE: "Eruzione", INCENDIO: "Incendio", ALLERTA: "Allerta", TRASPORTI: "Trasporti",
};

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      sourceItem: true,
      reports: {
        where: { status: "APPROVATO" },
        orderBy: { createdAt: "desc" },
        select: { id: true, text: true, lat: true, lng: true, reliabilityScore: true, createdAt: true },
      },
    },
  });

  if (!event) notFound();

  const relatedEditorials = await prisma.editorialPost.findMany({
    where: { paywall: "FREE" },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { id: true, title: true, slug: true, readingTime: true, imageUrl: true },
  });

  return (
    <div className="mx-auto max-w-content px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-es-text-secondary mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-es-blue">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-es-text">{CATEGORY_LABELS[event.category]}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-es-blue/10 text-es-blue text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
            {CATEGORY_LABELS[event.category] ?? event.category}
          </span>
          <SeverityBadge severity={event.severity} />
          <span className={`text-xs px-2 py-0.5 rounded-chip font-heading font-semibold ${
            event.status === "CHIUSO" ? "bg-gray-100 text-gray-500" :
            event.status === "MONITORAGGIO" ? "bg-es-yellow/10 text-es-yellow" :
            "bg-es-green/10 text-es-green"
          }`}>
            {event.status}
          </span>
        </div>
        <h1 className="text-h1 font-heading text-es-text mb-3 leading-tight">{event.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-es-text-secondary font-body">
          <span>Fonte: <strong className="font-medium text-es-text">{event.source}</strong></span>
          <time dateTime={event.publishedAt.toISOString()}>
            {event.publishedAt.toLocaleString("it-IT")}
          </time>
          {event.provincia && (
            <span>📍 {event.comune ? `${event.comune} (${event.provincia})` : event.provincia}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-es-bg rounded-card p-6 border border-es-border">
            <p className="text-body font-body text-es-text leading-relaxed">{event.description}</p>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-4 text-es-blue text-sm font-heading font-semibold hover:underline"
              >
                Vai alla fonte ufficiale →
              </a>
            )}
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span key={tag} className="bg-es-bg border border-es-border text-es-text-secondary text-xs px-2 py-1 rounded font-body">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Approved reports */}
          {event.reports.length > 0 && (
            <div>
              <h2 className="text-h3 font-heading text-es-text mb-3">
                Segnalazioni verificate ({event.reports.length})
              </h2>
              <div className="space-y-3">
                {event.reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-es-bg rounded-card p-4 border-l-4 border-l-es-green border border-es-border"
                  >
                    <p className="text-sm font-body text-es-text mb-2">{report.text}</p>
                    <div className="flex items-center gap-3 text-xs text-es-text-secondary font-body">
                      <time dateTime={report.createdAt.toISOString()}>
                        {report.createdAt.toLocaleString("it-IT")}
                      </time>
                      <span className="bg-es-green/10 text-es-green px-2 py-0.5 rounded-chip font-semibold">
                        Verificata
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Alert CTA */}
          <div className="bg-es-blue/5 rounded-card p-5 border border-es-blue/20">
            <h3 className="text-h3 font-heading text-es-text mb-2">🔔 Ricevi alert</h3>
            <p className="text-sm text-es-text-secondary font-body mb-4 leading-relaxed">
              Attiva le notifiche per eventi di tipo <strong>{CATEGORY_LABELS[event.category]?.toLowerCase()}</strong>
              {event.provincia ? ` in provincia di ${event.provincia}` : ""}.
            </p>
            <Link
              href="/alert"
              className="block bg-es-blue text-white text-center py-2.5 rounded-lg font-heading font-semibold text-sm hover:bg-es-blue-hover transition-colors"
            >
              Imposta alert
            </Link>
          </div>

          {/* Share */}
          <ShareButton title={event.title} />

          {/* Related */}
          {relatedEditorials.length > 0 && (
            <div>
              <h3 className="text-h3 font-heading text-es-text mb-3">Approfondimenti</h3>
              <div className="space-y-3">
                {relatedEditorials.map((post) => (
                  <Link key={post.id} href={`/editoriale/${post.slug}`}>
                    <div className="flex gap-3 bg-es-bg rounded-lg p-3 border border-es-border hover:border-es-blue/30 transition-colors">
                      {post.imageUrl && (
                        <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden">
                          <Image src={post.imageUrl} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-semibold text-xs text-es-text line-clamp-2 leading-snug mb-1">
                          {post.title}
                        </h4>
                        <span className="text-[10px] text-es-text-secondary font-body">
                          {post.readingTime} min
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
