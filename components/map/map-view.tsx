"use client";

import { useEffect, useRef, useState } from "react";
import { FilterChips } from "@/components/events/filter-chips";

export interface MapEvent {
  id: string;
  title: string;
  category: string;
  severity: string;
  lat: number;
  lng: number;
  source: string;
  publishedAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  BASSA: "#2C6B2F",
  MEDIA: "#F5A623",
  ALTA: "#D0021B",
  CRITICA: "#D0021B",
};

interface MapViewProps {
  events: MapEvent[];
}

export default function MapView({ events }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? events : events.filter((e) => e.category === filter);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current) return;

      // Prevent double-init
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [37.6, 14.0],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      filtered.forEach((event) => {
        const color = SEVERITY_COLORS[event.severity] ?? "#0056A0";
        const radius = event.severity === "CRITICA" ? 12 : event.severity === "ALTA" ? 10 : 8;

        const circle = L.circleMarker([event.lat, event.lng], {
          radius,
          fillColor: color,
          fillOpacity: 0.75,
          color,
          weight: 2,
        });

        const date = new Date(event.publishedAt).toLocaleString("it-IT");
        circle.bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px;">
            <strong style="font-size: 13px; color: #1A1A1A;">${event.title}</strong>
            <p style="font-size: 11px; color: #5F6368; margin: 4px 0;">
              Fonte: ${event.source} · ${date}
            </p>
            <a href="/eventi/${event.id}" style="font-size: 12px; color: #0056A0; font-weight: 600;">
              Dettagli →
            </a>
          </div>
        `);

        circle.addTo(map);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filtered]); // Re-render when filter changes

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="px-4 py-3 bg-white border-b border-es-border flex items-center gap-4 flex-wrap">
        <h1 className="text-sm font-heading font-semibold text-es-text">Mappa eventi ({filtered.length})</h1>
        <FilterChips selected={filter} onSelect={setFilter} />
      </div>
      <div ref={mapRef} className="flex-1 z-0" />
    </div>
  );
}
