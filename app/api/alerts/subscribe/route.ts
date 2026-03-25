import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AlertSubscribeSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AlertSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();

  const alertRule = await prisma.alertRule.create({
    data: {
      userId: (session?.user as any)?.id ?? null,
      anonSessionId: (session?.user as any)?.id ? null : crypto.randomUUID(),
      categories: parsed.data.categories,
      provinces: parsed.data.provinces,
      minSeverity: parsed.data.minSeverity,
      channels: parsed.data.pushSubscription ? ["WEB", "PUSH"] : ["WEB"],
    },
  });

  if (parsed.data.pushSubscription) {
    await prisma.pushSubscription.create({
      data: {
        alertRuleId: alertRule.id,
        endpoint: parsed.data.pushSubscription.endpoint,
        p256dh: parsed.data.pushSubscription.keys.p256dh,
        auth: parsed.data.pushSubscription.keys.auth,
      },
    });
  }

  return NextResponse.json({ id: alertRule.id }, { status: 201 });
}
