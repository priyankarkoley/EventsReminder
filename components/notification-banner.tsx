"use client"

import { useState, useEffect } from "react"
import type { Event } from "@/lib/types"
import { getEvents } from "@/lib/events-api"
import { getDaysUntil } from "@/lib/date-utils"
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notifications"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, X } from "lucide-react"

export function NotificationBanner() {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [todayEvents, setTodayEvents] = useState<Event[]>([])
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkTodayEvents = async () => {
      try {
        const events = await getEvents()
        const today = events.filter((event) => getDaysUntil(event.date) === 0)
        setTodayEvents(today)

        // Show banner if there are events today or if notifications are not enabled
        setShowBanner((today.length > 0 || !permission.granted) && !dismissed)
      } catch (error) {
        console.error("Failed to load events for notification banner:", error)
      }
    }

    checkTodayEvents()

    // Check every minute for events
    const interval = setInterval(checkTodayEvents, 60000)

    return () => clearInterval(interval)
  }, [permission.granted, dismissed])

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setPermission(getNotificationPermission())

    if (granted && todayEvents.length > 0) {
      // Show notifications for today's events
      todayEvents.forEach((event) => {
        const notification = new Notification(`${event.title} is Today!`, {
          body: `Don't forget about this ${event.type} today.`,
          icon: "/favicon.ico",
          tag: `event-${event.id}`,
        })

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000)
      })
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="border-b bg-blue-50 dark:bg-blue-950">
      <div className="container mx-auto px-4 py-3">
        {todayEvents.length > 0 ? (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <div className="flex items-center">
              <Bell className="h-4 w-4" />
            </div>
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Today's Events:</strong> {todayEvents.map((event) => event.title).join(", ")}
              </span>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : !permission.granted && !permission.denied ? (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="flex items-center">
              <Bell className="h-4 w-4" />
            </div>
            <AlertDescription className="flex items-center justify-between">
              <span>Enable notifications to get reminders for your upcoming events</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEnableNotifications}>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : permission.denied ? (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-center">
              <BellOff className="h-4 w-4" />
            </div>
            <AlertDescription className="flex items-center justify-between">
              <span>Notifications are blocked. Enable them in your browser settings to get event reminders.</span>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  )
}
