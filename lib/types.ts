export interface Event {
  id: string;
  user_id: string;
  title: string;
  date: string;
  type: "birthday" | "anniversary" | "other";
  description?: string;
  recurring?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  date: string;
  type: "birthday" | "anniversary" | "other";
  description?: string;
  recurring?: boolean;
  notifications?: {
    enabled: boolean;
    sameDay: boolean;
    sameDayTime: string;
    dayBefore: boolean;
    dayBeforeTime: string;
    weekBefore: boolean;
    weekBeforeTime: string;
    browserPush: boolean;
  };
}
