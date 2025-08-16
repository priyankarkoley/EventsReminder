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

export const getDaysUntil = (
  dateString: string,
  recurring?: boolean,
): number => {
  const today = new Date();
  const eventDate = new Date(dateString);
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  let nextOccurrence = new Date(eventDate);
  if (recurring) {
    nextOccurrence.setFullYear(today.getFullYear());
    if (
      nextOccurrence.getMonth() < today.getMonth() ||
      (nextOccurrence.getMonth() === today.getMonth() &&
        nextOccurrence.getDate() < today.getDate())
    ) {
      nextOccurrence.setFullYear(today.getFullYear() + 1);
    }
  } else {
    nextOccurrence = eventDate;
  }

  const diffTime = nextOccurrence.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const isUpcoming = (dateString: string, daysAhead = 30): boolean => {
  const daysUntil = getDaysUntil(dateString);
  return daysUntil >= 0 && daysUntil <= daysAhead;
};

export const sortEventsByDate = (events: any[]): any[] => {
  return events.sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));
};
