import { getUser } from "@/lib/auth";
import {
  scheduleNotifications,
  clearEventNotifications,
  type NotificationSettings,
} from "@/lib/notification-scheduler";
import { Event } from "./types";

export async function getEvents(): Promise<Event[]> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token) {
      return [];
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?select=*&order=date.asc`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(
        "[v0] Error fetching events:",
        response.status,
        response.statusText,
      );
      const errorText = await response.text();

      return [];
    }

    const data = await response.json();

    return data || [];
  } catch (error) {
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
