import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("booking-updates", {
      name: "Booking Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1A56DB",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("worker-alerts", {
      name: "New Job Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#059669",
      sound: "default",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function sendBookingStatusNotification(
  serviceName: string,
  status: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const STATUS_COPY: Record<string, { title: string; body: string }> = {
    in_progress: {
      title: "Service Started",
      body: `Your ${serviceName} professional has arrived and started work.`,
    },
    completed: {
      title: "Service Completed",
      body: `Your ${serviceName} is done! Tap to rate your experience.`,
    },
    cancelled: {
      title: "Booking Cancelled",
      body: `Your ${serviceName} booking has been cancelled.`,
    },
    upcoming: {
      title: "Booking Confirmed",
      body: `Your ${serviceName} booking is confirmed and a professional is assigned.`,
    },
  };

  const copy = STATUS_COPY[status] ?? {
    title: "Booking Update",
    body: `Your ${serviceName} booking has been updated.`,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      sound: "default",
      data: { type: "booking_status", status },
      ...(Platform.OS === "android" ? { channelId: "booking-updates" } : {}),
    },
    trigger: null,
  });
}

export async function sendNewJobNotification(
  serviceName: string,
  date: string,
  time: string
): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New Job Assigned",
      body: `${serviceName} on ${date} at ${time}. Tap to view details.`,
      sound: "default",
      data: { type: "new_job" },
      ...(Platform.OS === "android" ? { channelId: "worker-alerts" } : {}),
    },
    trigger: null,
  });
}
