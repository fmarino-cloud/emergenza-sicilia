import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.editorialPost.findUnique({
    where: { slug: params.slug },
    select: { title: true, summary: true, imageUrl: true },
  });
  if (!post) return {};
  return {
    title: `${post.title} — Emergenza Sicilia`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  };
}

export default async function EditorialeSlugPage({ params }: { params: { slug: string } }) {
  const post = await prisma.editorialPost.findUnique({ where: { slug: params.slug } });
  if (!post) notFound();

  const isPaywalled = post.paywall === "PREMIUM";
  // In MVP, no session check on server — paywall is soft (UI only)
  // Full paywall check is on /api/editorial/[slug] which client components can call

  const truncatedContent = isPaywalled
    ? post.content.split("</p>")[0] + "</p>"
    : post.content;

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <nav className="text-sm font-body text-es-text-secondary mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-es-blue">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/editoriale" className="hover:text-es-blue">Editoriale</Link>
        <span className="mx-2">›</span>
        <span className="text-es-text line-clamp-1">{post.title}</span>
      </nav>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-es-blue/10 text-es-blue px-2 py-0.5 rounded-chip font-heading font-semibold uppercase">
              {post.type}
            </span>
            {isPaywalled && (
              <span className="text-xs bg-es-yellow/20 text-es-yellow px-2 py-0.5 rounded-chip font-heading font-semibold">
                ⭐ Premium
              </span>
            )}
          </div>
          <h1 className="text-h1 font-heading text-es-text mb-3 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-es-text-secondary font-body">
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
            </time>
            <span>·</span>
            <span>{post.readingTime} min di lettura</span>
          </div>
        </div>

        {/* Featured image */}
        {post.imageUrl && (
          <div className="relative h-64 sm:h-80 mb-6 rounded-card overflow-hidden">
            <Image src={post.imageUrl} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-sm max-w-none font-body text-es-text leading-relaxed [&_a]:text-es-blue [&_strong]:font-semibold [&_h2]:font-heading [&_h3]:font-heading"
          dangerouslySetInnerHTML={{ __html: truncatedContent }}
        />

        {/* Paywall wall */}
        {isPaywalled && (
          <div className="relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
            <div className="relative bg-white border border-es-border rounded-card p-8 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="text-h3 font-heading text-es-text mb-2">Contenuto Premium</h3>
              <p className="text-sm font-body text-es-text-secondary mb-6">
                Questo articolo è riservato agli abbonati Premium. Abbonati per accedere a tutti i contenuti.
              </p>
              <Link
                href="/premium"
                className="inline-block bg-es-blue text-white px-8 py-3 rounded-chip font-heading font-semibold text-sm hover:bg-es-blue-hover transition-colors"
              >
                Scopri Premium →
              </Link>
            </div>
          </div>
        )}

        {/* Related posts */}
        <div className="mt-12 pt-8 border-t border-es-border">
          <Link href="/editoriale" className="text-es-blue font-heading font-semibold text-sm hover:underline">
            ← Torna all&apos;Editoriale
          </Link>
        </div>
      </div>
    </div>
  );
}
