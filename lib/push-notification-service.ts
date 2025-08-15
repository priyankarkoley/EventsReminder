import { getNotificationPreferences, type NotificationPreferences } from '@/lib/notification-api';
import { getEvents } from '@/lib/events-api';
import { showNotification } from '@/lib/notifications';

export interface ScheduledNotification {
	eventId: string;
	eventTitle: string;
	eventDate: string;
	eventType: string;
	notificationType: 'week_before' | 'day_before' | 'same_day';
	scheduledTime: Date;
}

export class PushNotificationService {
	private static instance: PushNotificationService;
	private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

	private constructor() {}

	static getInstance(): PushNotificationService {
		if (!PushNotificationService.instance) {
			PushNotificationService.instance = new PushNotificationService();
		}
		return PushNotificationService.instance;
	}

	async scheduleNotificationsForAllEvents(): Promise<void> {
		try {
			const preferences = await getNotificationPreferences();
			if (!preferences || !preferences.push_notifications_enabled || !preferences.browser_push_enabled) {
				return;
			}

			const events = await getEvents();

			// Clear existing scheduled notifications
			this.clearAllScheduledNotifications();

			// Schedule new notifications for each event
			for (const event of events) {
				await this.scheduleNotificationsForEvent(event, preferences);
			}
		} catch (error) {
			console.error('[v0] Error scheduling notifications:', error);
		}
	}

	private async scheduleNotificationsForEvent(event: any, preferences: NotificationPreferences): Promise<void> {
		const eventDate = new Date(event.date);
		const now = new Date();

		// Skip past events
		if (eventDate < now) return;

		const notifications: ScheduledNotification[] = [];

		// Week before notification
		if (preferences.notify_week_before) {
			const weekBefore = new Date(eventDate);
			weekBefore.setDate(weekBefore.getDate() - 7);
			const [hours, minutes] = preferences.week_before_time.split(':');
			weekBefore.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			if (weekBefore > now) {
				notifications.push({
					eventId: event.id,
					eventTitle: event.title,
					eventDate: event.date,
					eventType: event.type,
					notificationType: 'week_before',
					scheduledTime: weekBefore,
				});
			}
		}

		// Day before notification
		if (preferences.notify_day_before) {
			const dayBefore = new Date(eventDate);
			dayBefore.setDate(dayBefore.getDate() - 1);
			const [hours, minutes] = preferences.day_before_time.split(':');
			dayBefore.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			if (dayBefore > now) {
				notifications.push({
					eventId: event.id,
					eventTitle: event.title,
					eventDate: event.date,
					eventType: event.type,
					notificationType: 'day_before',
					scheduledTime: dayBefore,
				});
			}
		}

		// Same day notification
		if (preferences.notify_same_day) {
			const sameDay = new Date(eventDate);
			const [hours, minutes] = preferences.same_day_time.split(':');
			sameDay.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			if (sameDay > now) {
				notifications.push({
					eventId: event.id,
					eventTitle: event.title,
					eventDate: event.date,
					eventType: event.type,
					notificationType: 'same_day',
					scheduledTime: sameDay,
				});
			}
		}

		// Schedule all notifications for this event
		notifications.forEach(notification => {
			this.scheduleNotification(notification);
		});
	}

	private scheduleNotification(notification: ScheduledNotification): void {
		const now = new Date();
		const delay = notification.scheduledTime.getTime() - now.getTime();

		if (delay <= 0) return; // Skip if time has passed

		const timeoutId = setTimeout(() => {
			this.sendNotification(notification);
			// Remove from scheduled notifications after sending
			this.scheduledNotifications.delete(notification.eventId + notification.notificationType);
		}, delay);

		// Store the timeout ID for potential cancellation
		this.scheduledNotifications.set(notification.eventId + notification.notificationType, timeoutId);
	}

	private sendNotification(notification: ScheduledNotification): void {
		let title = '';
		let body = '';

		switch (notification.notificationType) {
			case 'week_before':
				title = `Upcoming ${notification.eventType}: ${notification.eventTitle}`;
				body = `Your ${notification.eventType} is in one week (${new Date(notification.eventDate).toLocaleDateString()})`;
				break;
			case 'day_before':
				title = `Tomorrow: ${notification.eventTitle}`;
				body = `Don't forget about your ${notification.eventType} tomorrow!`;
				break;
			case 'same_day':
				title = `Today: ${notification.eventTitle}`;
				body = `Your ${notification.eventType} is today!`;
				break;
		}

		showNotification(title, {
			body,
			icon: '/favicon.ico',
			badge: '/favicon.ico',
			tag: `event-${notification.eventId}-${notification.notificationType}`,
			requireInteraction: true,
			actions: [
				{
					action: 'view',
					title: 'View Event',
				},
				{
					action: 'dismiss',
					title: 'Dismiss',
				},
			],
		});
	}

	private clearAllScheduledNotifications(): void {
		this.scheduledNotifications.forEach(timeoutId => {
			clearTimeout(timeoutId);
		});
		this.scheduledNotifications.clear();
	}

	// Method to reschedule notifications when preferences change
	async onPreferencesChanged(): Promise<void> {
		await this.scheduleNotificationsForAllEvents();
	}

	// Method to reschedule notifications when events change
	async onEventsChanged(): Promise<void> {
		await this.scheduleNotificationsForAllEvents();
	}
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
