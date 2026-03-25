import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateEventSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      sourceItem: true,
      reports: {
        where: { status: "APPROVATO" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          lat: true,
          lng: true,
          mediaUrls: true,
          reliabilityScore: true,
          createdAt: true,
        },
      },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      adminId: (session!.user as any).id,
      action: parsed.data.status === "CHIUSO" ? "CLOSE_EVENT" : "UPDATE_EVENT",
      entityType: "Event",
      entityId: event.id,
      metadata: parsed.data as any,
    },
  });

  return NextResponse.json(event);
}
