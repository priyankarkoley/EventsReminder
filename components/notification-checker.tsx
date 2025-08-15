'use client';

import { useEffect } from 'react';
import { pushNotificationService } from '@/lib/push-notification-service';
import { showToast } from '@/lib/toast';

export function NotificationChecker() {
	useEffect(() => {
		const initializeNotifications = async () => {
			try {
				await pushNotificationService.scheduleNotificationsForAllEvents();
			} catch (error) {
				console.error('[v0] Error initializing notifications:', error);
				showToast.error('Failed to initialize notification system.');
			}
		};

		// Initialize notifications on component mount
		initializeNotifications();

		const handleEventsChanged = async () => {
			try {
				await pushNotificationService.onEventsChanged();
			} catch (error) {
				console.error('[v0] Error rescheduling notifications after events change:', error);
			}
		};

		const handlePreferencesChanged = async () => {
			try {
				await pushNotificationService.onPreferencesChanged();
			} catch (error) {
				console.error('[v0] Error rescheduling notifications after preferences change:', error);
			}
		};

		window.addEventListener('eventsChanged', handleEventsChanged);
		window.addEventListener('preferencesChanged', handlePreferencesChanged);

		const interval = setInterval(initializeNotifications, 60 * 60 * 1000);

		return () => {
			clearInterval(interval);
			window.removeEventListener('eventsChanged', handleEventsChanged);
			window.removeEventListener('preferencesChanged', handlePreferencesChanged);
		};
	}, []);

	return null; // This component doesn't render anything
}
