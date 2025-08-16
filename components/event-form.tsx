"use client";

import type React from "react";

import { useState } from "react";
import type { Event, EventFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Clock } from "lucide-react";

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EventForm({
  event,
  onSubmit,
  onCancel,
  isLoading = false,
}: EventFormProps) {
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;
    onSubmit(formData);
  };

  const handleChange = (
    field: keyof EventFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [field]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Birthday, Anniversary, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange("date", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Event Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value: "birthday" | "anniversary" | "other") =>
            handleChange("type", value)
          }
        >
          <SelectTrigger>
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
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add any additional details..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={formData.recurring || false}
          onChange={(e) => handleChange("recurring", e.target.checked)}
        />
        <Label htmlFor="recurring">Repeat every year (recurring event)</Label>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <Label className="text-sm font-medium">Notification Settings</Label>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notifications-enabled" className="text-sm">
            Enable notifications for this event
          </Label>
          <Switch
            id="notifications-enabled"
            checked={formData.notifications?.enabled || false}
            onCheckedChange={(checked) =>
              handleNotificationChange("enabled", checked)
            }
          />
        </div>

        {formData.notifications?.enabled && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="flex items-center justify-between">
              <Label htmlFor="same-day" className="text-sm">
                Same day notification
              </Label>
              <Switch
                id="same-day"
                checked={formData.notifications.sameDay}
                onCheckedChange={(checked) =>
                  handleNotificationChange("sameDay", checked)
                }
              />
            </div>

            {formData.notifications.sameDay && (
              <div className="flex items-center gap-2 pl-4">
                <Clock className="h-3 w-3" />
                <Input
                  type="time"
                  value={formData.notifications.sameDayTime}
                  onChange={(e) =>
                    handleNotificationChange("sameDayTime", e.target.value)
                  }
                  className="w-fit"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="day-before" className="text-sm">
                Day before notification
              </Label>
              <Switch
                id="day-before"
                checked={formData.notifications.dayBefore}
                onCheckedChange={(checked) =>
                  handleNotificationChange("dayBefore", checked)
                }
              />
            </div>

            {formData.notifications.dayBefore && (
              <div className="flex items-center gap-2 pl-4">
                <Clock className="h-3 w-3" />
                <Input
                  type="time"
                  value={formData.notifications.dayBeforeTime}
                  onChange={(e) =>
                    handleNotificationChange("dayBeforeTime", e.target.value)
                  }
                  className="w-fit"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="week-before" className="text-sm">
                Week before notification
              </Label>
              <Switch
                id="week-before"
                checked={formData.notifications.weekBefore}
                onCheckedChange={(checked) =>
                  handleNotificationChange("weekBefore", checked)
                }
              />
            </div>

            {formData.notifications.weekBefore && (
              <div className="flex items-center gap-2 pl-4">
                <Clock className="h-3 w-3" />
                <Input
                  type="time"
                  value={formData.notifications.weekBeforeTime}
                  onChange={(e) =>
                    handleNotificationChange("weekBeforeTime", e.target.value)
                  }
                  className="w-fit"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="browser-push" className="text-sm">
                Browser push notifications
              </Label>
              <Switch
                id="browser-push"
                checked={formData.notifications.browserPush}
                onCheckedChange={(checked) =>
                  handleNotificationChange("browserPush", checked)
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !formData.title.trim() || !formData.date}
          className="flex-1"
        >
          {isLoading ? "Saving..." : event ? "Update Event" : "Add Event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
