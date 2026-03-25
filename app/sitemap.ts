import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://emergenzasicilia.it';
  const locales = ['it', 'en'];

  // Static pages
  const staticPages = ['', '/mappa', '/fonti', '/editoriale', '/segnalazioni', '/allerte', '/premium', '/privacy'];

  const staticUrls = locales.flatMap(locale =>
    staticPages.map(page => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  );

  // Dynamic event pages
  let eventUrls: MetadataRoute.Sitemap = [];
  try {
    const events = await prisma.event.findMany({
      where: { status: { not: 'CHIUSO' } },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    eventUrls = locales.flatMap(locale =>
      events.map(event => ({
        url: `${baseUrl}/${locale}/eventi/${event.id}`,
        lastModified: event.updatedAt,
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      }))
    );
  } catch {
    // DB not available at build time
  }

  // Editorial pages
  let editorialUrls: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.editorialPost.findMany({
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    editorialUrls = locales.flatMap(locale =>
      posts.map(post => ({
        url: `${baseUrl}/${locale}/editoriale/${post.slug}`,
        lastModified: post.publishedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    );
  } catch {
    // DB not available at build time
  }

  return [...staticUrls, ...eventUrls, ...editorialUrls];
}
