"use client"

import { useEffect } from "react"
import { getEvents } from "@/lib/supabase-events"
import { getDaysUntil } from "@/lib/date-utils"
import { getNotificationPermission, scheduleEventNotification } from "@/lib/notifications"

export function NotificationChecker() {
  useEffect(() => {
    const checkAndNotify = async () => {
      const permission = getNotificationPermission()

      if (!permission.granted) return

      const events = await getEvents()
      const upcomingEvents = events.filter((event) => {
        const daysUntil = getDaysUntil(event.date)
        return daysUntil >= 0 && daysUntil <= 1 // Today or tomorrow
      })

      upcomingEvents.forEach((event) => {
        scheduleEventNotification(event.title, event.date, event.type)
      })
    }

    // Check immediately
    checkAndNotify()

    // Check every hour
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}
