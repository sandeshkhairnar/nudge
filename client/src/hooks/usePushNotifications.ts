import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const supabase = createClient();

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        setSubscription(existingSub);
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      setSubscription(sub);
      setPermission("granted");

      // Save to Supabase (Supporting Multiple Devices)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const subJson = JSON.parse(JSON.stringify(sub));
        
        // 1. Check if THIS specific device's subscription already exists in the database
        const { data: existingSubs } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .contains("subscription", { endpoint: subJson.endpoint });

        // 2. If it doesn't exist, insert it. This allows the user to have multiple
        // different devices (each with a unique endpoint) saved in the table.
        if (!existingSubs || existingSubs.length === 0) {
          await supabase
            .from("push_subscriptions")
            .insert({
              user_id: user.id,
              subscription: subJson
            });
        }
      }

      return sub;
    } catch (error) {
      console.error("Failed to subscribe to push notifications", error);
      setPermission(Notification.permission);
      return null;
    }
  };

  const sendTestNotification = async (title: string, body: string) => {
    if (!subscription) return;
    
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription,
        title,
        body,
      }),
    });
  };

  return {
    isSupported,
    permission,
    subscription,
    subscribeToPush,
    sendTestNotification,
  };
}

// Utility to convert VAPID public key
function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
