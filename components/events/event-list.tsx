"use client";

import { useState } from "react";
import { EventCard, type EventCardData } from "./event-card";
import { FilterChips } from "./filter-chips";

interface EventListProps {
  events: EventCardData[];
  showFilters?: boolean;
}

export function EventList({ events, showFilters = true }: EventListProps) {
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL"
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div>
      {showFilters && (
        <div className="mb-4">
          <FilterChips selected={filter} onSelect={setFilter} />
        </div>
      )}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-es-text-secondary font-body">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">Nessun evento attivo per questa categoria.</p>
          </div>
        ) : (
          filtered.map((event) => <EventCard key={event.id} {...event} />)
        )}
      </div>
    </div>
  );
}
