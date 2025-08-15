import { getUser } from '@/lib/auth';

export interface NotificationQueueItem {
	id?: string;
	user_id: string;
	event_id: string;
	notification_type: 'week_before' | 'day_before' | 'same_day';
	scheduled_time: string;
	status: 'pending' | 'sent' | 'failed';
	sent_at?: string;
	error_message?: string;
	created_at?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function addNotificationToQueue(
	eventId: string,
	notificationType: 'week_before' | 'day_before' | 'same_day',
	scheduledTime: Date,
): Promise<boolean> {
	try {
		const { user, access_token } = await getUser();
		if (!user || !access_token) return false;

		const queueItem: Partial<NotificationQueueItem> = {
			user_id: user.id,
			event_id: eventId,
			notification_type: notificationType,
			scheduled_time: scheduledTime.toISOString(),
			status: 'pending',
		};

		const response = await fetch(`${SUPABASE_URL}/rest/v1/notification_queue`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${access_token}`,
				apikey: SUPABASE_ANON_KEY,
				'Content-Type': 'application/json',
				Prefer: 'return=representation',
			},
			body: JSON.stringify(queueItem),
		});

		return response.ok;
	} catch (error) {
		console.error('[v0] Error adding notification to queue:', error);
		return false;
	}
}

export async function clearNotificationQueue(eventId?: string): Promise<boolean> {
	try {
		const { user, access_token } = await getUser();
		if (!user || !access_token) return false;

		const url = eventId
			? `${SUPABASE_URL}/rest/v1/notification_queue?event_id=eq.${eventId}&user_id=eq.${user.id}`
			: `${SUPABASE_URL}/rest/v1/notification_queue?user_id=eq.${user.id}&status=eq.pending`;

		const response = await fetch(url, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${access_token}`,
				apikey: SUPABASE_ANON_KEY,
			},
		});

		return response.ok;
	} catch (error) {
		console.error('[v0] Error clearing notification queue:', error);
		return false;
	}
}

export async function scheduleNotificationsForEvent(
	eventId: string,
	eventDate: string,
	preferences: any,
): Promise<void> {
	try {
		// Clear existing notifications for this event
		await clearNotificationQueue(eventId);

		const eventDateTime = new Date(eventDate);
		const now = new Date();

		// Skip past events
		if (eventDateTime < now) return;

		const notifications: { type: 'week_before' | 'day_before' | 'same_day'; time: string }[] = [];

		if (preferences.notify_week_before) {
			notifications.push({ type: 'week_before', time: preferences.week_before_time });
		}
		if (preferences.notify_day_before) {
			notifications.push({ type: 'day_before', time: preferences.day_before_time });
		}
		if (preferences.notify_same_day) {
			notifications.push({ type: 'same_day', time: preferences.same_day_time });
		}

		for (const notification of notifications) {
			const scheduledDate = new Date(eventDateTime);

			// Calculate the scheduled date based on notification type
			switch (notification.type) {
				case 'week_before':
					scheduledDate.setDate(scheduledDate.getDate() - 7);
					break;
				case 'day_before':
					scheduledDate.setDate(scheduledDate.getDate() - 1);
					break;
				case 'same_day':
					// Keep the same date
					break;
			}

			// Set the time
			const [hours, minutes] = notification.time.split(':');
			scheduledDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			// Only schedule if the time hasn't passed
			if (scheduledDate > now) {
				await addNotificationToQueue(eventId, notification.type, scheduledDate);
			}
		}
	} catch (error) {
		console.error('[v0] Error scheduling notifications for event:', error);
	}
}
