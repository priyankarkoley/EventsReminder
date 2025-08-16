"use client"

import { useState, useEffect } from "react"
import { getEvents, updateEvent, deleteEvent } from "@/lib/events-api"
import { EventCard } from "@/components/event-card"
import { EventDialog } from "@/components/event-dialog"
import type { Event, EventFormData } from "@/lib/types"
import { Calendar, Search, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { showToast } from "@/lib/toast"

export function AllEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const allEvents = await getEvents()
      setEvents(allEvents)
    } catch (error) {
      console.error("[v0] Error loading all events:", error)
      showToast.error("Failed to load events. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events)
    } else {
      const filtered = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.type.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredEvents(filtered)
    }
  }, [events, searchQuery])

  useEffect(() => {
    loadEvents()

    const handleEventsChanged = () => {
      loadEvents()
    }

    window.addEventListener("eventsChanged", handleEventsChanged)
    return () => {
      window.removeEventListener("eventsChanged", handleEventsChanged)
    }
  }, [])

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (data: EventFormData) => {
    if (!editingEvent) return

    try {
      const updatedEvent = await updateEvent(editingEvent.id, data)
      if (updatedEvent) {
        loadEvents()
        setIsEditDialogOpen(false)
        setEditingEvent(null)
        showToast.success("Your event has been successfully updated.")
        window.dispatchEvent(new CustomEvent("eventsChanged"))
      } else {
        showToast.error("Failed to update event. Please try again.")
      }
    } catch (error) {
      showToast.error("An unexpected error occurred while updating the event.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteEvent(id)
      if (success) {
        loadEvents()
        showToast.success("Your event has been successfully deleted.")
        window.dispatchEvent(new CustomEvent("eventsChanged"))
      } else {
        showToast.error("Failed to delete event. Please try again.")
      }
    } catch (error) {
      showToast.error("An unexpected error occurred while deleting the event.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            All Events
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
        {isExpanded && <p className="text-muted-foreground">Loading events...</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          All Events
          <span className="text-sm text-muted-foreground font-normal">({filteredEvents.length})</span>
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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events by title, description, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredEvents.length === 0 ? (
            <p className="text-muted-foreground">
              {searchQuery.trim() ? "No events found matching your search." : "No events found."}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}

          <EventDialog
            event={editingEvent ?? undefined}
            trigger={<div />}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSubmit={handleEditSubmit}
          />
        </>
      )}
    </div>
  )
}
