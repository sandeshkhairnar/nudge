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
    { label: "Total Tasks", value: stats.total, accent: "#4F46E5", icon: DASHBOARD_ICONS.task, sub: `${stats.inProgress} active` },
    { label: "Completed", value: stats.done, accent: "#10B981", icon: DASHBOARD_ICONS.check, sub: `${pct}% rate` },
    { label: "Projects", value: stats.projects, accent: "#0EA5E9", icon: DASHBOARD_ICONS.folder, sub: "active" },
    { label: "Team", value: stats.members, accent: "#F59E0B", icon: DASHBOARD_ICONS.team, sub: "members" },
  ];

  return (
    <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4"
      initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.05 } } }}>
      {statItems.map((s, i) => (
        <motion.div key={i} variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300">
          
          {/* Header: Icon + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${s.accent}, transparent 88%)`, color: s.accent }}>
              {s.icon}
            </div>
            <span className="text-[13px] font-medium text-gray-500">{s.label}</span>
          </div>

          {/* Value + Sub */}
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
              <CountUp to={s.value} />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.accent }} />
              <span className="text-[12px] font-medium text-gray-400">{s.sub}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
