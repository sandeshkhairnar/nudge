"use client";

import { useEffect, useRef } from "react";

/**
 * KeepAlive Component
 * 
 * Periodically pings the backend (/api/ping) to prevent Render's free tier
 * from spinning down the Nudge Engine.
 */
export function KeepAlive() {
  const isPinging = useRef(false);

  useEffect(() => {
    // Only run in production-like environments or if specifically testing.
    // 10 minutes interval (600,000 ms)
    const INTERVAL_MS = 10 * 60 * 1000;

    const pingBackend = async () => {
      if (isPinging.current) return;
      isPinging.current = true;

      try {
        const res = await fetch("/api/ping");
        const data = await res.json();

        if (process.env.NODE_ENV === "development") {
          if (res.ok) {
            console.log(`[KeepAlive] Backend ping successful at ${data.timestamp}`);
          } else if (res.status === 503) {
            console.warn(`[KeepAlive] Backend unreachable: ${data.error}`);
          } else {
            console.warn(`[KeepAlive] Backend ping failed: ${data.error}`);
          }
        }
      } catch (err) {
        console.error("[KeepAlive] Error during ping:", err);
      } finally {
        isPinging.current = false;
      }
    };

    // Initial ping on load
    pingBackend();

    const interval = setInterval(pingBackend, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
