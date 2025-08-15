export async function POST(request: Request) {
	try {
		const { eventId, eventDate, preferences } = await request.json();

		if (!eventId || !eventDate || !preferences) {
			return Response.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		const SUPABASE_URL = process.env.SUPABASE_URL!;
		const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

		// Clear existing notifications for this event
		await fetch(`${SUPABASE_URL}/rest/v1/notification_queue?event_id=eq.${eventId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
				apikey: SUPABASE_SERVICE_ROLE_KEY,
			},
		});

		const eventDateTime = new Date(eventDate);
		const now = new Date();

		// Skip past events
		if (eventDateTime < now) {
			return Response.json({ success: true, message: 'Event is in the past, no notifications scheduled' });
		}

		const notifications = [];

		// Schedule notifications based on preferences
		if (preferences.notify_week_before) {
			const weekBefore = new Date(eventDateTime);
			weekBefore.setDate(weekBefore.getDate() - 7);
			const [hours, minutes] = preferences.week_before_time.split(':');
			weekBefore.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			if (weekBefore > now) {
				notifications.push({
					user_id: preferences.user_id,
					event_id: eventId,
					notification_type: 'week_before',
					scheduled_time: weekBefore.toISOString(),
					status: 'pending',
				});
			}
		}

		if (preferences.notify_day_before) {
			const dayBefore = new Date(eventDateTime);
			dayBefore.setDate(dayBefore.getDate() - 1);
			const [hours, minutes] = preferences.day_before_time.split(':');
			dayBefore.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			if (dayBefore > now) {
				notifications.push({
					user_id: preferences.user_id,
					event_id: eventId,
					notification_type: 'day_before',
					scheduled_time: dayBefore.toISOString(),
					status: 'pending',
				});
			}
		}

		if (preferences.notify_same_day) {
			const sameDay = new Date(eventDateTime);
			const [hours, minutes] = preferences.same_day_time.split(':');
			sameDay.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0);

			if (sameDay > now) {
				notifications.push({
					user_id: preferences.user_id,
					event_id: eventId,
					notification_type: 'same_day',
					scheduled_time: sameDay.toISOString(),
					status: 'pending',
				});
			}
		}

		// Insert notifications into the queue
		if (notifications.length > 0) {
			await fetch(`${SUPABASE_URL}/rest/v1/notification_queue`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
					apikey: SUPABASE_SERVICE_ROLE_KEY,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(notifications),
			});
		}

		return Response.json({
			success: true,
			scheduled: notifications.length,
			notifications: notifications.map(n => ({
				type: n.notification_type,
				scheduledTime: n.scheduled_time,
			})),
		});
	} catch (error) {
		console.error('Error scheduling notifications:', error);
		return Response.json(
			{ success: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 },
		);
	}
}
