import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 1800; // 30 min (WP sync frequency)

export const metadata: Metadata = {
  title: "Editoriale — Emergenza Sicilia",
  description: "Articoli, interviste e approfondimenti sulle emergenze in Sicilia",
};

const TYPE_LABELS = { EDITORIALE: "Editoriale", INTERVISTA: "Intervista", APPROFONDIMENTO: "Approfondimento" };

export default async function EditorialePage({ searchParams }: { searchParams: { tipo?: string } }) {
  const type = searchParams.tipo as keyof typeof TYPE_LABELS | undefined;

  const posts = await prisma.editorialPost.findMany({
    where: type ? { type: type as any } : {},
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 20,
    select: {
      id: true, title: true, slug: true, summary: true,
      type: true, featured: true, paywall: true,
      publishedAt: true, readingTime: true, imageUrl: true,
    },
  });

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-h1 font-heading text-es-text mb-1">Editoriale</h1>
          <p className="text-sm font-body text-es-text-secondary">
            Analisi, interviste e approfondimenti sulle emergenze in Sicilia
          </p>
        </div>
        {/* Type filter */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtra per tipo">
          {[{ value: "", label: "Tutti" }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))].map((opt) => (
            <Link
              key={opt.value}
              href={opt.value ? `/editoriale?tipo=${opt.value}` : "/editoriale"}
              className={`px-3 py-1.5 rounded-chip text-xs font-heading font-semibold transition-all ${
                (type ?? "") === opt.value
                  ? "bg-es-blue text-white"
                  : "bg-es-bg border border-es-border text-es-text-secondary hover:border-es-blue hover:text-es-blue"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link key={post.id} href={`/editoriale/${post.slug}`} className="block">
            <article className="bg-es-bg rounded-card overflow-hidden border border-es-border hover:shadow-md transition-shadow duration-150 h-full flex flex-col">
              {post.imageUrl && (
                <div className="relative h-44">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover" sizes="33vw" />
                  {post.paywall === "PREMIUM" && (
                    <div className="absolute top-2 right-2 bg-es-yellow text-es-text text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
                      ⭐ Premium
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-es-text-secondary font-body uppercase tracking-wide">
                    {TYPE_LABELS[post.type as keyof typeof TYPE_LABELS]}
                  </span>
                  {post.featured && (
                    <span className="text-[10px] bg-es-blue/10 text-es-blue px-1.5 py-0.5 rounded font-heading font-semibold">
                      In evidenza
                    </span>
                  )}
                </div>
                <h2 className="font-heading font-semibold text-sm text-es-text mb-2 line-clamp-2 leading-snug flex-1">
                  {post.title}
                </h2>
                <p className="text-xs text-es-text-secondary font-body line-clamp-2 mb-3">{post.summary}</p>
                <div className="flex items-center justify-between text-xs text-es-text-secondary font-body mt-auto">
                  <span>{post.readingTime} min di lettura</span>
                  <time dateTime={post.publishedAt.toISOString()}>
                    {new Date(post.publishedAt).toLocaleDateString("it-IT")}
                  </time>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-16 text-es-text-secondary font-body">
          <p className="text-4xl mb-3">📝</p>
          <p>Nessun articolo disponibile.</p>
        </div>
      )}
    </div>
  );
}
