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

	const loadEvents = async () => {
		try {
			const allEvents = await getEvents();
			const upcomingEvents = allEvents.filter(event => isUpcoming(event.date));
			const sortedEvents = sortEventsByDate(upcomingEvents);
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
						No upcoming events in the next 30 days. Add some events to get started!
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="flex items-center gap-2 text-2xl font-semibold">
				<Calendar className="h-6 w-6" />
				Upcoming Events
			</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{events.map(event => (
					<EventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} />
				))}
			</div>

			<EventDialog
				event={editingEvent}
				trigger={<div />}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				onSubmit={handleEditSubmit}
			/>
		</div>
	);
}
