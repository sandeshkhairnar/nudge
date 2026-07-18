"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "./Portal";

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  size?: number;
  className?: string;
  fallbackColor?: string;
  userId?: string;
  showStatus?: boolean;
}

import { usePresenceStore } from "@/store/presence-store";

export default function Avatar({ 
  url, 
  name = "User", 
  email,
  role,
  size = 40, 
  className = "",
  fallbackColor = "#36C5F0",
  userId,
  showStatus = false
}: AvatarProps) {
  const isOnline = usePresenceStore((s) => userId ? s.isUserOnline(userId) : false);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initials = (typeof name === "string" ? name : "U").slice(0, 1).toUpperCase();

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
  };

  useEffect(() => {
    if (isHovered) {
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isHovered]);

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
    >
      <div 
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm ${className}`}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: url && !error ? "transparent" : fallbackColor,
          fontSize: size * 0.4,
          fontWeight: 900,
          color: "white"
        }}
      >
        <AnimatePresence mode="wait">
          {url && !error ? (
            <motion.img
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={url}
              alt={name || "Avatar"}
              className="w-full h-full object-cover"
              onError={() => setError(true)}
            />
          ) : (
            <motion.span
              key="fallback"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center select-none"
            >
              {initials}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {showStatus && userId && (
        <div 
          className="absolute bottom-0 right-0 z-10 rounded-full border-2 border-white shadow-sm"
          style={{ 
            width: Math.max(8, size * 0.25), 
            height: Math.max(8, size * 0.25),
            backgroundColor: isOnline ? "#10B981" : "#9CA3AF" 
          }}
        >
          {isOnline && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-[#10B981]"
            />
          )}
        </div>
      )}

    </div>
  );
}
