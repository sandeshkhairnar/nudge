"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";
import Avatar from "@/components/global/Avatar";

export interface IncomingCall {
  id: string;
  room: string;
  callerName: string;
  callerAvatarUrl?: string | null;
  callerEmail?: string | null;
}

interface IncomingCallModalProps {
  call: IncomingCall | null;
  onAccept: (room: string) => void;
  onDecline: () => void;
}

/** Ripple ring that expands outward from avatar */
function RippleRing({ delay, size }: { delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full border border-white/20"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, top: "50%", left: "50%" }}
      initial={{ scale: 0.6, opacity: 0.7 }}
      animate={{ scale: 1.6, opacity: 0 }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

export function IncomingCallModal({ call, onAccept, onDecline }: IncomingCallModalProps) {
  const [elapsed, setElapsed] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer — auto-decline at 0
  useEffect(() => {
    if (!call) {
      setElapsed(30);
      return;
    }
    setElapsed(30);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [call, onDecline]);

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          key="incoming-call-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #0a1628 0%, #0d1f3c 30%, #0f2744 60%, #071018 100%)",
          }}
        >
          {/* ─── Noise texture overlay ─── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
              opacity: 0.4,
            }}
          />

          {/* ─── Glowing orb behind avatar ─── */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: 480,
              height: 480,
              background:
                "radial-gradient(circle, rgba(54,197,240,0.12) 0%, rgba(54,197,240,0.04) 50%, transparent 70%)",
            }}
          />

          {/* ─── TOP SECTION: label + caller info ─── */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center pt-16 sm:pt-20 z-10 gap-3"
          >
            {/* Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
              <Video size={11} className="text-[#36C5F0]" />
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
                Incoming Video Call
              </span>
            </div>

            <h1 className="text-white text-[2.4rem] sm:text-[3rem] font-black tracking-tight text-center leading-none px-6">
              {call.callerName}
            </h1>

            <p className="text-white/40 text-[15px] font-medium">is calling you…</p>
          </motion.div>

          {/* ─── MIDDLE: avatar with ripple rings ─── */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center z-10"
            style={{ flex: "0 0 auto" }}
          >
            {/* Ripple rings */}
            <RippleRing delay={0}    size={260} />
            <RippleRing delay={0.6}  size={320} />
            <RippleRing delay={1.2}  size={380} />

            {/* Soft glow ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                background: "radial-gradient(circle, rgba(54,197,240,0.22) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Avatar */}
            <div
              className="relative w-36 h-36 rounded-full overflow-hidden"
              style={{
                boxShadow:
                  "0 0 0 4px rgba(54,197,240,0.3), 0 0 0 8px rgba(54,197,240,0.1), 0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <Avatar
                url={call.callerAvatarUrl ?? null}
                name={call.callerName}
                email={call.callerEmail ?? null}
                size={144}
                fallbackColor="#36C5F0"
              />
            </div>

            {/* Video badge */}
            <div
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #36C5F0, #0f8ab8)",
                boxShadow: "0 4px 12px rgba(54,197,240,0.5)",
              }}
            >
              <Video size={15} className="text-white" />
            </div>
          </motion.div>

          {/* ─── BOTTOM: countdown + action buttons ─── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-8 pb-16 sm:pb-20 z-10 w-full"
          >
            {/* Countdown bar */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/25 text-xs font-mono">
                Auto-declining in {elapsed}s
              </p>
              <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/30 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 30, ease: "linear" }}
                />
              </div>
            </div>

            {/* Decline / Accept */}
            <div className="flex items-end gap-16">
              {/* ── Decline ── */}
              <div className="flex flex-col items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onDecline}
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center cursor-pointer border-0"
                  style={{
                    background: "linear-gradient(135deg, #c0392b, #e74c3c)",
                    boxShadow: "0 8px 30px rgba(231,76,60,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                  aria-label="Decline call"
                >
                  <PhoneOff size={28} className="text-white" />
                </motion.button>
                <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  Decline
                </span>
              </div>

              {/* ── Accept ── */}
              <div className="flex flex-col items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onAccept(call.room)}
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center cursor-pointer border-0 relative"
                  style={{
                    background: "linear-gradient(135deg, #1a9e5c, #27ae60)",
                    boxShadow: "0 8px 30px rgba(39,174,96,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                  aria-label="Accept call"
                >
                  {/* Pulse on accept button */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(39,174,96,0.4)" }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <Phone size={28} className="text-white relative" />
                </motion.button>
                <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  Accept
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
