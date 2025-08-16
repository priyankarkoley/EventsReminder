"use client"

import type { Event } from "@/lib/types"
import { formatDate, getDaysUntil } from "@/lib/date-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Gift, Heart, Edit, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
  onDelete?: (id: string) => void
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const daysUntil = getDaysUntil(event.date, event.recurring)
  const isToday = daysUntil === 0
  const isPast = daysUntil < 0

  const getEventIcon = () => {
    switch (event.type) {
      case "birthday":
        return <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
      case "anniversary":
        return <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
      default:
        return <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
    }
  }

  const getEventColor = () => {
    if (isToday) return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
    if (daysUntil <= 7) return "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
    return "bg-card border-border"
  }

  const getDaysText = () => {
    if (isToday) return "Today!"
    if (daysUntil === 1) return "Tomorrow"
    if (daysUntil > 0) return `${daysUntil} days`
    return "Past"
  }

  return (
    <Card className={`transition-all hover:shadow-md ${getEventColor()}`}>
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-1 min-w-0">
            {getEventIcon()}
            <span className="truncate">{event.title}</span>
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Badge
              variant={isToday ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}
              className="text-xs whitespace-nowrap"
            >
              {getDaysText()}
            </Badge>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                    <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(event)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(event.date)}</p>
          {event.description && <p className="text-xs sm:text-sm text-foreground line-clamp-2">{event.description}</p>}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {event.type}
            </Badge>
            {event.recurring && (
              <Badge variant="outline" className="text-xs">
                Recurring
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
