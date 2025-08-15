"use client"

import { useEffect } from "react"
import { getEvents } from "@/lib/supabase-events"
import { getDaysUntil } from "@/lib/date-utils"
import { getNotificationPermission, scheduleEventNotification } from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"

export function NotificationChecker() {
  const { toast } = useToast()

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
        toast({
          title: "Notification Error",
          description: "Failed to check for upcoming events notifications.",
          variant: "destructive",
        })
      }
    }

    // Check immediately
    checkAndNotify()

    // Check every hour
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [toast])

  return null // This component doesn't render anything
}
