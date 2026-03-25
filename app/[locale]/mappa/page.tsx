import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Mappa eventi — Emergenza Sicilia",
  description: "Mappa interattiva degli eventi di emergenza attivi in Sicilia",
};

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-56px)] skeleton-shimmer" aria-label="Caricamento mappa..." />
  ),
});

export default async function MapPage() {
  const events = await prisma.event.findMany({
    where: { status: { not: "CHIUSO" }, lat: { not: null }, lng: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, title: true, category: true, severity: true,
      lat: true, lng: true, source: true, publishedAt: true,
    },
  });

  const serialized = events.map((e) => ({
    ...e,
    lat: e.lat!,
    lng: e.lng!,
    publishedAt: e.publishedAt.toISOString(),
  }));

  return <MapView events={serialized} />;
}
