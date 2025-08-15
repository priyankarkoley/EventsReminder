"use client"

import type React from "react"

import type { Event, EventFormData } from "@/lib/types"
import { EventForm } from "./event-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface EventDialogProps {
  event?: Event
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit: (data: EventFormData) => void
  isLoading?: boolean
}

export function EventDialog({ event, trigger, open, onOpenChange, onSubmit, isLoading }: EventDialogProps) {
  const handleSubmit = (data: EventFormData) => {
    onSubmit(data)
  }

  const handleCancel = () => {
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="p-0 max-w-md">
        <EventForm event={event} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
}
