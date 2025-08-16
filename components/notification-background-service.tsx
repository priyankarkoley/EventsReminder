"use client";

import { useEffect, useRef } from "react";
import {
  getPendingNotifications,
  markNotificationSent,
} from "@/lib/notification-scheduler";
import { pushNotificationService } from "@/lib/push-notifications";

export function NotificationBackgroundService() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processNotifications = async () => {
    // Prevent multiple simultaneous processing
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const pendingNotifications = await getPendingNotifications();

      if (pendingNotifications.length === 0) {
        return;
      }

      for (const notification of pendingNotifications) {
        try {
          // Check if browser notifications are supported and permitted
          if (!pushNotificationService.isSupported()) {
            continue;
          }

          if (!pushNotificationService.hasPermission()) {
            continue;
          }

          // Send the notification
          const eventData = (notification as any).events;
          if (eventData) {
            const success = await pushNotificationService.sendEventNotification(
              eventData.title,
              eventData.date,
              notification.notification_type,
            );

            if (success) {
              // Mark as sent in database
              await markNotificationSent(notification.id!);
            } else {
            }
          }
        } catch (error) {}
      }
    } catch (error) {
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    // Start the background service

    // Process immediately on mount
    processNotifications();

    // Set up interval to check every 30 seconds
    intervalRef.current = setInterval(processNotifications, 30000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
