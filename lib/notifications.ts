export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { granted: false, denied: true, default: false };
  }

  return {
    granted: Notification.permission === "granted",
    denied: Notification.permission === "denied",
    default: Notification.permission === "default",
  };
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const showNotification = (
  title: string,
  options?: NotificationOptions,
) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  return new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...options,
  });
};

export const scheduleEventNotification = (
  eventTitle: string,
  eventDate: string,
  eventType: string,
) => {
  const eventDateTime = new Date(eventDate);
  const now = new Date();

  // Calculate time until event
  const timeUntilEvent = eventDateTime.getTime() - now.getTime();

  // If event is today, show notification immediately
  if (timeUntilEvent <= 24 * 60 * 60 * 1000 && timeUntilEvent > 0) {
    const daysUntil = Math.ceil(timeUntilEvent / (24 * 60 * 60 * 1000));

    let notificationTitle = "";
    let notificationBody = "";

    if (daysUntil === 0) {
      notificationTitle = `${eventTitle} is Today!`;
      notificationBody = `Don't forget about this ${eventType} today.`;
    } else if (daysUntil === 1) {
      notificationTitle = `${eventTitle} is Tomorrow!`;
      notificationBody = `Your ${eventType} is coming up tomorrow.`;
    }

    if (notificationTitle) {
      showNotification(notificationTitle, {
        body: notificationBody,
        tag: `event-${eventTitle}`,
        requireInteraction: true,
      });
    }
  }
};
