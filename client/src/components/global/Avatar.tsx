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
  const initials = (name || "U").slice(0, 1).toUpperCase();

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
      onMouseEnter={() => { updateCoords(); setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm transition-transform duration-200 ${isHovered ? 'scale-105' : 'scale-100'} ${className}`}
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

      <AnimatePresence>
        {isHovered && (name || email || role) && (
          <Portal>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: "-50%" }}
              className="fixed z-[99999] pointer-events-none"
              style={{ 
                top: coords.top - 12, 
                left: coords.left
              }}
            >
              <div className="bg-[#0D0D0D] text-white p-3 rounded-xl shadow-2xl border border-white/10 min-w-[160px] text-center relative overflow-visible" style={{ transform: "translateY(-100%)" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#36C5F0]/10 to-transparent pointer-events-none rounded-xl" />
                
                <p className="relative z-10 text-[13px] font-black tracking-tight mb-0.5">{name}</p>
                
                {email && (
                  <p className="relative z-10 text-[10px] font-medium text-white/50 truncate max-w-[180px]">
                    {email}
                  </p>
                )}
                
                {role && (
                  <div className="relative z-10 mt-2">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-wider text-[#36C5F0]">
                      {role}
                    </span>
                  </div>
                )}
                
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0D0D0D] rotate-45 border-r border-b border-white/10 -mt-1.5" />
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
