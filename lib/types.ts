export interface Event {
	id: string;
	user_id: string;
	title: string;
	date: string;
	type: 'birthday' | 'anniversary' | 'other';
	description?: string;
	created_at: string;
	updated_at: string;
}

export interface EventFormData {
	title: string;
	date: string;
	type: 'birthday' | 'anniversary' | 'other';
	description?: string;
}
