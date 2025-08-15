export async function POST() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Get pending notifications that are due
    const now = new Date().toISOString()
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/notification_queue?status=eq.pending&scheduled_time=lte.${now}&select=*,events(title,type,date),notification_preferences(browser_push_enabled)`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`)
    }

    const notifications = await response.json()

    const processedNotifications = []

    for (const notification of notifications) {
      try {
        // Check if user has browser push enabled
        if (!notification.notification_preferences?.browser_push_enabled) {
          // Mark as sent but don't actually send
          await updateNotificationStatus(notification.id, "sent", "User has browser push disabled")
          continue
        }

        // For server-side processing, we would typically use a service like:
        // - Web Push API for browser notifications
        // - Email service for email notifications
        // - SMS service for text notifications

        // Since we're in a browser environment, we'll mark as sent
        // In a real implementation, you would integrate with push notification services

        await updateNotificationStatus(notification.id, "sent")
        processedNotifications.push(notification)
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        await updateNotificationStatus(
          notification.id,
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        )
      }
    }

    return Response.json({
      success: true,
      processed: processedNotifications.length,
      total: notifications.length,
    })
  } catch (error) {
    console.error("Error processing notifications:", error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

async function updateNotificationStatus(notificationId: string, status: "sent" | "failed", errorMessage?: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL!
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const updateData: any = {
    status,
    sent_at: new Date().toISOString(),
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  await fetch(`${SUPABASE_URL}/rest/v1/notification_queue?id=eq.${notificationId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  })
}
