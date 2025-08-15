import { getUser } from '@/lib/auth';

export interface NotificationPreferences {
	id?: string;
	user_id: string;
	notify_day_before: boolean;
	day_before_time: string;
	notify_same_day: boolean;
	same_day_time: string;
	notify_week_before: boolean;
	week_before_time: string;
	push_notifications_enabled: boolean;
	browser_push_enabled: boolean;
	timezone: string;
	created_at?: string;
	updated_at?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
	try {
		const { user, access_token } = await getUser();
		if (!user || !access_token) return null;

		const response = await fetch(`${SUPABASE_URL}/rest/v1/notification_preferences?user_id=eq.${user.id}`, {
			headers: {
				Authorization: `Bearer ${access_token}`,
				apikey: SUPABASE_ANON_KEY,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data[0] || null;
	} catch (error) {
		console.error('[v0] Error fetching notification preferences:', error);
		return null;
	}
}

export async function createOrUpdateNotificationPreferences(
	preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences | null> {
	try {
		const { user, access_token } = await getUser();
		if (!user || !access_token) return null;

		// Check if preferences already exist
		const existing = await getNotificationPreferences();

		const method = existing ? 'PATCH' : 'POST';
		const url = existing
			? `${SUPABASE_URL}/rest/v1/notification_preferences?id=eq.${existing.id}`
			: `${SUPABASE_URL}/rest/v1/notification_preferences`;

		const body = existing ? preferences : { ...preferences, user_id: user.id };

		const response = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${access_token}`,
				apikey: SUPABASE_ANON_KEY,
				'Content-Type': 'application/json',
				Prefer: 'return=representation',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data[0] || null;
	} catch (error) {
		console.error('[v0] Error saving notification preferences:', error);
		return null;
	}
}
