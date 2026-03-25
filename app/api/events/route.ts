import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventQuerySchema, CreateEventSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = EventQuerySchema.safeParse(params);
  if (!query.success) {
    return NextResponse.json({ error: query.error.flatten() }, { status: 400 });
  }

  const { category, severity, provincia, status, limit, offset } = query.data;
  const where: Prisma.EventWhereInput = {};
  if (category) where.category = category as any;
  if (severity) where.severity = severity as any;
  if (provincia) where.provincia = provincia;
  if (status) where.status = status as any;
  else where.status = { not: "CHIUSO" };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        category: true,
        severity: true,
        description: true,
        source: true,
        sourceUrl: true,
        lat: true,
        lng: true,
        comune: true,
        provincia: true,
        status: true,
        tags: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({ events, total, limit, offset });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!(session?.user as any)?.role || (session?.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: { ...parsed.data, publishedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      adminId: (session!.user as any).id,
      action: "CREATE_EVENT",
      entityType: "Event",
      entityId: event.id,
      metadata: { title: event.title, category: event.category },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
