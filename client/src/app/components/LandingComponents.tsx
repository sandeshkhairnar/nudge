"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useInView, useMotionValue, useAnimationFrame } from "framer-motion";

const PX = "clamp(24px, 5vw, 80px)";

// NEOBRUTALIST COLORS
const N_BLUE = "#4D9FFF";
const N_GREEN = "#23CE6B";
const N_YELLOW = "#FFD23F";
const N_PINK = "#F45B69";

export function NudgeLogo({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={150 * scale} height={40 * scale} viewBox="0 0 150 40" fill="none" style={{ display: "block" }}>
      {/* Pushing block */}
      <rect x="4" y="10" width="16" height="20" fill="#FFD23F" stroke="#000" strokeWidth="3" />
      {/* Nudged block (tilted) */}
      <rect x="24" y="6" width="16" height="28" fill="#4D9FFF" stroke="#000" strokeWidth="3" transform="rotate(12 32 20)" />
      {/* Stark Text */}
      <text x="52" y="30" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="26" fill="#000" letterSpacing="-1.5">NUDGE</text>
    </svg>
  );
}

export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div style={{ position: "fixed", top: 0, bottom: 0, right: 0, width: 12, zIndex: 9999, background: N_PINK, borderLeft: "3px solid #000", scaleY, transformOrigin: "top" }} />;
}



export function Reveal({ children, delay = 0, y = 40 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

export function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => { const p = Math.min((now - start) / 1000, 1); setVal(Math.round(p * to)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

export function NeoButton({ children, color = N_GREEN, onClick }: { children: React.ReactNode; color?: string; onClick?: () => void }) {
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px #000" }}
      whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px #000" }}
      style={{
        padding: "16px 32px", fontSize: 16, fontWeight: 800, color: "#000", 
        background: color, border: "3px solid #000", borderRadius: 0, 
        cursor: "pointer", boxShadow: "4px 4px 0px #000", textTransform: "uppercase",
        transition: "background 0.2s ease"
      }}
    >
      {children}
    </motion.button>
  );
}

export function NeoCard({ children, bg = "#fff", rotate = 0 }: { children: React.ReactNode, bg?: string, rotate?: number }) {
  return (
    <motion.div 
      initial={{ rotate: 0 }}
      whileHover={{ rotate, y: -4, boxShadow: "8px 8px 0px #000" }}
      style={{
        padding: 32, background: bg, border: "3px solid #000", 
        boxShadow: "4px 4px 0px #000", display: "flex", flexDirection: "column"
      }}
    >
      {children}
    </motion.div>
  );
}
