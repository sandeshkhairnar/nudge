"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import dynamic from "next/dynamic";
import { 
  BarChart3, TrendingUp, CheckCircle2, AlertCircle, 
  Clock, Layout, ArrowUpRight, ArrowDownRight, 
  Loader2, Calendar, Users, PieChart as PieChartIcon,
  Trophy, Target, Zap, Sparkles, Activity, Flame, Award
} from "lucide-react";

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

function MiniAv({ name, avatar, color = "#36C5F0", sz = 28 }: { name: string, avatar?: string, color?: string, sz?: number }) {
  return (
    <div 
      className="rounded-full border-2 border-white flex items-center justify-center font-black text-white shrink-0 overflow-hidden"
      style={{ width: sz, height: sz, background: avatar ? 'transparent' : color, fontSize: sz * 0.35 }}
      title={name}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
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
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, color, progress")
      .eq("workspace_id", workspace.id);

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
    <div className="max-w-[1400px] mx-auto p-4 lg:p-10 space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Badge color="purple"><Sparkles size={10} className="inline mr-1" /> AI Insights Enabled</Badge>
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Workspace Healthy</span>
          </div>
          <h1 className="text-[36px] md:text-[52px] font-black text-gray-900 tracking-tight leading-none mb-3">Workspace Merit</h1>
          <p className="text-gray-500 text-[16px] font-medium max-w-xl">
            Real-time performance tracking. Identifying <span className="text-[#36C5F0] font-bold">top performers</span> and <span className="text-purple-600 font-bold">high-velocity projects</span>.
          </p>
        </motion.div>
        
        <div className="flex bg-white/80 backdrop-blur-md border border-gray-100 p-1.5 rounded-3xl shadow-xl shadow-gray-200/50 self-start">
          {(["7d", "30d", "all"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-8 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all border-0 cursor-pointer ${
                timeRange === r 
                  ? "bg-[#0D0D0D] text-white shadow-2xl scale-[1.05]" 
                  : "text-gray-400 hover:text-gray-600"
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
        <div className="xl:col-span-1 bg-[#0D0D0D] text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#36C5F0]/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <h3 className="text-[20px] font-black flex items-center gap-3">
              <Trophy size={24} className="text-amber-400" />
              Top Performers
            </h3>
            <Sparkles className="text-purple-400 animate-pulse" size={20} />
          </div>

          <div className="space-y-8 flex-1 relative z-10">
            {memberRankings.slice(0, 5).map((m, i) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 group cursor-default"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-[18px] overflow-hidden group-hover:border-[#36C5F0]/50 transition-colors">
                    {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name[0]}
                  </div>
                  {i === 0 && <div className="absolute -top-2 -right-2 bg-amber-400 text-black p-1 rounded-lg border-2 border-[#0D0D0D] animate-bounce"><Award size={14} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="text-[15px] font-bold block">{m.name}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${m.status === 'Elite' ? 'text-[#36C5F0]' : 'text-gray-500'}`}>{m.status} Rank</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[18px] font-black">{m.meritScore}</span>
                      <span className="text-[10px] text-gray-500 block">SCORE</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.meritScore}%` }}
                      className={`h-full ${m.status === 'Elite' ? 'bg-gradient-to-r from-[#36C5F0] to-purple-600' : 'bg-gray-700'}`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
            <p className="text-[12px] text-gray-500 leading-relaxed font-medium">
              Rankings are calculated based on <span className="text-white font-bold">completion speed</span>, <span className="text-white font-bold">consistency</span>, and <span className="text-white font-bold">low stall rates</span>.
            </p>
          </div>
        </div>

        {/* VELOCITY LEADERBOARD (Fastest Projects) */}
        <div className="xl:col-span-2 bg-white border-2 border-gray-100 rounded-[40px] p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-[20px] font-black text-gray-900 flex items-center gap-3">
                <Flame size={24} className="text-rose-500" />
                Fastest Moving Projects
              </h3>
              <p className="text-[14px] text-gray-400 font-bold mt-1">Which projects are showing high momentum?</p>
            </div>
            <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl text-[12px] font-black flex items-center gap-2">
              <Activity size={14} /> HIGH VELOCITY
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {projectVelocities.slice(0, 4).map((p, i) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -5 }}
                className="p-6 rounded-[32px] bg-[#FAFAF8] border border-gray-100/50 hover:border-[#36C5F0]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm" style={{ background: p.color }}>
                        {p.name[0]}
                      </div>
                      <span className="text-[16px] font-black text-gray-900">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[20px] font-black text-rose-500">{p.velocity}</span>
                      <span className="text-[9px] font-black text-gray-400 block uppercase tracking-widest">TASKS / DAY</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Workspace Progress</span>
                      <span className="text-[13px] font-bold text-gray-900">{p.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        className="h-full bg-gradient-to-r from-[#36C5F0] to-[#2EB67D]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {p.members.length > 0 ? (
                      p.members.map(m => <MiniAv key={m.id} name={m.name} avatar={m.avatar} color={p.color} />)
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold">?</div>
                    )}
                  </div>
                  <Badge color="emerald">Moving Fast</Badge>
                </div>
              </motion.div>
            ))}
            {projectVelocities.length === 0 && (
              <div className="col-span-2 py-20 text-center text-gray-300 italic">No projects found in this workspace.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* COMPLETION VELOCITY CHART */}
        <div className="lg:col-span-2 bg-white border-2 border-gray-100 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[18px] font-black text-gray-900 flex items-center gap-3">
              <TrendingUp size={20} className="text-[#36C5F0]" />
              Completion Trends
            </h3>
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{timeRange.toUpperCase()} ACTIVITY LOG</div>
          </div>
          <div className="h-[300px]">
             <Chart 
              options={{
                chart: { toolbar: { show: false }, background: 'transparent' },
                colors: ['#36C5F0'],
                stroke: { curve: 'smooth', width: 4 },
                xaxis: { categories: velocityChartData.map(d => d.x), axisBorder: { show: false }, axisTicks: { show: false } },
                grid: { borderColor: '#F5F5F2', strokeDashArray: 6 },
                tooltip: { theme: 'light' }
              }} 
              series={[{ name: 'Tasks Done', data: velocityChartData.map(d => d.y) }]} 
              type="area" 
              height="100%" 
            />
          </div>
        </div>

        {/* RECENT ACTION LOG */}
        <div className="bg-white border-2 border-gray-100 rounded-[40px] p-8 shadow-sm flex flex-col">
          <h3 className="text-[18px] font-black text-gray-900 mb-8 flex items-center gap-3">
            <Activity size={20} className="text-gray-400" />
            Live Activity
          </h3>
          <div className="space-y-6 flex-1">
            {recentActivities.map((a, i) => (
              <div key={a.id} className="flex gap-4 items-start group">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.type === 'completion' ? 'bg-emerald-500' : 'bg-[#36C5F0]'}`} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-gray-900 leading-snug line-clamp-1">{a.title}</p>
                  <p className="text-[11px] font-bold text-gray-400 flex items-center gap-2 mt-1">
                    {a.user} • {a.time} {a.type === 'completion' && <span className="text-emerald-500">DONE</span>}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <Layout size={32} opacity={0.2} />
                <p className="text-[12px] font-black uppercase tracking-widest">No Recent Vibrations</p>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-4 rounded-2xl bg-gray-50 text-gray-400 text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border-0 cursor-pointer">
            Full Workspace Log
          </button>
        </div>

      </div>
    </div>
  );
}
