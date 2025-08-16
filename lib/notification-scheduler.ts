import { getUser } from "@/lib/auth";

export interface NotificationSettings {
  enabled: boolean;
  sameDay: boolean;
  sameDayTime: string;
  dayBefore: boolean;
  dayBeforeTime: string;
  weekBefore: boolean;
  weekBeforeTime: string;
  browserPush: boolean;
}

export interface ScheduledNotification {
  id?: string;
  user_id: string;
  event_id: string;
  notification_type: "same_day" | "day_before" | "week_before";
  scheduled_time: string;
  status: "pending" | "sent" | "failed";
  created_at?: string;
}

function calculateNotificationTimes(
  eventDate: string,
  settings: NotificationSettings,
): ScheduledNotification[] {
  const notifications: Omit<ScheduledNotification, "user_id" | "event_id">[] =
    [];
  const eventDateTime = new Date(eventDate);

  if (settings.sameDay) {
    const [hours, minutes] = settings.sameDayTime.split(":");
    const notificationTime = new Date(eventDateTime);
    notificationTime.setHours(
      Number.parseInt(hours),
      Number.parseInt(minutes),
      0,
      0,
    );

    notifications.push({
      notification_type: "same_day",
      scheduled_time: notificationTime.toISOString(),
      status: "pending",
    });
  }

  if (settings.dayBefore) {
    const [hours, minutes] = settings.dayBeforeTime.split(":");
    const notificationTime = new Date(eventDateTime);
    notificationTime.setDate(notificationTime.getDate() - 1);
    notificationTime.setHours(
      Number.parseInt(hours),
      Number.parseInt(minutes),
      0,
      0,
    );

    notifications.push({
      notification_type: "day_before",
      scheduled_time: notificationTime.toISOString(),
      status: "pending",
    });
  }

  if (settings.weekBefore) {
    const [hours, minutes] = settings.weekBeforeTime.split(":");
    const notificationTime = new Date(eventDateTime);
    notificationTime.setDate(notificationTime.getDate() - 7);
    notificationTime.setHours(
      Number.parseInt(hours),
      Number.parseInt(minutes),
      0,
      0,
    );

    notifications.push({
      notification_type: "week_before",
      scheduled_time: notificationTime.toISOString(),
      status: "pending",
    });
  }

  return notifications as ScheduledNotification[];
}

export async function scheduleNotifications(
  eventId: string,
  eventDate: string,
  settings: NotificationSettings,
): Promise<boolean> {
  try {
    if (!settings.enabled) return true;

    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token)
      return false;

    const notifications = calculateNotificationTimes(eventDate, settings);

    // Add user_id and event_id to each notification
    const notificationsToCreate = notifications.map((notification) => ({
      ...notification,
      user_id: authResult.user!.id,
      event_id: eventId,
    }));

    if (notificationsToCreate.length === 0) return true;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notification_queue`,
      {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(notificationsToCreate),
      },
    );

    if (!response.ok) {
      return false;
    }

    console.log(
      "[v0] Scheduled",
      notificationsToCreate.length,
      "notifications for event",
      eventId,
    );
    return true;
  } catch (error) {
    return false;
  }
}

export async function clearEventNotifications(
  eventId: string,
): Promise<boolean> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token)
      return false;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notification_queue?event_id=eq.${eventId}&status=eq.pending`,
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

export async function getPendingNotifications(): Promise<
  ScheduledNotification[]
> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token) return [];

    const now = new Date().toISOString();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notification_queue?status=eq.pending&scheduled_time=lte.${now}&select=*,events(title,date,type)`,
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
        "Error fetching pending notifications:",
        response.statusText,
      );
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function markNotificationSent(
  notificationId: string,
): Promise<boolean> {
  try {
    const authResult = await getUser();
    if (!authResult || !authResult.user || !authResult.access_token)
      return false;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notification_queue?id=eq.${notificationId}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${authResult.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "sent",
          sent_at: new Date().toISOString(),
        }),
      },
    );

    return response.ok;
  } catch (error) {
    return false;
  }
}
