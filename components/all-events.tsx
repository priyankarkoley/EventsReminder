"use client";

import { useState, useEffect } from "react";
import { getEvents } from "@/lib/events-api";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/lib/types";
import { Calendar } from "lucide-react";

export function AllEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await getEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error("[v0] Error loading all events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    const handleEventsChanged = () => {
      loadEvents();
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
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">All Events</h2>
        </div>
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">All Events</h2>
        <span className="text-sm text-muted-foreground">({events.length})</span>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">No events found.</p>
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
