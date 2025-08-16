'use client';

import { useState, useEffect } from 'react';
import type { Event, EventFormData } from '@/lib/types';
import { getEvents, updateEvent, deleteEvent } from '@/lib/events-api';
import { isUpcoming, sortEventsByDate } from '@/lib/date-utils';
import { EventCard } from './event-card';
import { EventDialog } from './event-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getNextOccurrence = (dateStr: string, recurring: boolean) => {
    const today = new Date();
    const eventDate = new Date(dateStr);
    if (!recurring) return eventDate;
    // Set year to this year
    let next = new Date(eventDate);
    next.setFullYear(today.getFullYear());
    // If already passed this year, set to next year
    if (
      next.getMonth() < today.getMonth() ||
      (next.getMonth() === today.getMonth() && next.getDate() < today.getDate())
    ) {
      next.setFullYear(today.getFullYear() + 1);
    }
    return next;
  };

  const isUpcomingEvent = (event: Event) => {
    const nextDate = getNextOccurrence(event.date, event.recurring ?? false);
    console.log({event, nextDate})
  const today = new Date();
  // Zero out time for both dates
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 30;
  };

  const sortByNextOccurrence = (a: Event, b: Event) => {
    const aDate = getNextOccurrence(a.date, a.recurring ?? false);
    const bDate = getNextOccurrence(b.date, b.recurring ?? false);
    return aDate.getTime() - bDate.getTime();
  };

  const loadEvents = async () => {
    try {
      const allEvents = await getEvents();
      console.log({allEvents})
      const upcomingEvents = allEvents.filter(isUpcomingEvent);
      console.log({upcomingEvents})
      const sortedEvents = [...upcomingEvents].sort(sortByNextOccurrence);
      console.log({sortedEvents})
      setEvents(sortedEvents);
      setLoading(false);
    } catch (error) {
      showToast.error('Failed to load events. Please refresh the page.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Listen for custom events to refresh the list
    const handleEventsChanged = () => {
      loadEvents();
    };

    window.addEventListener('eventsChanged', handleEventsChanged);

    // Refresh events every minute to update "days until" calculations
    const interval = setInterval(loadEvents, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('eventsChanged', handleEventsChanged);
    };
  }, []);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: EventFormData) => {
    if (!editingEvent) return;

    try {
      const updatedEvent = await updateEvent(editingEvent.id, data);
      if (updatedEvent) {
        loadEvents();
        setIsEditDialogOpen(false);
        setEditingEvent(null);
        showToast.success('Your event has been successfully updated.');
        // Trigger a refresh of other components
        window.dispatchEvent(new CustomEvent('eventsChanged'));
      } else {
        showToast.error('Failed to update event. Please try again.');
      }
    } catch (error) {
      showToast.error('An unexpected error occurred while updating the event.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteEvent(id);
      if (success) {
        loadEvents();
        showToast.success('Your event has been successfully deleted.');
        // Trigger a refresh of other components
        window.dispatchEvent(new CustomEvent('eventsChanged'));
      } else {
        showToast.error('Failed to delete event. Please try again.');
      }
    } catch (error) {
      showToast.error('An unexpected error occurred while deleting the event.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No upcoming events in the next 30 days. Add some events to get
            started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        Upcoming Events
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <EventDialog
        event={editingEvent ?? undefined}
        trigger={<div />}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
