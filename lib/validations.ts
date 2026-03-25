import { z } from "zod";

export const EventQuerySchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional(),
  provincia: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const CreateEventSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum(["TERREMOTO", "MALTEMPO", "TRAFFICO", "ERUZIONE", "INCENDIO", "ALLERTA", "TRASPORTI"]),
  severity: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]),
  description: z.string().min(10).max(2000),
  source: z.string().min(1).max(100),
  sourceUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  comune: z.string().max(100).optional(),
  provincia: z.string().max(2).optional(),
  tags: z.array(z.string().max(50)).default([]),
});

export const UpdateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  severity: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]).optional(),
  description: z.string().min(10).max(2000).optional(),
  status: z.enum(["ATTIVO", "MONITORAGGIO", "CHIUSO"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateReportSchema = z.object({
  text: z.string().min(10).max(500),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  eventId: z.string().cuid().optional(),
});

export const ModerateReportSchema = z.object({
  status: z.enum(["IN_VERIFICA", "APPROVATO", "RIFIUTATO"]),
  moderationNote: z.string().max(500).optional(),
  eventId: z.string().cuid().optional(),
});

export const AlertSubscribeSchema = z.object({
  categories: z.array(z.string()).min(1).max(7),
  provinces: z.array(z.string().max(2)).min(1).max(9),
  minSeverity: z.enum(["BASSA", "MEDIA", "ALTA", "CRITICA"]),
  pushSubscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }).optional(),
});

export const PushSendSchema = z.object({
  eventId: z.string().cuid(),
});
