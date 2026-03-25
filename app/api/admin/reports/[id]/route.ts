import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ModerateReportSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

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

  const parsed = ModerateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await prisma.report.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      moderationNote: parsed.data.moderationNote ?? null,
      eventId: parsed.data.eventId ?? null,
    },
  });

  const actionMap = {
    APPROVATO: "APPROVE_REPORT",
    RIFIUTATO: "REJECT_REPORT",
    IN_VERIFICA: "VERIFY_REPORT",
  } as const;

  await prisma.auditLog.create({
    data: {
      adminId: (session!.user as any).id,
      action: actionMap[parsed.data.status],
      entityType: "Report",
      entityId: report.id,
      metadata: {
        status: parsed.data.status,
        note: parsed.data.moderationNote ?? null,
      },
    },
  });

  return NextResponse.json(report);
}
