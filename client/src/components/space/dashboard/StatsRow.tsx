"use client";

import { motion } from "framer-motion";
import { CountUp, DASHBOARD_ICONS } from "./DashboardBase";

interface StatItem {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
  sub: string;
}

interface StatsRowProps {
  stats: {
    total: number;
    done: number;
    projects: number;
    members: number;
    inProgress: number;
  };
  pct: number;
}

export default function StatsRow({ stats, pct }: StatsRowProps) {
  const statItems: StatItem[] = [
    { label: "Total Tasks", value: stats.total, accent: "#36C5F0", icon: DASHBOARD_ICONS.task, sub: `${stats.inProgress} active` },
    { label: "Completed", value: stats.done, accent: "#2EB67D", icon: DASHBOARD_ICONS.check, sub: `${pct}% rate` },
    { label: "Projects", value: stats.projects, accent: "#A259FF", icon: DASHBOARD_ICONS.folder, sub: "active" },
    { label: "Team", value: stats.members, accent: "#ECB22E", icon: DASHBOARD_ICONS.team, sub: "members" },
  ];

  return (
    <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4"
      initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.08 } } }}>
      {statItems.map((s, i) => (
        <motion.div key={i} variants={{ h: { opacity: 0, y: 12 }, s: { opacity: 1, y: 0 } }}
          whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)" }}
          className="relative group bg-white rounded-[24px] px-6 py-5 overflow-hidden transition-all duration-300 z-10"
          style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.015)" }}>

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="relative w-10 h-10 rounded-[12px] flex items-center justify-center text-[#111111]" style={{ background: `color-mix(in srgb, ${s.accent}, transparent 90%)`, color: s.accent }}>
              {s.icon}
            </div>
            <span className="text-[11px] font-[800] uppercase tracking-[0.12em] text-[#A0A09B]">{s.label}</span>
          </div>

          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[36px] font-[800] text-[#111111] tracking-[-0.03em] leading-none drop-shadow-sm">
              <CountUp to={s.value} />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-[#A0A09B] font-[700] uppercase tracking-wider leading-none mb-1.5">{s.sub}</span>
              <div className="h-[3px] w-5 rounded-full" style={{ background: s.accent, opacity: 0.8 }} />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
