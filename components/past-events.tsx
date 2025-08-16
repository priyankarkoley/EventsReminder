"use client"

import { useState, useEffect } from "react"
import { getPastEventsIncludingRecurring } from "@/lib/events-api"
import { EventCard } from "@/components/event-card"
import type { Event } from "@/lib/types"
import { History, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PastEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const loadPastEvents = async () => {
    setLoading(true)
    try {
      const pastEvents = await getPastEventsIncludingRecurring()
      setEvents(pastEvents)
    } catch (error) {
      console.error("[v0] Error loading past events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPastEvents()

    const handleEventsChanged = () => {
      loadPastEvents()
    }

    window.addEventListener("eventsChanged", handleEventsChanged)
    return () => {
      window.removeEventListener("eventsChanged", handleEventsChanged)
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <History className="h-6 w-6" />
            Past Events
            <span className="text-sm font-normal text-muted-foreground">(Last 30 days)</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? "Hide" : "Show"}
          </Button>
        </div>
        {isExpanded && <p className="text-muted-foreground">Loading past events...</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <History className="h-6 w-6" />
          Past Events
          <span className="text-sm font-normal text-muted-foreground">(Last 30 days • {events.length})</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? "Hide" : "Show"}
        </Button>
      </div>

      {isExpanded && (
        <>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No past events in the last 30 days.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
