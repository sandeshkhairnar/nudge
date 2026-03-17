"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  fallbackColor?: string;
}

export default function Avatar({ 
  url, 
  name = "User", 
  size = 40, 
  className = "",
  fallbackColor = "#36C5F0"
}: AvatarProps) {
  const [error, setError] = useState(false);
  const initials = (name || "U").slice(0, 1).toUpperCase();

  return (
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
  );
}
