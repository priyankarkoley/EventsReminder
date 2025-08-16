"use client";

import { useState, useEffect } from "react";
import { getPastEventsIncludingRecurring } from "@/lib/events-api";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/lib/types";
import { History } from "lucide-react";

export function PastEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPastEvents = async () => {
    setLoading(true);
    try {
      const pastEvents = await getPastEventsIncludingRecurring();
      setEvents(pastEvents);
    } catch (error) {
      console.error("[v0] Error loading past events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPastEvents();

    const handleEventsChanged = () => {
      loadPastEvents();
    };

    window.addEventListener("eventsChanged", handleEventsChanged);
    return () => {
      window.removeEventListener("eventsChanged", handleEventsChanged);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Past Events</h2>
          <span className="text-sm text-muted-foreground">(Last 30 days)</span>
        </div>
        <p className="text-muted-foreground">Loading past events...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-4">
        <History className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Past Events</h2>
        <span className="text-sm text-muted-foreground">
          (Last 30 days • {events.length})
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">
          No past events in the last 30 days.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
