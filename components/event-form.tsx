"use client"

import type React from "react"

import { useState } from "react"
import type { Event, EventFormData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Clock } from "lucide-react"

interface EventFormProps {
  event?: Event
  onSubmit: (data: EventFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function EventForm({ event, onSubmit, onCancel, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    date: event?.date || "",
    type: event?.type || "other",
    description: event?.description || "",
    recurring: event?.recurring ?? false,
    notifications: event?.notifications || {
      enabled: false,
      sameDay: false,
      sameDayTime: "08:00",
      dayBefore: true,
      dayBeforeTime: "20:00",
      weekBefore: false,
      weekBeforeTime: "09:00",
      browserPush: true,
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.date) return
    onSubmit(formData)
  }

  const handleChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [field]: value,
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Event Title
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Birthday, Anniversary, etc."
          className="h-10 sm:h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium">
          Date
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange("date", e.target.value)}
          className="h-10 sm:h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">
          Event Type
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value: "birthday" | "anniversary" | "other") => handleChange("type", value)}
        >
          <SelectTrigger className="h-10 sm:h-11">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="birthday">Birthday</SelectItem>
            <SelectItem value="anniversary">Anniversary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add any additional details..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={formData.recurring || false}
          onChange={(e) => handleChange("recurring", e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="recurring" className="text-sm">
          Repeat every year (recurring event)
        </Label>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <Label className="text-sm font-medium">Notification Settings</Label>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="notifications-enabled" className="text-sm flex-1">
            Enable notifications for this event
          </Label>
          <Switch
            id="notifications-enabled"
            checked={formData.notifications?.enabled || false}
            onCheckedChange={(checked) => handleNotificationChange("enabled", checked)}
          />
        </div>

        {formData.notifications?.enabled && (
          <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-muted">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="same-day" className="text-sm flex-1">
                Same day notification
              </Label>
              <Switch
                id="same-day"
                checked={formData.notifications.sameDay}
                onCheckedChange={(checked) => handleNotificationChange("sameDay", checked)}
              />
            </div>

            {formData.notifications.sameDay && (
              <div className="flex items-center gap-2 pl-2 sm:pl-4">
                <Clock className="h-3 w-3" />
                <Input
                  type="time"
                  value={formData.notifications.sameDayTime}
                  onChange={(e) => handleNotificationChange("sameDayTime", e.target.value)}
                  className="w-24 sm:w-fit h-8 sm:h-10"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="day-before" className="text-sm flex-1">
                Day before notification
              </Label>
              <Switch
                id="day-before"
                checked={formData.notifications.dayBefore}
                onCheckedChange={(checked) => handleNotificationChange("dayBefore", checked)}
              />
            </div>

            {formData.notifications.dayBefore && (
              <div className="flex items-center gap-2 pl-2 sm:pl-4">
                <Clock className="h-3 w-3" />
                <Input
                  type="time"
                  value={formData.notifications.dayBeforeTime}
                  onChange={(e) => handleNotificationChange("dayBeforeTime", e.target.value)}
                  className="w-24 sm:w-fit h-8 sm:h-10"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="week-before" className="text-sm flex-1">
                Week before notification
              </Label>
              <Switch
                id="week-before"
                checked={formData.notifications.weekBefore}
                onCheckedChange={(checked) => handleNotificationChange("weekBefore", checked)}
              />
            </div>

            {formData.notifications.weekBefore && (
              <div className="flex items-center gap-2 pl-2 sm:pl-4">
                <Clock className="h-3 w-3" />
                <Input
                  type="time"
                  value={formData.notifications.weekBeforeTime}
                  onChange={(e) => handleNotificationChange("weekBeforeTime", e.target.value)}
                  className="w-24 sm:w-fit h-8 sm:h-10"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="browser-push" className="text-sm flex-1">
                Browser push notifications
              </Label>
              <Switch
                id="browser-push"
                checked={formData.notifications.browserPush}
                onCheckedChange={(checked) => handleNotificationChange("browserPush", checked)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !formData.title.trim() || !formData.date}
          className="flex-1 h-10 sm:h-11"
        >
          {isLoading ? "Saving..." : event ? "Update Event" : "Add Event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-10 sm:h-11 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
