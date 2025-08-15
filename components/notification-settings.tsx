'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Clock, Calendar, Save } from 'lucide-react';
import { showToast } from '@/lib/toast';
import {
	getNotificationPreferences,
	createOrUpdateNotificationPreferences,
	type NotificationPreferences,
} from '@/lib/notification-api';

export function NotificationSettings() {
	const [preferences, setPreferences] = useState<NotificationPreferences>({
		user_id: '',
		notify_day_before: false,
		day_before_time: '23:55',
		notify_same_day: true,
		same_day_time: '08:00',
		notify_week_before: false,
		week_before_time: '09:00',
		push_notifications_enabled: false,
		browser_push_enabled: false,
		timezone: 'UTC',
	});

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadPreferences();
	}, []);

	const loadPreferences = async () => {
		try {
			const data = await getNotificationPreferences();
			if (data) {
				setPreferences(data);
			}
		} catch (error) {
			showToast.error('Failed to load notification preferences');
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const result = await createOrUpdateNotificationPreferences(preferences);
			if (result) {
				showToast.success('Notification preferences saved successfully');
				window.dispatchEvent(new CustomEvent('preferencesChanged'));
			} else {
				showToast.error('Failed to save notification preferences');
			}
		} catch (error) {
			showToast.error('An error occurred while saving preferences');
		} finally {
			setSaving(false);
		}
	};

	const requestNotificationPermission = async () => {
		if (!('Notification' in window)) {
			showToast.error("This browser doesn't support notifications");
			return;
		}

		if (Notification.permission === 'granted') {
			setPreferences(prev => ({ ...prev, browser_push_enabled: true }));
			showToast.success('Notifications are already enabled');
			return;
		}

		if (Notification.permission !== 'denied') {
			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				setPreferences(prev => ({ ...prev, browser_push_enabled: true }));
				showToast.success('Notification permission granted');
			} else {
				showToast.error('Notification permission denied');
			}
		} else {
			showToast.error('Notifications are blocked. Please enable them in your browser settings.');
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<Clock className="text-muted-foreground mx-auto mb-2 h-8 w-8 animate-spin" />
					<p className="text-muted-foreground">Loading notification settings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="mb-6 flex items-center gap-3">
				<Bell className="text-primary h-6 w-6" />
				<div>
					<h2 className="text-2xl font-bold">Notification Settings</h2>
					<p className="text-muted-foreground">Configure when and how you want to be reminded about your events</p>
				</div>
			</div>

			<div className="grid gap-6">
				{/* Push Notification Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							Push Notifications
						</CardTitle>
						<CardDescription>
							Enable browser notifications to receive reminders even when the app is closed
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="push-enabled">Enable Push Notifications</Label>
							<Switch
								id="push-enabled"
								checked={preferences.push_notifications_enabled}
								onCheckedChange={checked => {
									setPreferences(prev => ({ ...prev, push_notifications_enabled: checked }));
									if (checked) {
										requestNotificationPermission();
									}
								}}
							/>
						</div>

						{preferences.push_notifications_enabled && (
							<div className="flex items-center justify-between">
								<Label htmlFor="browser-push">Browser Notifications</Label>
								<Switch
									id="browser-push"
									checked={preferences.browser_push_enabled}
									onCheckedChange={checked => {
										if (checked) {
											requestNotificationPermission();
										} else {
											setPreferences(prev => ({ ...prev, browser_push_enabled: checked }));
										}
									}}
								/>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Timing Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5" />
							Notification Timing
						</CardTitle>
						<CardDescription>Choose when you want to receive notifications for your events</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Week Before */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label htmlFor="week-before">Notify 1 week before</Label>
								<Switch
									id="week-before"
									checked={preferences.notify_week_before}
									onCheckedChange={checked => setPreferences(prev => ({ ...prev, notify_week_before: checked }))}
								/>
							</div>
							{preferences.notify_week_before && (
								<div className="ml-6">
									<Label htmlFor="week-before-time" className="text-muted-foreground text-sm">
										Time
									</Label>
									<Input
										id="week-before-time"
										type="time"
										value={preferences.week_before_time}
										onChange={e => setPreferences(prev => ({ ...prev, week_before_time: e.target.value }))}
										className="mt-1 w-32"
									/>
								</div>
							)}
						</div>

						{/* Day Before */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label htmlFor="day-before">Notify 1 day before</Label>
								<Switch
									id="day-before"
									checked={preferences.notify_day_before}
									onCheckedChange={checked => setPreferences(prev => ({ ...prev, notify_day_before: checked }))}
								/>
							</div>
							{preferences.notify_day_before && (
								<div className="ml-6">
									<Label htmlFor="day-before-time" className="text-muted-foreground text-sm">
										Time
									</Label>
									<Input
										id="day-before-time"
										type="time"
										value={preferences.day_before_time}
										onChange={e => setPreferences(prev => ({ ...prev, day_before_time: e.target.value }))}
										className="mt-1 w-32"
									/>
								</div>
							)}
						</div>

						{/* Same Day */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label htmlFor="same-day">Notify on the same day</Label>
								<Switch
									id="same-day"
									checked={preferences.notify_same_day}
									onCheckedChange={checked => setPreferences(prev => ({ ...prev, notify_same_day: checked }))}
								/>
							</div>
							{preferences.notify_same_day && (
								<div className="ml-6">
									<Label htmlFor="same-day-time" className="text-muted-foreground text-sm">
										Time
									</Label>
									<Input
										id="same-day-time"
										type="time"
										value={preferences.same_day_time}
										onChange={e => setPreferences(prev => ({ ...prev, same_day_time: e.target.value }))}
										className="mt-1 w-32"
									/>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Timezone Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Timezone
						</CardTitle>
						<CardDescription>Set your timezone for accurate notification scheduling</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="timezone">Timezone</Label>
							<Select
								value={preferences.timezone}
								onValueChange={value => setPreferences(prev => ({ ...prev, timezone: value }))}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select timezone" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="UTC">UTC</SelectItem>
									<SelectItem value="America/New_York">Eastern Time</SelectItem>
									<SelectItem value="America/Chicago">Central Time</SelectItem>
									<SelectItem value="America/Denver">Mountain Time</SelectItem>
									<SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
									<SelectItem value="Europe/London">London</SelectItem>
									<SelectItem value="Europe/Paris">Paris</SelectItem>
									<SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
									<SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
									<SelectItem value="Asia/Kolkata">India</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Save Button */}
			<div className="flex justify-end pt-4">
				<Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
					<Save className="h-4 w-4" />
					{saving ? 'Saving...' : 'Save Settings'}
				</Button>
			</div>
		</div>
	);
}
