import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PushSendSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { sendPushToMatching } from "@/lib/push";

export async function POST(request: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PushSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const result = await sendPushToMatching(event);

  await prisma.auditLog.create({
    data: {
      adminId: (session!.user as any).id,
      action: "SEND_PUSH",
      entityType: "Event",
      entityId: event.id,
      metadata: result,
    },
  });

  return NextResponse.json(result);
}
