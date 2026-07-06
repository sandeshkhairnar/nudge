"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { getVisibleProjects } from "@/lib/project-members";
import dynamic from "next/dynamic";
import { 
  BarChart3, TrendingUp, CheckCircle2, AlertCircle, 
  Clock, Layout, ArrowUpRight, ArrowDownRight, 
  Loader2, Calendar, Users, PieChart as PieChartIcon,
  Trophy, Target, Zap, Sparkles, Activity, Flame, Award
} from "lucide-react";
import Avatar from "@/components/global/Avatar";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ═══════════════════════════
   TYPES & HELPERS
═══════════════════════════ */
type TimeRange = "7d" | "30d" | "all";

interface AnalyticsStats {
  totalTasks: number;
  doneTasks: number;
  activeTasks: number;
  completionRate: number;
  projectCount: number;
  stalledTasks: number;
  efficiencyScore: number;
}

interface ProjectVelocity {
  id: string;
  name: string;
  color: string;
  completions: number;
  velocity: number; // tasks/day
  progress: number;
  members: { id: string; name: string; avatar?: string; email?: string }[];
}

interface MemberMerit {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  completions: number;
  meritScore: number; // 0-100 logic
  status: "Elite" | "Steady" | "Rising";
}

interface RecentActivity {
  id: string;
  type: "completion" | "creation" | "milestone";
  title: string;
  time: string;
  user: string;
}

