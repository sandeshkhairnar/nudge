"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    // Check if already subscribed
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    return subscription;
  } catch (err) {
    console.error("[PWA] Push subscription failed:", err);
    return null;
  }
}

async function saveSubscriptionToSupabase(
  subscription: PushSubscription,
  userId: string
) {
  const supabase = createClient();
  const subJson = subscription.toJSON();

  // Upsert subscription — one row per user+endpoint combo
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subJson.endpoint,
      p256dh: (subJson.keys as any)?.p256dh ?? "",
      auth: (subJson.keys as any)?.auth ?? "",
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("[PWA] Failed to save push subscription:", error.message);
  } else {
    console.log("[PWA] Push subscription saved for user:", userId);
  }
}

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const init = async () => {
      // 1. Register service worker
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] Service Worker registered:", registration.scope);
      } catch (err) {
        console.error("[PWA] Service Worker registration failed:", err);
        return;
      }

      // 2. Request notification permission
      if (!("Notification" in window)) return;
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        console.warn("[PWA] Notification permission denied");
        return;
      }

      // 3. Subscribe to push
      if (!("PushManager" in window)) return;
      const subscription = await subscribeToPush(registration);
      if (!subscription) return;

      // 4. Get current user and save subscription
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await saveSubscriptionToSupabase(subscription, user.id);
    };

    init();
  }, []);

  return null;
}
