import { createClient } from "@/lib/supabase/client"
import type { Event } from "@/lib/types"

export async function getEvents(): Promise<Event[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true })

  if (error) {
    console.error("Error fetching events:", error)
    return []
  }

  return data || []
}

export async function createEvent(event: Omit<Event, "id">): Promise<Event | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const eventData = {
    title: event.title,
    date: event.date,
    type: event.type,
    description: event.description,
    user_id: user.id,
  }

  const { data, error } = await supabase.from("events").insert([eventData]).select().single()

  if (error) {
    console.error("Error creating event:", error)
    return null
  }

  return data
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
  const supabase = createClient()

  const updateData: any = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.description !== undefined) updateData.description = updates.description

  const { data, error } = await supabase.from("events").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating event:", error)
    return null
  }

  return data
}

export async function deleteEvent(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    console.error("Error deleting event:", error)
    return false
  }

  return true
}
