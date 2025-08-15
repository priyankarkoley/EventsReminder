export interface Event {
  id: string
  title: string
  date: string
  type: "birthday" | "anniversary" | "other"
  description?: string
  recurring: boolean
  createdAt: string
}

export interface EventFormData {
  title: string
  date: string
  type: "birthday" | "anniversary" | "other"
  description?: string
  recurring: boolean
}
