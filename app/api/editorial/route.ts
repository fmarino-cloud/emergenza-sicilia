import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? undefined;
  const limit = Math.min(Number(params.get("limit") ?? 20), 50);
  const offset = Number(params.get("offset") ?? 0);

  const where = type ? { type: type as any } : {};

  const [posts, total] = await Promise.all([
    prisma.editorialPost.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: limit,
      skip: offset,
      select: {
        id: true,
        wpId: true,
        title: true,
        slug: true,
        summary: true,
        type: true,
        featured: true,
        paywall: true,
        publishedAt: true,
        readingTime: true,
        imageUrl: true,
      },
    }),
    prisma.editorialPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, limit, offset });
}
