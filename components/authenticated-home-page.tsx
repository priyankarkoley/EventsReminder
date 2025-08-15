'use client';

import { useState, useEffect } from 'react';
import type { EventFormData } from '@/lib/types';
import { getEvents, createEvent } from '@/lib/events-api';
import { getDaysUntil } from '@/lib/date-utils';
import { UpcomingEvents } from '@/components/upcoming-events';
import { EventDialog } from '@/components/event-dialog';
import { NotificationBanner } from '@/components/notification-banner';
import { NotificationChecker } from '@/components/notification-checker';
import { Button } from '@/components/ui/button';
import { Plus, Gift, LogOut, Calendar, Settings } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { SettingsDialog } from '@/components/settings-dialog';

interface AuthenticatedHomePageProps {
	user: { id: string; email: string };
}

export function AuthenticatedHomePage({ user }: AuthenticatedHomePageProps) {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [stats, setStats] = useState({
		thisWeek: 0,
		thisMonth: 0,
		total: 0,
	});

	const router = useRouter();

	const loadStats = async () => {
		const events = await getEvents();

		const thisWeek = events.filter(event => {
			const daysUntil = getDaysUntil(event.date);
			return daysUntil >= 0 && daysUntil <= 7;
		}).length;

		const thisMonth = events.filter(event => {
			const daysUntil = getDaysUntil(event.date);
			return daysUntil >= 0 && daysUntil <= 30;
		}).length;

		setStats({
			thisWeek,
			thisMonth,
			total: events.length,
		});
	};

	useEffect(() => {
		loadStats();

		// Listen for custom events to refresh stats
		const handleEventsChanged = () => {
			loadStats();
		};

		window.addEventListener('eventsChanged', handleEventsChanged);

		// Refresh stats when events might change
		const interval = setInterval(loadStats, 60000);

		return () => {
			clearInterval(interval);
			window.removeEventListener('eventsChanged', handleEventsChanged);
		};
	}, []);

	const handleAddEvent = async (data: EventFormData) => {
		try {
			const newEvent = await createEvent(data);
			if (newEvent) {
				setIsAddDialogOpen(false);
				loadStats();
				showToast.success('Your event has been successfully added.');
				// Trigger a refresh of the upcoming events component
				window.dispatchEvent(new CustomEvent('eventsChanged'));
			} else {
				showToast.error('Failed to add event. Please try again.');
			}
		} catch (error) {
			showToast.error('An unexpected error occurred while adding the event.');
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			showToast.success('You have been successfully signed out.');
			router.push('/auth/login');
			router.refresh();
		} catch (error) {
			showToast.error('Failed to sign out. Please try again.');
		}
	};

	return (
		<div className="bg-background min-h-screen">
			<NotificationChecker />
			<NotificationBanner />

			{/* Header */}
			<header className="bg-card border-b">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
								<Gift className="text-primary-foreground h-6 w-6" />
							</div>
							<div>
								<h1 className="text-foreground text-2xl font-bold">Event Reminders</h1>
								<p className="text-muted-foreground text-sm">Never miss important dates</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<div className="text-muted-foreground flex items-center gap-2 text-sm">
								<span>{user.email}</span>
							</div>
							<SettingsDialog
								trigger={
									<Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
										<Settings className="h-4 w-4" />
										Settings
									</Button>
								}
							/>
							<EventDialog
								trigger={
									<Button className="flex items-center gap-2">
										<Plus className="h-4 w-4" />
										Add Event
									</Button>
								}
								open={isAddDialogOpen}
								onOpenChange={setIsAddDialogOpen}
								onSubmit={handleAddEvent}
							/>
							<Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2 bg-transparent">
								<LogOut className="h-4 w-4" />
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<div className="space-y-8">
					{/* Quick Stats */}
					<div className="grid gap-4 md:grid-cols-3">
						<div className="bg-card rounded-lg border p-6">
							<div className="flex items-center gap-3">
								<Calendar className="h-8 w-8 text-blue-500" />
								<div>
									<p className="text-2xl font-bold">{stats.thisWeek}</p>
									<p className="text-muted-foreground text-sm">This Week</p>
								</div>
							</div>
						</div>
						<div className="bg-card rounded-lg border p-6">
							<div className="flex items-center gap-3">
								<Gift className="h-8 w-8 text-green-500" />
								<div>
									<p className="text-2xl font-bold">{stats.thisMonth}</p>
									<p className="text-muted-foreground text-sm">This Month</p>
								</div>
							</div>
						</div>
						<div className="bg-card rounded-lg border p-6">
							<div className="flex items-center gap-3">
								<Calendar className="h-8 w-8 text-purple-500" />
								<div>
									<p className="text-2xl font-bold">{stats.total}</p>
									<p className="text-muted-foreground text-sm">Total Events</p>
								</div>
							</div>
						</div>
					</div>

					{/* Upcoming Events */}
					<UpcomingEvents />
				</div>
			</main>
		</div>
	);
}
