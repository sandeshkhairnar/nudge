"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: 1, label: "Connecting workspace",      detail: "Establishing secure connection…"        },
  { id: 2, label: "Loading your projects",      detail: "Fetching project data & members…"       },
  { id: 3, label: "Syncing task board",         detail: "Pulling tasks and assignments…"         },
  { id: 4, label: "Calibrating NudgeAI",        detail: "Analysing stalled patterns…"            },
  { id: 5, label: "Almost there",               detail: "Preparing your dashboard…"              },
];

export default function NudgeLoader() {
  const [step, setStep]         = useState(0);   // 0-indexed current step
  const [done, setDone]         = useState(false);
  const [progress, setProgress] = useState(0);

  /* advance steps on a timer — swap for real progress callbacks in production */
  useEffect(() => {
    const timings = [900, 1500, 1100, 1300, 900]; // ms per step
    let total = 0;
    timings.forEach((t, i) => {
      total += t;
      setTimeout(() => setStep(i + 1), total);
    });
    setTimeout(() => setDone(true), total + 500);
  }, []);

  /* smooth progress bar */
  useEffect(() => {
    const target = done ? 100 : Math.round((step / STEPS.length) * 94);
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= target) { clearInterval(id); return target; }
        return Math.min(p + 1, target);
      });
    }, 12);
    return () => clearInterval(id);
  }, [step, done]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "#0A0A0A" }}>

      {/* dot-grid texture */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

      {/* ambient glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 520, height: 520, top: "50%", left: "50%", x: "-50%", y: "-50%",
          background: "radial-gradient(circle, rgba(54,197,240,0.07) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md mx-4 rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}>

        {/* top accent line */}
        <motion.div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #36C5F0, #2EB67D, transparent)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }} />

        <div className="px-9 py-10">

          {/* Logo / brand mark */}
          <div className="flex items-center gap-3 mb-8">
            <motion.div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #36C5F0, #2EB67D)" }}
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/>
                <line x1="10" y1="1" x2="10" y2="4"/>
                <line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </motion.div>
            <div>
              <p className="text-[15px] font-black text-white tracking-[-0.01em]">Nudge</p>
              <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Workspace</p>
            </div>
          </div>

          {/* headline */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}>
                  <p className="text-[22px] font-black text-white tracking-[-0.02em] leading-snug">You're all set! 🎉</p>
                  <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Taking you to your dashboard…</p>
                </motion.div>
              ) : (
                <motion.div key="loading"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}>
                  <p className="text-[22px] font-black text-white tracking-[-0.02em] leading-snug">Setting Up Nudge</p>
                  <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>PLEASE WAIT</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <AnimatePresence mode="wait">
                <motion.span key={step}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.3 }}
                  className="text-[11.5px] font-semibold"
                  style={{ color: "rgba(255,255,255,0.55)" }}>
                  {done ? "Complete" : STEPS[Math.min(step, STEPS.length - 1)]?.label}
                </motion.span>
              </AnimatePresence>
              <motion.span className="text-[11.5px] font-black tabular-nums"
                style={{ color: "#36C5F0" }}>
                {progress}%
              </motion.span>
            </div>

            {/* track */}
            <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div className="h-full rounded-full relative overflow-hidden"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #2EB67D, #36C5F0)" }}
                transition={{ ease: "easeOut" }}>
                {/* shimmer */}
                <motion.div className="absolute inset-y-0 w-16 -skew-x-12"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                  animate={{ x: ["-200%", "400%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 }} />
              </motion.div>
            </div>
          </div>

          {/* step list */}
          <div className="flex flex-col gap-2.5">
            {STEPS.map((s, i) => {
              const isCompleted = step > i;
              const isActive    = step === i;
              const isPending   = step < i;
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="flex items-center gap-3">

                  {/* status dot */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 relative">
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div key="check"
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(46,182,125,0.18)" }}>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#2EB67D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      ) : isActive ? (
                        <motion.div key="spin"
                          className="w-5 h-5 rounded-full border-[1.8px] border-t-transparent"
                          style={{ borderColor: "#36C5F0", borderTopColor: "transparent" }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
                      ) : (
                        <motion.div key="dot"
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.2)" }} />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold leading-none"
                      style={{ color: isCompleted ? "rgba(255,255,255,0.9)" : isActive ? "#fff" : "rgba(255,255,255,0.35)" }}>
                      {s.label}
                    </p>
                    {isActive && (
                      <motion.p initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                        className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {s.detail}
                      </motion.p>
                    )}
                  </div>

                  {/* completed timestamp feel */}
                  {isCompleted && (
                    <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="text-[9px] font-semibold flex-shrink-0"
                      style={{ color: "rgba(46,182,125,0.6)" }}>done</motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* bottom note */}
          <motion.p className="text-[10.5px] text-center mt-7"
            style={{ color: "rgba(255,255,255,0.2)" }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}>
            This only takes a moment
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}