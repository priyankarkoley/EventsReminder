export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  const eventDate = new Date(dateString);

  // Set both dates to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  // If event date has passed this year, calculate for next year
  if (eventDate < today) {
    eventDate.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isUpcoming = (dateString: string, daysAhead = 30): boolean => {
  const daysUntil = getDaysUntil(dateString);
  return daysUntil >= 0 && daysUntil <= daysAhead;
};

export const sortEventsByDate = (events: any[]): any[] => {
  return events.sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));
};