/* ═══════════════════════════
   PAGE
═══════════════════════════ */
export default function AnalyticsPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  
  const [stats, setStats] = useState<AnalyticsStats>({
    totalTasks: 0, doneTasks: 0, activeTasks: 0, 
    completionRate: 0, projectCount: 0, stalledTasks: 0,
    efficiencyScore: 84
  });

  const [projectVelocities, setProjectVelocities] = useState<ProjectVelocity[]>([]);
  const [memberRankings, setMemberRankings] = useState<MemberMerit[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [velocityChartData, setVelocityChartData] = useState<any[]>([]);

  useEffect(() => {
    if (workspace?.id) {
      loadDeepAnalytics();
    }
  }, [workspace?.id, timeRange]);

  const loadDeepAnalytics = async () => {
    if (!workspace?.id) return;
    setLoading(true);

    // 1. Core Data Retrieval
    const { projects } = await getVisibleProjects(workspace.id);

    const { data: workspaceMembers } = await supabase
      .from("workspace_members")
      .select("profiles(id, full_name, avatar_url, email)")
      .eq("workspace_id", workspace.id);

    if (!projects || projects.length === 0) {
      setLoading(false);
      return;
    }

    const projectIds = projects.map(p => p.id);
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email)")
      .in("project_id", projectIds);

    if (tasks) {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - (timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 365));

      // 2. Project Velocity Calculations (Fastest Moving)
      const velocities = projects.map(p => {
        const pTasks = tasks.filter(t => t.project_id === p.id);
        const recentCompletions = pTasks.filter(t => t.status === 'done' && new Date(t.updated_at) > cutoff).length;
        
        // Get unique members for this project who have tasks
        const memberMap = new Map();
        pTasks.forEach(t => {
          if (t.assignee && !memberMap.has(t.assignee.id)) {
            memberMap.set(t.assignee.id, {
              id: t.assignee.id,
              name: t.assignee.full_name,
              avatar: t.assignee.avatar_url,
              email: t.assignee.email
            });
          }
        });
        const pMembers = Array.from(memberMap.values()).slice(0, 5);

        return {
          id: p.id,
          name: p.name,
          color: p.color || "#36C5F0",
          completions: recentCompletions,
          velocity: Math.round((recentCompletions / (timeRange === "7d" ? 7 : 30)) * 10) / 10,
          progress: p.progress || 0,
          members: pMembers
        };
      }).sort((a, b) => b.velocity - a.velocity);
      setProjectVelocities(velocities);

      // 3. Member Merit Rankings (Top Performers)
      const merits = (workspaceMembers || []).map((m: any) => {
        const p = m.profiles;
        const mTasks = tasks.filter(t => t.assignee_id === p.id);
        const completions = mTasks.filter(t => t.status === 'done' && new Date(t.updated_at) > cutoff).length;
        const total = mTasks.length;
        const stalled = mTasks.filter(t => {
          const days = Math.floor((new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return t.status !== 'done' && days >= 3;
        }).length;
        
        // Complex Merit Score: (Completions/Total * 60) + (1 - Stalled/Total * 40)
        let score = 0;
        if (total > 0) {
          score = Math.round(((completions / total) * 70) + (Math.max(0, 1 - (stalled / total)) * 30));
        }

        return {
          id: p.id,
          name: p.full_name,
          avatar: p.avatar_url,
          email: p.email,
          completions,
          meritScore: score,
          status: (score > 85 ? "Elite" : score > 50 ? "Steady" : "Rising") as "Elite" | "Steady" | "Rising"
        };
      }).sort((a, b) => b.meritScore - a.meritScore);
      setMemberRankings(merits);

      // 4. Activity Feed
      const activities = tasks
        .filter(t => new Date(t.updated_at) > cutoff)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8)
        .map(t => ({
          id: t.id,
          type: t.status === 'done' ? "completion" : "creation" as const,
          title: t.title,
          time: new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: t.assignee?.full_name?.split(' ')[0] || "Someone"
        }));
      setRecentActivities(activities as RecentActivity[]);

      // 5. Chart Data
      const days = timeRange === "7d" ? 7 : 14;
      const chartPoints = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        chartPoints.push({
          x: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          y: tasks.filter(t => t.status === 'done' && t.updated_at.startsWith(ds)).length
        });
      }
      setVelocityChartData(chartPoints);

      // Summary Stats
      const doneTotal = tasks.filter(t => t.status === 'done').length;
      setStats({
        totalTasks: tasks.length,
        doneTasks: doneTotal,
        activeTasks: tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length,
        completionRate: tasks.length ? Math.round((doneTotal / tasks.length) * 100) : 0,
        projectCount: projects.length,
        stalledTasks: tasks.filter(t => {
          const days = Math.floor((new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return t.status !== 'done' && days >= 3;
        }).length,
        efficiencyScore: Math.min(100, 70 + Math.round((doneTotal / (tasks.length || 1)) * 30))
      });
    }

    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col font-sans bg-transparent pb-12">
      {/* Header */}
      <div className="pb-6 mb-6 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Workspace Merit
            <Sparkles className="text-indigo-500" size={20} />
          </h1>
          <p className="text-[13px] text-gray-500 font-medium mt-1">
            Real-time performance engine tracking velocity and task throughput.
          </p>
        </div>
        
        <div className="flex items-center bg-gray-50 border border-gray-200 p-1 rounded-lg shadow-sm shrink-0">
          {(["7d", "30d", "all"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors border-0 cursor-pointer ${
                timeRange === r 
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" 
                  : "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {r === 'all' ? 'Lifetime' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* TOP PERFORMERS CARD */}
        <div className="xl:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                Merit Leaders
              </h3>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Top contributors by throughput</p>
            </div>
          </div>

          <div className="space-y-5 flex-1">
            {memberRankings.slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center gap-4">
                <div className="relative">
                  <Avatar 
                    url={m.avatar} 
                    name={m.name} 
                    email={m.email}
                    role={m.status}
                    size={42} 
                    className="border border-gray-200 shadow-sm"
                  />
                  {i < 3 && (
                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm ${
                      i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : "bg-orange-400 text-white"
                    }`}>
                      <Trophy size={10} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1.5">
                    <div>
                      <span className="text-[13.5px] font-bold text-gray-900 block truncate">{m.name}</span>
                      <span className={`text-[11px] font-semibold ${m.status === 'Elite' ? 'text-indigo-600' : 'text-gray-500'}`}>{m.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[15px] font-bold text-gray-900 leading-none">{m.meritScore}</span>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Merit</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.meritScore}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full rounded-full ${m.status === 'Elite' ? 'bg-indigo-500' : 'bg-gray-400'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
            {memberRankings.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <p className="text-[12px] font-medium">No merit data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* VELOCITY LEADERBOARD (Fastest Projects) */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <Flame size={18} className="text-rose-500" />
                Momentum Matrix
              </h3>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Sprinting projects by task throughput</p>
            </div>
            <div className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md text-[11px] font-bold flex items-center gap-1.5 border border-rose-100 shadow-sm">
              <Activity size={12} className="animate-pulse" /> Peak Velocity
            </div>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {projectVelocities.slice(0, 4).map((p, i) => (
              <div 
                key={p.id}
                className="p-5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between shadow-sm hover:border-gray-300 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm text-[14px]" style={{ background: p.color }}>
                        {p.name[0]}
                      </div>
                      <span className="text-[15px] font-bold text-gray-900 tracking-tight">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[20px] font-bold text-rose-600 leading-none">{p.velocity}</span>
                      <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-widest mt-0.5">OP/DAY</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                      <span className="text-[12px] font-bold text-gray-900">{p.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-indigo-500"
                      />
                    </div>
                  </div>
                </div>
 
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex -space-x-2">
                    {p.members.length > 0 ? (
                      p.members.map(m => (
                        <Avatar 
                          key={m.id} 
                          url={m.avatar} 
                          name={m.name} 
                          email={m.email}
                          size={28} 
                          fallbackColor={p.color} 
                          className="border-2 border-gray-50 shadow-sm"
                        />
                      ))
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-gray-50 bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">?</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Advancing</span>
                    <ArrowUpRight size={12} className="text-emerald-600" />
                  </div>
                </div>
              </div>
            ))}
            {projectVelocities.length === 0 && (
              <div className="col-span-2 py-16 text-center border border-dashed border-gray-200 bg-gray-50 rounded-xl flex flex-col items-center justify-center">
                <Target size={24} className="text-gray-400 mb-3" />
                <p className="text-gray-500 font-semibold text-[13px]">No data detected in current range</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* COMPLETION VELOCITY CHART */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-500" />
                Throughput Intelligence
              </h3>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Daily completion matrix over time</p>
            </div>
          </div>
          <div className="h-[280px]">
             <Chart 
              options={{
                chart: { toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 800 } },
                colors: ['#4F46E5'],
                stroke: { curve: 'smooth', width: 3 },
                fill: {
                  type: 'gradient',
                  gradient: { shadeIntensity: 1, opacityFrom: 0.2, opacityTo: 0.05, stops: [20, 100] }
                },
                xaxis: { 
                  categories: velocityChartData.map(d => d.x), 
                  axisBorder: { show: false }, 
                  axisTicks: { show: false },
                  labels: { style: { colors: '#6B7280', fontWeight: 600, fontSize: '11px' } }
                },
                yaxis: {
                  labels: { style: { colors: '#6B7280', fontWeight: 600, fontSize: '11px' } }
                },
                grid: { borderColor: '#E5E7EB', strokeDashArray: 4, padding: { left: 10, right: 10, bottom: 0, top: 0 } },
                markers: { size: 4, colors: ['#4F46E5'], strokeWidth: 2, hover: { size: 6 } },
                tooltip: { theme: 'light', x: { show: false }, style: { fontSize: '12px', fontFamily: 'inherit' } }
              }} 
              series={[{ name: 'Tasks Completed', data: velocityChartData.map(d => d.y) }]} 
              type="area" 
              height="100%" 
            />
          </div>
        </div>

        {/* RECENT ACTION LOG */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-gray-400" />
              Activity Stream
            </h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-5 flex-1 overflow-y-auto pr-2">
            {recentActivities.map((a, i) => (
              <div key={a.id} className="flex gap-4 items-start">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 border border-white shadow-sm ${a.type === 'completion' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 leading-snug">{a.title}</p>
                  <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5 mt-1">
                    <span>{a.user}</span>
                    <span className="opacity-50">•</span>
                    <span>{a.time}</span>
                    {a.type === 'completion' && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-wider border border-emerald-100 ml-1">Done</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                <Activity size={24} className="opacity-40" />
                <p className="text-[12px] font-semibold">No recent activity</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
