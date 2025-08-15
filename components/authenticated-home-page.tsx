"use client"

import { useState, useEffect } from "react"
import type { EventFormData } from "@/lib/types"
import { getEvents, createEvent } from "@/lib/supabase-events"
import { getDaysUntil } from "@/lib/date-utils"
import { UpcomingEvents } from "@/components/upcoming-events"
import { EventDialog } from "@/components/event-dialog"
import { NotificationBanner } from "@/components/notification-banner"
import { NotificationChecker } from "@/components/notification-checker"
import { Button } from "@/components/ui/button"
import { Plus, Gift, LogOut, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AuthenticatedHomePageProps {
  user: SupabaseUser
}

export function AuthenticatedHomePage({ user }: AuthenticatedHomePageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
  })

  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const loadStats = async () => {
    const events = await getEvents()

    const thisWeek = events.filter((event) => {
      const daysUntil = getDaysUntil(event.date)
      return daysUntil >= 0 && daysUntil <= 7
    }).length

    const thisMonth = events.filter((event) => {
      const daysUntil = getDaysUntil(event.date)
      return daysUntil >= 0 && daysUntil <= 30
    }).length

    setStats({
      thisWeek,
      thisMonth,
      total: events.length,
    })
  }

  useEffect(() => {
    loadStats()

    // Listen for custom events to refresh stats
    const handleEventsChanged = () => {
      loadStats()
    }

    window.addEventListener("eventsChanged", handleEventsChanged)

    // Refresh stats when events might change
    const interval = setInterval(loadStats, 60000)

    return () => {
      clearInterval(interval)
      window.removeEventListener("eventsChanged", handleEventsChanged)
    }
  }, [])

  const handleAddEvent = async (data: EventFormData) => {
    const newEvent = await createEvent(data)
    if (newEvent) {
      setIsAddDialogOpen(false)
      loadStats()
      toast({
        title: "Event added",
        description: "Your event has been successfully added.",
      })
      // Trigger a refresh of the upcoming events component
      window.dispatchEvent(new CustomEvent("eventsChanged"))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <NotificationChecker />
      <NotificationBanner />

      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Event Reminders</h1>
                <p className="text-sm text-muted-foreground">Never miss important dates</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{user.email}</span>
              </div>
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
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <UpcomingEvents />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
