"use client";

import { useEffect, useRef } from "react";

export interface HeroMapEvent {
  id: string;
  title: string;
  category: string;
  severity: string;
  lat: number;
  lng: number;
}

interface HeroMapProps {
  events: HeroMapEvent[];
}

const SEVERITY_COLORS: Record<string, string> = {
  BASSA:   "#2C6B2F",
  MEDIA:   "#F5A623",
  ALTA:    "#D0021B",
  CRITICA: "#D0021B",
};

// Sicily bounding box
const SICILY_BOUNDS: [[number, number], [number, number]] = [
  [36.45, 11.90],
  [38.45, 15.75],
];
const SICILY_CENTER: [number, number] = [37.55, 13.85];

export default function HeroMap({ events }: HeroMapProps) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted || !mapRef.current) return;

      // Cleanup previous instance
      if (mapInst.current) { mapInst.current.remove(); }

      const map = L.map(mapRef.current, {
        center: SICILY_CENTER,
        zoom: 8,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        maxBounds: SICILY_BOUNDS,
        maxBoundsViscosity: 1.0,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Force fit to Sicily
      map.fitBounds(SICILY_BOUNDS, { padding: [0, 0] });

      // Event markers
      events.forEach((event) => {
        const color  = SEVERITY_COLORS[event.severity] ?? "#0056A0";
        const radius = event.severity === "CRITICA" ? 11 : event.severity === "ALTA" ? 9 : 7;

        L.circleMarker([event.lat, event.lng], {
          radius,
          fillColor: color,
          fillOpacity: 0.85,
          color: "#fff",
          weight: 1.5,
        })
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:160px">
              <strong style="font-size:12px;color:#1A1A1A">${event.title}</strong>
              <br/><a href="/eventi/${event.id}" style="font-size:11px;color:#0056A0;font-weight:600">Dettagli →</a>
            </div>`
          )
          .addTo(map);
      });

      mapInst.current = map;
    });

    return () => {
      mounted = false;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, [events]);

  return <div ref={mapRef} className="absolute inset-0 z-0" />;
}
