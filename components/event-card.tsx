'use client';

import type { Event } from '@/lib/types';
import { formatDateShort, getDaysUntil } from '@/lib/date-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Gift, Heart, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EventCardProps {
	event: Event;
	onEdit?: (event: Event) => void;
	onDelete?: (id: string) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
	const daysUntil = getDaysUntil(event.date);
	const isToday = daysUntil === 0;
	const isPast = daysUntil < 0;

	const getEventIcon = () => {
		switch (event.type) {
			case 'birthday':
				return <Gift className="h-4 w-4" />;
			case 'anniversary':
				return <Heart className="h-4 w-4" />;
			default:
				return <Calendar className="h-4 w-4" />;
		}
	};

	const getEventColor = () => {
		if (isToday) return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
		if (daysUntil <= 7) return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
		return 'bg-card border-border';
	};

	const getDaysText = () => {
		if (isToday) return 'Today!';
		if (daysUntil === 1) return 'Tomorrow';
		if (daysUntil > 0) return `${daysUntil} days`;
		return 'Past';
	};

	return (
		<Card className={`transition-all hover:shadow-md ${getEventColor()}`}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						{getEventIcon()}
						{event.title}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Badge variant={isToday ? 'destructive' : daysUntil <= 7 ? 'secondary' : 'outline'} className="text-xs">
							{getDaysText()}
						</Badge>
						{(onEdit || onDelete) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onEdit && (
										<DropdownMenuItem onClick={() => onEdit(event)}>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
									)}
									{onDelete && (
										<DropdownMenuItem onClick={() => onDelete(event.id)} className="text-destructive">
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<p className="text-muted-foreground text-sm">{formatDateShort(event.date)}</p>
					{event.description && <p className="text-foreground text-sm">{event.description}</p>}
					<div className="flex items-center gap-2">
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
	);
}
