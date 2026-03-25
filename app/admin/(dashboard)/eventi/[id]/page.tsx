import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditEventForm } from "./edit-form";

interface Props {
  params: { id: string };
}

export default async function EditEventPage({ params }: Props) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      provincia: true,
      source: true,
      sourceUrl: true,
      lat: true,
      lng: true,
      status: true,
      tags: true,
      publishedAt: true,
    },
  });

  if (!event) notFound();

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-heading font-bold text-gray-900 text-2xl">Modifica Evento</h1>
      <p className="font-body text-sm text-gray-500 font-mono">{event.id}</p>
      <EditEventForm event={event} />
    </div>
  );
}
