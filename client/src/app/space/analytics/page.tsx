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
  members: { id: string; name: string; avatar?: string }[];
}

interface MemberMerit {
  id: string;
  name: string;
  avatar?: string;
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
   COMPONENTS
═══════════════════════════ */
function Badge({ children, color = "blue" }: { children: React.ReactNode, color?: string }) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
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
      .select("profiles(id, full_name, avatar_url)")
      .eq("workspace_id", workspace.id);

    if (!projects || projects.length === 0) {
      setLoading(false);
      return;
    }

    const projectIds = projects.map(p => p.id);
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)")
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
              avatar: t.assignee.avatar_url
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
    <div className="flex items-center justify-center h-[500px]">
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin text-[#36C5F0] mb-4" size={40} />
        <span className="text-[14px] font-black text-gray-400 uppercase tracking-widest">Engaging Neural Analytics...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10 space-y-12">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge color="purple"><Sparkles size={11} className="inline mr-1.5" /> AI Insights Active</Badge>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Operational</span>
            </div>
          </div>
          <h1 className="text-[42px] sm:text-[56px] lg:text-[72px] font-black text-gray-900 tracking-tighter leading-[0.9] mb-4">
            Workspace <span className="text-[#36C5F0]">Merit</span>
          </h1>
          <p className="text-gray-500 text-[16px] sm:text-[18px] font-medium max-w-2xl leading-relaxed">
            Real-time performance engine. Surfacing <span className="text-[#36C5F0] font-bold">top performance</span> and <span className="text-purple-600 font-bold">high-velocity projects</span> across your organization.
          </p>
        </motion.div>
        
        <div className="flex bg-white/40 backdrop-blur-xl border border-gray-200/50 p-2 rounded-[28px] shadow-2xl shadow-gray-200/40 self-start shrink-0">
          {(["7d", "30d", "all"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all border-0 cursor-pointer ${
                timeRange === r 
                  ? "bg-[#0D0D0D] text-white shadow-xl scale-[1.02]" 
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50/50"
              }`}
            >
              {r === 'all' ? 'Lifetime' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Actionable Merit Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* TOP PERFORMERS CARD */}
        <div className="xl:col-span-1 bg-[#0D0D0D] text-white rounded-[48px] p-8 sm:p-10 shadow-3xl relative overflow-hidden flex flex-col min-h-[550px]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[120px] -mr-48 -mt-48 transition-opacity duration-1000" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#36C5F0]/20 rounded-full blur-[100px] -ml-36 -mb-36" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-[24px] font-black tracking-tight flex items-center gap-3">
                <Trophy size={28} className="text-amber-400" />
                Merit Leaders
              </h3>
              <p className="text-gray-500 text-[13px] font-bold mt-1 uppercase tracking-widest">Global Ranking</p>
            </div>
          </div>

          <div className="space-y-8 flex-1 relative z-10">
            {memberRankings.slice(0, 5).map((m, i) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-5 group cursor-default"
              >
                <div className="relative shrink-0">
                  <Avatar 
                    url={m.avatar} 
                    name={m.name} 
                    size={64} 
                    className="rounded-[24px] border border-white/10 shadow-lg group-hover:border-[#36C5F0]/40 transition-all group-hover:scale-105 duration-500"
                  />
                  {i < 3 && (
                    <div className={`absolute -top-2 -right-2 p-1.5 rounded-xl border-2 border-[#0D0D0D] shadow-lg ${
                      i === 0 ? "bg-amber-400 text-black scale-110" : i === 1 ? "bg-gray-300 text-black" : "bg-orange-400 text-black"
                    }`}>
                      <Trophy size={12} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-2.5">
                    <div>
                      <span className="text-[17px] font-black block tracking-tight">{m.name}</span>
                      <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${m.status === 'Elite' ? 'text-[#36C5F0]' : 'text-gray-500'}`}>{m.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[24px] font-black leading-none">{m.meritScore}</span>
                      <p className="text-[9px] text-gray-500 font-black tracking-tighter uppercase mt-1">Merit</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.meritScore}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${m.status === 'Elite' ? 'bg-gradient-to-r from-[#36C5F0] via-purple-500 to-rose-500' : 'bg-gray-700'}`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[32px] border border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-[#36C5F0]/20 flex items-center justify-center text-[#36C5F0]">
                <Sparkles size={20} />
              </div>
              <p className="text-[12px] text-gray-400 leading-snug font-medium">
                Analysis incorporates <span className="text-white font-bold">dynamic velocity</span> and <span className="text-white font-bold">task completion depth</span>.
              </p>
            </div>
          </div>
        </div>

        {/* VELOCITY LEADERBOARD (Fastest Projects) */}
        <div className="xl:col-span-2 bg-white/50 backdrop-blur-3xl border border-gray-200/50 rounded-[48px] p-8 sm:p-10 shadow-2xl shadow-gray-200/20 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
            <div>
              <h3 className="text-[24px] font-black text-gray-900 flex items-center gap-3">
                <Flame size={28} className="text-rose-500" />
                Momentum Matrix
              </h3>
              <p className="text-[15px] text-gray-500 font-medium mt-1">Sprinting projects by historical task throughput.</p>
            </div>
            <div className="px-5 py-2.5 bg-rose-500/5 text-rose-600 rounded-2xl text-[12px] font-black flex items-center justify-center gap-2 border border-rose-500/10">
              <Activity size={16} className="animate-pulse" /> PEAK VELOCITY
            </div>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {projectVelocities.slice(0, 4).map((p, i) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -8, scale: 1.01 }}
                className="p-8 rounded-[40px] bg-white border border-gray-100 hover:border-[#36C5F0]/40 transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-[#36C5F0]/5 group"
              >
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[20px] flex items-center justify-center text-white font-black shadow-lg group-hover:rotate-6 transition-transform duration-500" style={{ background: p.color }}>
                        {p.name[0]}
                      </div>
                      <span className="text-[18px] font-black text-gray-900 tracking-tight">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[28px] font-black text-rose-500 leading-none">{p.velocity}</span>
                      <span className="text-[10px] font-black text-gray-400 block uppercase tracking-widest mt-1">OP/DAY</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#36C5F0] transition-colors">Project Progress</span>
                      <span className="text-[15px] font-black text-gray-900">{p.progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#36C5F0] via-[#2EB67D] to-indigo-500"
                      />
                    </div>
                  </div>
                </div>
 
                <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex -space-x-3">
                    {p.members.length > 0 ? (
                      p.members.map(m => (
                        <Avatar 
                          key={m.id} 
                          url={m.avatar} 
                          name={m.name} 
                          size={32} 
                          fallbackColor={p.color} 
                          className="border-2 border-white shadow-sm"
                        />
                      ))
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold">?</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    <span className="text-[11px] font-black text-[#2EB67D] uppercase tracking-wider">Advancing</span>
                    <ArrowUpRight size={14} className="text-[#2EB67D]" />
                  </div>
                </div>
              </motion.div>
            ))}
            {projectVelocities.length === 0 && (
              <div className="col-span-2 py-24 text-center border-2 border-dashed border-gray-100 rounded-[40px]">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Target size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[12px]">No data detected in current range</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* COMPLETION VELOCITY CHART */}
        <div className="lg:col-span-2 bg-white/50 backdrop-blur-3xl border border-gray-200/50 rounded-[48px] p-8 sm:p-10 shadow-2xl shadow-gray-200/20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-[20px] font-black text-gray-900 flex items-center gap-3">
                <TrendingUp size={24} className="text-[#36C5F0]" />
                Throughput Intelligence
              </h3>
              <p className="text-[13px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Daily Operations Matrix</p>
            </div>
          </div>
          <div className="h-[320px]">
             <Chart 
              options={{
                chart: { toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 800 } },
                colors: ['#36C5F0', '#2EB67D'],
                stroke: { curve: 'smooth', width: 5 },
                fill: {
                  type: 'gradient',
                  gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] }
                },
                xaxis: { 
                  categories: velocityChartData.map(d => d.x), 
                  axisBorder: { show: false }, 
                  axisTicks: { show: false },
                  labels: { style: { colors: '#94a3b8', fontWeight: 700, fontSize: '10px' } }
                },
                yaxis: {
                  labels: { style: { colors: '#94a3b8', fontWeight: 700 } }
                },
                grid: { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { left: 20, right: 20 } },
                markers: { size: 4, colors: ['#36C5F0'], strokeWidth: 3, hover: { size: 7 } },
                tooltip: { theme: 'light', x: { show: false }, style: { fontSize: '12px', fontFamily: 'inherit' } }
              }} 
              series={[{ name: 'Tasks Completed', data: velocityChartData.map(d => d.y) }]} 
              type="area" 
              height="100%" 
            />
          </div>
        </div>

        {/* RECENT ACTION LOG */}
        <div className="bg-[#FAFAF8]/50 backdrop-blur-xl border border-gray-200/80 rounded-[48px] p-8 sm:p-10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[20px] font-black text-gray-900 flex items-center gap-3">
              <Activity size={24} className="text-gray-400" />
              Neural Stream
            </h3>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="space-y-7 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {recentActivities.map((a, i) => (
              <motion.div 
                key={a.id} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-5 items-start relative group"
              >
                <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${a.type === 'completion' ? 'bg-emerald-500' : 'bg-[#36C5F0]'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black text-gray-900 leading-tight group-hover:text-[#36C5F0] transition-colors">{a.title}</p>
                  <p className="text-[11px] font-bold text-gray-500 flex items-center flex-wrap gap-x-2 mt-1.5 opacity-70">
                    <span className="text-gray-900">{a.user}</span>
                    <span className="text-[8px] opacity-30">•</span>
                    <span>{a.time}</span>
                    {a.type === 'completion' && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">Confirmed</span>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
            {recentActivities.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 py-10">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <Activity size={24} opacity={0.2} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Static Stream</p>
              </div>
            )}
          </div>
          <button className="mt-10 w-full py-4 rounded-[24px] bg-white border border-gray-100 shadow-sm text-gray-900 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 hover:shadow-md active:scale-95 transition-all cursor-pointer">
            Access Full Node Log
          </button>
        </div>

      </div>
    </div>
  );
}
