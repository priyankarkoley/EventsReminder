import { getNotificationPreferences } from "@/lib/notification-api"

export async function scheduleNotificationsForNewEvent(eventId: string, eventDate: string): Promise<void> {
  try {
    const preferences = await getNotificationPreferences()
    if (!preferences || !preferences.push_notifications_enabled) {
      return
    }

    // Call the API to schedule notifications
    const response = await fetch("/api/notifications/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        eventDate,
        preferences,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to schedule notifications: ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Scheduled notifications:", result)
  } catch (error) {
    console.error("[v0] Error scheduling notifications for new event:", error)
  }
}

export async function rescheduleAllNotifications(): Promise<void> {
  try {
    // This would typically fetch all user events and reschedule notifications
    // For now, we'll trigger the client-side notification service
    window.dispatchEvent(new CustomEvent("preferencesChanged"))
  } catch (error) {
    console.error("[v0] Error rescheduling all notifications:", error)
  }
}
