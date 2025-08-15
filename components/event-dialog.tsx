'use client';

import type React from 'react';
import { XIcon } from 'lucide-react';

import type { Event, EventFormData } from '@/lib/types';
import { EventForm } from './event-form';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EventDialogProps {
	event?: Event;
	trigger: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSubmit: (data: EventFormData) => void;
	isLoading?: boolean;
}

export function EventDialog({ event, trigger, open, onOpenChange, onSubmit, isLoading }: EventDialogProps) {
	const handleSubmit = (data: EventFormData) => {
		onSubmit(data);
	};

	const handleCancel = () => {
		onOpenChange?.(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-md p-8" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
				</DialogHeader>
				<DialogClose asChild>
					<Button
						variant="ghost"
						size="icon"
						className="data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-7 right-8 h-6 w-6 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
					>
						<XIcon className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</Button>
				</DialogClose>
				<EventForm event={event} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
			</DialogContent>
		</Dialog>
	);
}
