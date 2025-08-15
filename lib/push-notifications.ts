export class PushNotificationService {
  private static instance: PushNotificationService;
  private permission: NotificationPermission = "default";

  private constructor() {
    if (typeof window !== "undefined") {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("[v0] Notifications not supported in this browser");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    if (this.permission === "denied") {
      console.log("[v0] Notification permission denied");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error);
      return false;
    }
  }

  async sendNotification(
    title: string,
    options?: NotificationOptions,
  ): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (this.permission !== "granted") {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error("[v0] Error sending notification:", error);
      return false;
    }
  }

  sendEventNotification(
    eventTitle: string,
    eventDate: string,
    notificationType: string,
  ): Promise<boolean> {
    const typeMessages = {
      same_day: "Today!",
      day_before: "Tomorrow!",
      week_before: "In one week!",
    };

    const message =
      typeMessages[notificationType as keyof typeof typeMessages] || "Soon!";

    return this.sendNotification(`🎉 ${eventTitle}`, {
      body: `Your event is ${message} (${new Date(eventDate).toLocaleDateString()})`,
      tag: `event-${eventTitle}`,
      requireInteraction: true,
    });
  }

  hasPermission(): boolean {
    return this.permission === "granted";
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
