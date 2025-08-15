"use client"

import { useEffect } from "react"
import { getEvents } from "@/lib/events-api"
import { getDaysUntil } from "@/lib/date-utils"
import { getNotificationPermission, scheduleEventNotification } from "@/lib/notifications"
import { showToast } from "@/lib/toast"

export function NotificationChecker() {
  useEffect(() => {
    const checkAndNotify = async () => {
      try {
        const permission = getNotificationPermission()

        if (!permission.granted) return

        const events = await getEvents()
        const upcomingEvents = events.filter((event) => {
          const daysUntil = getDaysUntil(event.date)
          return daysUntil >= 0 && daysUntil <= 1 // Today or tomorrow
        })

        upcomingEvents.forEach((event) => {
          try {
            scheduleEventNotification(event.title, event.date, event.type)
          } catch (error) {
            console.error("Failed to schedule notification for event:", event.title, error)
          }
        })
      } catch (error) {
        showToast.error("Failed to check for upcoming events notifications.")
      }
    }

    // Check immediately
    checkAndNotify()

    // Check every hour
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}
