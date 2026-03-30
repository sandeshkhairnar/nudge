"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

export function Reveal({ children, delay = 0, className = "", style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

export function CountUp({ to }: { to: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1100, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 4)) * to));
      if (p < 1) requestAnimationFrame(tick); else setV(to);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{v}</span>;
}

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`h-full flex flex-col rounded-[24px] bg-white transition-all duration-300 relative z-10 ${className}`}
      style={{
        boxShadow: "0 12px 48px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)",
        ...style,
      }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, sub, right, icon }: { title: string; sub?: string; right?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4F4F0] flex-shrink-0">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-[10px] bg-[#36C5F0]/10 flex items-center justify-center text-[#36C5F0]">
            {icon}
          </div>
        )}
        <div>
          <p className="text-[14px] font-[800] text-[#111111] leading-tight tracking-tight">{title}</p>
          {sub && <p className="text-[12px] text-[#A0A09B] font-[600] tracking-wide mt-0.5">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function EmptySlot({ msg }: { msg: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
      <div className="w-8 h-8 rounded-xl bg-[#F5F5F2] flex items-center justify-center mb-2 text-[#C8C8C0]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" /></svg>
      </div>
      <p className="text-[11px] text-[#B0B0A8] text-center leading-relaxed">{msg}</p>
    </div>
  );
}

export const DASHBOARD_ICONS = {
  task: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  folder: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  team: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M21 20c0-2.8-1.8-5-4-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  send: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
};
