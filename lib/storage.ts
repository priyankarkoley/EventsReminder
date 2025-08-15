import type { Event } from './types';

const STORAGE_KEY = 'event-reminders';

export const getEvents = (): Event[] => {
	if (typeof window === 'undefined') return [];

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		console.error('Error loading events:', error);
		return [];
	}
};

export const saveEvents = (events: Event[]): void => {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
	} catch (error) {
		console.error('Error saving events:', error);
	}
};

export const addEvent = (eventData: Omit<Event, 'id' | 'createdAt'>): Event => {
	const newEvent: Event = {
		...eventData,
		id: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
	};

	const events = getEvents();
	events.push(newEvent);
	saveEvents(events);

	return newEvent;
};

export const updateEvent = (id: string, updates: Partial<Event>): Event | null => {
	const events = getEvents();
	const index = events.findIndex(event => event.id === id);

	if (index === -1) return null;

	events[index] = { ...events[index], ...updates };
	saveEvents(events);

	return events[index];
};

export const deleteEvent = (id: string): boolean => {
	const events = getEvents();
	const filteredEvents = events.filter(event => event.id !== id);

	if (filteredEvents.length === events.length) return false;

	saveEvents(filteredEvents);
	return true;
};
