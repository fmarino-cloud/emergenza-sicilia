import { prisma } from "@/lib/prisma";

interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
  };
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function estimateReadingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Simple HTML sanitizer — removes scripts/iframes; in production use DOMPurify
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export async function syncWordPressPosts(
  siteId?: string
): Promise<{ synced: number; errors: number }> {
  const site = siteId ?? process.env.WP_SITE_ID ?? "emergenzasicilia.wordpress.com";
  const url = `https://public-api.wordpress.com/wp/v2/sites/${site}/posts?per_page=50&status=publish&_embed=true`;

  let synced = 0;
  let errors = 0;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`WordPress API ${res.status} for site ${site}`);
      return { synced: 0, errors: 1 };
    }

    const posts: WPPost[] = await res.json();

    for (const post of posts) {
      try {
        const content = sanitizeHtml(post.content.rendered);
        const imageUrl =
          post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;

        await prisma.editorialPost.upsert({
          where: { wpId: post.id },
          update: {
            title: stripHtml(post.title.rendered).slice(0, 200),
            slug: post.slug,
            summary: stripHtml(post.excerpt.rendered).slice(0, 300),
            content,
            publishedAt: new Date(post.date),
            readingTime: estimateReadingTime(content),
            imageUrl,
          },
          create: {
            wpId: post.id,
            title: stripHtml(post.title.rendered).slice(0, 200),
            slug: post.slug,
            summary: stripHtml(post.excerpt.rendered).slice(0, 300),
            content,
            type: "EDITORIALE",
            featured: false,
            paywall: "FREE",
            publishedAt: new Date(post.date),
            readingTime: estimateReadingTime(content),
            imageUrl,
          },
        });
        synced++;
      } catch (e) {
        console.error(`WP sync error post ${post.id}:`, e);
        errors++;
      }
    }
  } catch (e) {
    console.error("WP fetch error:", e);
    return { synced: 0, errors: 1 };
  }

  return { synced, errors };
}
