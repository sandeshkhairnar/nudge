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
    <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
      initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.06 } } }}>
      {statItems.map((s, i) => (
        <motion.div key={i} variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }}
          whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.07)" }}
          className="relative bg-white border border-[#F0F0F0] rounded-2xl px-4 py-3.5 overflow-hidden"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg,${s.accent}20,${s.accent})` }} />
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9.5px] font-black uppercase tracking-[0.09em] text-[#B0B0A8]">{s.label}</span>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}14`, color: s.accent }}>{s.icon}</div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-black text-[#0D0D0D] tracking-[-0.03em] leading-none"><CountUp to={s.value} /></span>
            <span className="text-[10.5px] text-[#B0B0A8] font-medium">{s.sub}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
