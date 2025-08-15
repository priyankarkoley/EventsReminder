import { getUser } from '@/lib/auth';

export interface Event {
	id: string;
	title: string;
	date: string;
	type: 'birthday' | 'anniversary' | 'other';
	description?: string;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export async function getEvents(): Promise<Event[]> {
	try {
		const authResult = await getUser();
		if (!authResult || !authResult.user || !authResult.access_token) {
			console.log('[v0] No authenticated user found');
			return [];
		}

		console.log('[v0] Fetching events for user:', authResult.user.id);
		const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?select=*&order=date.asc`, {
			headers: {
				apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
				Authorization: `Bearer ${authResult.access_token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error('[v0] Error fetching events:', response.status, response.statusText);
			const errorText = await response.text();
			console.error('[v0] Response body:', errorText);
			return [];
		}

		const data = await response.json();
		console.log('[v0] Fetched events:', data);
		return data || [];
	} catch (error) {
		console.error('[v0] Error fetching events:', error);
		return [];
	}
}

export async function createEvent(
	event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
): Promise<Event | null> {
	try {
		const authResult = await getUser();
		if (!authResult || !authResult.user || !authResult.access_token) return null;

		const eventData = {
			title: event.title,
			date: event.date,
			type: event.type,
			description: event.description,
			user_id: authResult.user.id,
		};

		const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events`, {
			method: 'POST',
			headers: {
				apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
				Authorization: `Bearer ${authResult.access_token}`,
				'Content-Type': 'application/json',
				Prefer: 'return=representation',
			},
			body: JSON.stringify(eventData),
		});

		if (!response.ok) {
			console.error('Error creating event:', response.statusText);
			return null;
		}

		const data = await response.json();
		return data[0] || null;
	} catch (error) {
		console.error('Error creating event:', error);
		return null;
	}
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
	try {
		const authResult = await getUser();
		if (!authResult || !authResult.user || !authResult.access_token) return null;

		const updateData: any = {};
		if (updates.title !== undefined) updateData.title = updates.title;
		if (updates.date !== undefined) updateData.date = updates.date;
		if (updates.type !== undefined) updateData.type = updates.type;
		if (updates.description !== undefined) updateData.description = updates.description;

		const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
			method: 'PATCH',
			headers: {
				apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
				Authorization: `Bearer ${authResult.access_token}`,
				'Content-Type': 'application/json',
				Prefer: 'return=representation',
			},
			body: JSON.stringify(updateData),
		});

		if (!response.ok) {
			console.error('Error updating event:', response.statusText);
			return null;
		}

		const data = await response.json();
		return data[0] || null;
	} catch (error) {
		console.error('Error updating event:', error);
		return null;
	}
}

export async function deleteEvent(id: string): Promise<boolean> {
	try {
		const authResult = await getUser();
		if (!authResult || !authResult.user || !authResult.access_token) return false;

		const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
			method: 'DELETE',
			headers: {
				apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
				Authorization: `Bearer ${authResult.access_token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error('Error deleting event:', response.statusText);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Error deleting event:', error);
		return false;
	}
}
