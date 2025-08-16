import { getUser } from "@/lib/auth";
import {
  scheduleNotifications,
  clearEventNotifications,
  type NotificationSettings,
} from "@/lib/notification-scheduler";
import type { Event } from "./types";

export async function getEvents(): Promise<Event[]> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token) {
      return [];
    }

    // Fetch events
    const eventsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?select=*&order=date.asc`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!eventsResponse.ok) {
      console.error(
        "[v0] Error fetching events:",
        eventsResponse.status,
        eventsResponse.statusText,
      );
      return [];
    }

    const events = await eventsResponse.json();

    // Fetch user's notification preferences
    const preferencesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notification_preferences?user_id=eq.${authResult.user.id}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    let userPreferences = null;
    if (preferencesResponse.ok) {
      const preferencesData = await preferencesResponse.json();
      userPreferences = preferencesData[0];
    }

    // Fetch scheduled notifications for all events
    const notificationsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notification_queue?user_id=eq.${authResult.user.id}&status=eq.pending`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    let scheduledNotifications: any[] = [];
    if (notificationsResponse.ok) {
      scheduledNotifications = await notificationsResponse.json();
    }

    // Combine events with notification settings
    const eventsWithNotifications = events.map((event: any) => {
      const eventNotifications = scheduledNotifications.filter(
        (n) => n.event_id === event.id,
      );

      // Determine notification settings based on scheduled notifications
      const hasNotifications = eventNotifications.length > 0;
      const hasSameDay = eventNotifications.some(
        (n) => n.notification_type === "same_day",
      );
      const hasDayBefore = eventNotifications.some(
        (n) => n.notification_type === "day_before",
      );
      const hasWeekBefore = eventNotifications.some(
        (n) => n.notification_type === "week_before",
      );

      // Use user preferences as defaults if no scheduled notifications exist
      const notifications = {
        enabled:
          hasNotifications ||
          userPreferences?.notify_same_day ||
          userPreferences?.notify_day_before ||
          userPreferences?.notify_week_before ||
          false,
        sameDay: hasSameDay || userPreferences?.notify_same_day || false,
        sameDayTime: userPreferences?.same_day_time || "08:00",
        dayBefore: hasDayBefore || userPreferences?.notify_day_before || true,
        dayBeforeTime: userPreferences?.day_before_time || "20:00",
        weekBefore:
          hasWeekBefore || userPreferences?.notify_week_before || false,
        weekBeforeTime: userPreferences?.week_before_time || "09:00",
        browserPush: userPreferences?.browser_push_enabled || true,
      };

      return {
        ...event,
        notifications,
      };
    });

    return eventsWithNotifications || [];
  } catch (error) {
    console.error("[v0] Error in getEvents:", error);
    return [];
  }
}

export async function createEvent(
  event: Omit<Event, "id" | "user_id" | "created_at" | "updated_at">,
  notificationSettings?: NotificationSettings,
): Promise<Event | null> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token)
      return null;

    const eventData = {
      title: event.title,
      date: event.date,
      type: event.type,
      description: event.description,
      recurring: event.recurring || false,
      user_id: authResult.user.id,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events`,
      {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(eventData),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const createdEvent = data[0];

    if (createdEvent && notificationSettings) {
      await scheduleNotifications(
        createdEvent.id,
        createdEvent.date,
        notificationSettings,
      );
    }

    return createdEvent || null;
  } catch (error) {
    return null;
  }
}

export async function updateEvent(
  id: string,
  updates: Partial<Event>,
  notificationSettings?: NotificationSettings,
): Promise<Event | null> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token)
      return null;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined)
      updateData.description = updates.description;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const updatedEvent = data[0];

    if (updatedEvent && notificationSettings) {
      await clearEventNotifications(id);
      await scheduleNotifications(id, updatedEvent.date, notificationSettings);
    }

    return updatedEvent || null;
  } catch (error) {
    return null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token)
      return false;

    await clearEventNotifications(id);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?id=eq.${id}`,
      {
        method: "DELETE",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
