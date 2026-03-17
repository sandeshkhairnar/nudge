"use client";

import { useRef, useCallback } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((type: "mention" | "message" | "task" | "system" = "message") => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const soundMap: Record<string, string> = {
      mention: "/sounds/mention.mp3",
      message: "/sounds/message.mp3",
      task: "/sounds/task.mp3",
      system: "/sounds/system.mp3",
    };

    audioRef.current.src = soundMap[type] ?? "/sounds/message.mp3";
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {});
  }, []);

  return { playSound };
}