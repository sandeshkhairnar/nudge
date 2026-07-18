"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/space/dashboard/DashboardBase";
import StatsRow from "@/components/space/dashboard/StatsRow";
import VelocityCard from "@/components/space/dashboard/VelocityCard";
import TasksTableCard from "@/components/space/dashboard/TasksTableCard";
import NudgeFeedCard from "@/components/space/dashboard/NudgeFeedCard";
import DonutCard from "@/components/space/dashboard/DonutCard";
import ProjectHealthCard from "@/components/space/dashboard/ProjectHealthCard";
import TeamCard from "@/components/space/dashboard/TeamCard";
import NudgeAiChatWidget from "@/components/space/dashboard/NudgeAiChatWidget";

interface DashboardClientProps {
  initialData: any;
  me: any;
  engineActive: boolean;
}

export default function DashboardClient({ initialData, me, engineActive }: DashboardClientProps) {
  const [tab, setTab] = useState<"all" | "mine" | "stalled">("all");
  
  const { projects, tasks, nudges, team, weekly, stats } = initialData;

  const filteredTasks = tasks.filter((t: any) => 
    tab === "mine" ? t.assignee_id === me?.id : tab === "stalled" ? t.stalled_days >= 3 : true
  );

  const donutData = [
    tasks.filter((t: any) => t.status === "done").length,
    tasks.filter((t: any) => t.status === "in_progress").length,
    tasks.filter((t: any) => t.status === "review").length,
    tasks.filter((t: any) => t.status === "todo").length
  ];

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5 pb-8 relative min-h-full">
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-indigo-600/[0.04] blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-[500px] h-[500px] bg-sky-500/[0.04] blur-[120px] rounded-full pointer-events-none -z-10" />

      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)] relative">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
              </span>
              <p className="text-[12px] font-medium text-gray-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
              {greeting}, {me?.full_name?.split(" ")[0] ?? "there"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                  <motion.circle cx="16" cy="16" r="14" fill="none" stroke="#10B981" strokeWidth="4"
                    strokeLinecap="round" strokeDasharray={88}
                    initial={{ strokeDashoffset: 88 }}
                    animate={{ strokeDashoffset: 88 - (pct / 100) * 88 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Workspace Health</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[14px] font-bold text-gray-900 leading-none">{pct}%</span>
                  <span className="text-[11px] font-medium text-gray-400">done</span>
                </div>
              </div>
            </div>
            {stats.stalled > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 bg-white border border-amber-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.4)]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">Attention Needed</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[14px] font-bold text-amber-900 leading-none">{stats.stalled}</span>
                    <span className="text-[11px] font-medium text-amber-700">stalled</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.02}>
        <StatsRow stats={stats} pct={pct} />
      </Reveal>

      <div className="grid grid-cols-12 gap-4 lg:h-[450px]">
        <Reveal delay={0.04} className="col-span-12 lg:col-span-8 flex h-full">
          <VelocityCard tasks={tasks} weekly={weekly} />
        </Reveal>
        <Reveal delay={0.08} className="col-span-12 lg:col-span-4 flex h-full min-h-[400px] lg:min-h-0">
          <NudgeAiChatWidget me={me} />
        </Reveal>
      </div>

      <div className="grid grid-cols-12 gap-4 items-stretch">
        <Reveal delay={0.04} className="col-span-12 lg:col-span-8">
          <TasksTableCard tasks={filteredTasks} tab={tab} onTabChange={setTab} />
        </Reveal>
        <Reveal delay={0.04} className="col-span-12 lg:col-span-4">
          <NudgeFeedCard nudges={nudges} engineActive={engineActive} />
        </Reveal>
      </div>

      <div className="grid grid-cols-12 gap-4 items-stretch">
        <Reveal delay={0.08} className="col-span-12 md:col-span-6 lg:col-span-4">
          <DonutCard stats={stats} donutS={donutData} />
        </Reveal>
        <Reveal delay={0.04} className="col-span-12 md:col-span-6 lg:col-span-4">
          <ProjectHealthCard projects={projects} />
        </Reveal>
        <Reveal delay={0.04} className="col-span-12 lg:col-span-4">
          <TeamCard team={team} />
        </Reveal>
      </div>
    </div>
  );
}
