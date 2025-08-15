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
      console.log("[v0] Checking for pending notifications...");
      const pendingNotifications = await getPendingNotifications();

      if (pendingNotifications.length === 0) {
        console.log("[v0] No pending notifications found");
        return;
      }

      console.log(
        `[v0] Found ${pendingNotifications.length} pending notifications`,
      );

      for (const notification of pendingNotifications) {
        try {
          // Check if browser notifications are supported and permitted
          if (!pushNotificationService.isSupported()) {
            console.log("[v0] Browser notifications not supported");
            continue;
          }

          if (!pushNotificationService.hasPermission()) {
            console.log("[v0] No notification permission");
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
              console.log(
                `[v0] Sent notification for event: ${eventData.title}`,
              );
            } else {
              console.error(
                `[v0] Failed to send notification for event: ${eventData.title}`,
              );
            }
          }
        } catch (error) {
          console.error(
            "[v0] Error processing individual notification:",
            error,
          );
        }
      }
    } catch (error) {
      console.error("[v0] Error processing notifications:", error);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    // Start the background service
    console.log("[v0] Starting notification background service...");

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
      console.log("[v0] Notification background service stopped");
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
