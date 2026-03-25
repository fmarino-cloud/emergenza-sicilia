import webpush from "web-push";
import { prisma } from "./prisma";

// Initialize VAPID only when keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? "mailto:admin@emergenzasicilia.it",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const SEVERITY_ORDER = ["BASSA", "MEDIA", "ALTA", "CRITICA"] as const;

export async function sendPushToMatching(event: {
  id: string;
  title: string;
  category: string;
  severity: string;
  provincia: string | null;
}): Promise<{ sent: number; failed: number }> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured — push notifications disabled");
    return { sent: 0, failed: 0 };
  }

  const rules = await prisma.alertRule.findMany({
    where: {
      active: true,
      categories: { hasSome: [event.category] },
      ...(event.provincia ? { provinces: { hasSome: [event.provincia, "ALL"] } } : {}),
    },
    include: { pushSubs: true },
  });

  const eventSeverityIdx = SEVERITY_ORDER.indexOf(event.severity as any);
  const payload = JSON.stringify({
    title: `⚠️ ${event.title}`,
    body: `Severità ${event.severity}${event.provincia ? ` · ${event.provincia}` : ""}`,
    url: `/eventi/${event.id}`,
    severity: event.severity,
  });

  let sent = 0;
  let failed = 0;

  for (const rule of rules) {
    const minIdx = SEVERITY_ORDER.indexOf(rule.minSeverity);
    if (eventSeverityIdx < minIdx) continue;

    for (const sub of rule.pushSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  }

  return { sent, failed };
}
