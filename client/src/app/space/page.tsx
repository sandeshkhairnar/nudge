"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import dynamic from "next/dynamic";
import Link from "next/link";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Project { id: string; name: string; color: string; progress: number; task_count: number; }
interface DashTask {
  id: string; title: string; status: "todo" | "in_progress" | "review" | "done";
  stalled_days: number; due_date: string | null; project_id: string;
  project_name: string | null; project_color: string | null;
  assignee_name: string | null; assignee_id: string | null;
}
interface TeamMember { id: string; full_name: string | null; task_count: number; done_count: number; }
interface Stats { total: number; done: number; inProgress: number; stalled: number; projects: number; members: number; }

const PALETTE = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
function strColor(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return PALETTE[Math.abs(h) % PALETTE.length]; }
function ini(n: string | null | undefined) { if (!n) return "?"; return n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase(); }

const STATUS_META = {
  todo: { label: "To Do", bg: "#F5F5F2", fg: "#6B7280" },
  in_progress: { label: "Active", bg: "#EFF9FE", fg: "#36C5F0" },
  review: { label: "Review", bg: "#FFFBEB", fg: "#D97706" },
  done: { label: "Done", bg: "#ECFDF5", fg: "#059669" },
};

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

function CountUp({ to }: { to: number }) {
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

function MiniRing({ value, color, size = 38 }: { value: number; color: string; size?: number }) {
  const r = (size - 7) / 2, c = 2 * Math.PI * r;
  const ref = useRef(null); const inView = useInView(ref, { once: true });
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F0EB" strokeWidth="5" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={inView ? { strokeDashoffset: c - (value / 100) * c } : {}}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />
      <text x={size / 2} y={size / 2 + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill="#0D0D0D">{value}%</text>
    </svg>
  );
}

const NUDGES = [
  { task: "API rate limiting", msg: "6 days, no updates. Ping the assignee?", accent: "#ECB22E", time: "2m" },
  { task: "Onboarding flow v2", msg: "No assignee, due in 3 days.", accent: "#E01E5A", time: "18m" },
  { task: "Design System merge", msg: "3 unresolved PR review comments.", accent: "#36C5F0", time: "1h" },
];

const I = {
  task: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  folder: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  team: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M21 20c0-2.8-1.8-5-4-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  send: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
};

/* shared card shell — fills its grid cell fully */
function Card({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div
      className={`h-full flex flex-col rounded-2xl border overflow-hidden ${className}`}
      style={dark
        ? { background: "#0D0D0D", borderColor: "rgba(255,255,255,0.07)", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }
        : { background: "#fff", borderColor: "#EBEBEB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }
      }>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F2] flex-shrink-0">
      <div>
        <p className="text-[13px] font-black text-[#0D0D0D] leading-none">{title}</p>
        {sub && <p className="text-[10.5px] text-[#B0B0A8] mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function EmptySlot({ msg }: { msg: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
      <div className="w-8 h-8 rounded-xl bg-[#F5F5F2] flex items-center justify-center mb-2 text-[#C8C8C0]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" /></svg>
      </div>
      <p className="text-[11px] text-[#B0B0A8] text-center leading-relaxed">{msg}</p>
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);

  const [stats, setStats] = useState<Stats>({ total: 0, done: 0, inProgress: 0, stalled: 0, projects: 0, members: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<DashTask[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [weekly, setWeekly] = useState<{ week: string; done: number; inProgress: number; todo: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; full_name: string | null } | null>(null);
  const [tab, setTab] = useState<"all" | "mine" | "stalled">("all");
  const [aiInput, setAiInput] = useState("");

  useEffect(() => {
    if (!workspace?.id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id,full_name").eq("id", user.id).single();
      if (prof) setMe(prof as any);

      const { data: pm } = await supabase
        .from("project_members")
        .select("project_id, projects!project_members_project_id_fkey(id,name,color,progress,workspace_id)")
        .eq("user_id", user.id);

      const myProjects = ((pm ?? []) as any[]).map(r => r.projects).filter(p => p?.workspace_id === workspace.id);
      const pids: string[] = myProjects.map((p: any) => p.id);
      if (!pids.length) { setLoading(false); return; }

      const { data: raw } = await supabase
        .from("tasks")
        .select("id,title,status,stalled_days,due_date,project_id,assignee:profiles!tasks_assignee_id_fkey(id,full_name),project:projects!tasks_project_id_fkey(name,color)")
        .in("project_id", pids)
        .order("stalled_days", { ascending: false });

      const shaped: DashTask[] = ((raw ?? []) as any[]).map(t => ({
        id: t.id, title: t.title, status: t.status,
        stalled_days: t.stalled_days ?? 0, due_date: t.due_date, project_id: t.project_id,
        project_name: t.project?.name ?? null, project_color: t.project?.color ?? null,
        assignee_name: t.assignee?.full_name ?? null, assignee_id: t.assignee?.id ?? null,
      }));

      const tByP: Record<string, number> = {};
      shaped.forEach(t => { tByP[t.project_id] = (tByP[t.project_id] ?? 0) + 1; });

      const hydrated: Project[] = myProjects.map((p: any) => ({
        id: p.id, name: p.name, color: p.color ?? "#36C5F0", progress: p.progress ?? 0, task_count: tByP[p.id] ?? 0,
      }));

      const { data: mem } = await supabase
        .from("project_members")
        .select("user_id, profiles!project_members_user_id_fkey(id,full_name)")
        .in("project_id", pids);

      const mmap: Record<string, TeamMember> = {};
      ((mem ?? []) as any[]).forEach(m => {
        const p = m.profiles; if (!p || mmap[p.id]) return;
        mmap[p.id] = { id: p.id, full_name: p.full_name, task_count: 0, done_count: 0 };
      });
      shaped.forEach(t => {
        if (t.assignee_id && mmap[t.assignee_id]) {
          mmap[t.assignee_id].task_count++;
          if (t.status === "done") mmap[t.assignee_id].done_count++;
        }
      });

      const WEEKS = ["W-5", "W-4", "W-3", "W-2", "W-1", "Now"];
      const wk = WEEKS.map(w => ({ week: w, done: 0, inProgress: 0, todo: 0 }));
      const bs = Math.max(Math.ceil(shaped.length / 6), 1);
      shaped.forEach((t, i) => {
        const b = Math.min(Math.floor(i / bs), 5);
        if (t.status === "done") wk[b].done++;
        else if (t.status === "in_progress") wk[b].inProgress++;
        else wk[b].todo++;
      });

      setProjects(hydrated); setTasks(shaped);
      setTeam(Object.values(mmap).sort((a, b) => b.task_count - a.task_count).slice(0, 6));
      setWeekly(wk);
      setStats({ total: shaped.length, done: shaped.filter(t => t.status === "done").length, inProgress: shaped.filter(t => t.status === "in_progress").length, stalled: shaped.filter(t => t.stalled_days >= 3).length, projects: hydrated.length, members: Object.keys(mmap).length });
      setLoading(false);
    })();
  }, [workspace?.id]);

  const filtered = tasks.filter(t => tab === "mine" ? t.assignee_id === me?.id : tab === "stalled" ? t.stalled_days >= 3 : true).slice(0, 10);
  const donutS = [tasks.filter(t => t.status === "done").length, tasks.filter(t => t.status === "in_progress").length, tasks.filter(t => t.status === "review").length, tasks.filter(t => t.status === "todo").length];
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const velOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, background: "transparent", fontFamily: "inherit", animations: { enabled: true, speed: 600 } },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "50%", borderRadiusApplication: "end" } },
    colors: ["#2EB67D", "#36C5F0", "#EBEBEB"],
    dataLabels: { enabled: false },
    xaxis: { categories: weekly.map(w => w.week), labels: { style: { colors: "#9CA3AF", fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: "#9CA3AF", fontSize: "10px" } }, tickAmount: 3 },
    grid: { borderColor: "#F0F0EB", strokeDashArray: 4, padding: { left: -4, right: 0, top: -6, bottom: 0 } },
    legend: { show: false }, tooltip: { theme: "light" }, fill: { opacity: 1 },
  };
  const velSeries: ApexAxisChartSeries = [
    { name: "Done", data: weekly.map(w => w.done) },
    { name: "Active", data: weekly.map(w => w.inProgress) },
    { name: "Todo", data: weekly.map(w => w.todo) },
  ];
  const donutOpts: ApexCharts.ApexOptions = {
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    colors: ["#2EB67D", "#36C5F0", "#ECB22E", "#E5E7EB"],
    labels: ["Done", "In Progress", "Review", "To Do"],
    dataLabels: { enabled: false }, legend: { show: false },
    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", fontSize: "11px", fontWeight: "700", color: "#9CA3AF", formatter: () => stats.total.toString() } } } } },
    stroke: { width: 0 }, tooltip: { theme: "light" },
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-7 h-7 rounded-full border-2 border-[#36C5F0] border-t-transparent" />
    </div>
  );


  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* ── ROW 1: Greeting ── */}
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11.5px] text-[#B0B0A8] font-semibold mb-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-[22px] font-black text-[#0D0D0D] tracking-[-0.025em]">
              {greeting}, {me?.full_name?.split(" ")[0] ?? "there"} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* inline completion ring */}
            <div className="flex items-center gap-2.5 bg-white border border-[#EBEBEB] rounded-xl px-3.5 py-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <svg width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="10" fill="none" stroke="#F0F0EB" strokeWidth="3.5" />
                <motion.circle cx="14" cy="14" r="10" fill="none" stroke="#2EB67D" strokeWidth="3.5"
                  strokeLinecap="round" strokeDasharray={62.8}
                  initial={{ strokeDashoffset: 62.8 }}
                  animate={{ strokeDashoffset: 62.8 - (pct / 100) * 62.8 }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />
              </svg>
              <div className="leading-none">
                <p className="text-[9.5px] text-[#B0B0A8] font-semibold mb-2">Overall</p>
                <p className="text-[13px] font-black text-[#0D0D0D]">{pct}% done</p>
              </div>
            </div>
            {stats.stalled > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 bg-[#FFF8EC] border border-[#FDEBC8] rounded-xl px-3.5 py-2">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-[#ECB22E] flex-shrink-0" />
                <span className="text-[12px] font-bold text-[#92400E]">{stats.stalled} stalled</span>
              </motion.div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ── ROW 2: Stat cards ── */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.06 } } }}>
        {([
          { label: "Total Tasks", value: stats.total, accent: "#36C5F0", icon: I.task, sub: `${stats.inProgress} active` },
          { label: "Completed", value: stats.done, accent: "#2EB67D", icon: I.check, sub: `${pct}% rate` },
          { label: "Projects", value: stats.projects, accent: "#A259FF", icon: I.folder, sub: "active" },
          { label: "Team", value: stats.members, accent: "#ECB22E", icon: I.team, sub: "members" },
        ] as any[]).map((s, i) => (
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

      {/* ── ROW 3: Velocity (8) | NudgeAI (4) ── */}
      <div className="grid grid-cols-12 gap-4 items-stretch">

        {/* Velocity — 8 cols */}
        <Reveal delay={0.04} className="col-span-16 lg:col-span-8 flex">
          <Card className="flex flex-col flex-1 min-h-[400px]">
            <CardHeader title="Task velocity" sub="Sprint distribution"
              right={
                <div className="flex items-center gap-3">
                  {[["Done", "#2EB67D"], ["Active", "#36C5F0"], ["Todo", "#EBEBEB"]].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                      <span className="text-[10px] font-semibold text-[#B0B0A8]">{l}</span>
                    </div>
                  ))}
                </div>
              }
            />
            <div className="flex-1 px-4 pb-3 pt-2 min-h-0">
              {tasks.length > 0
                ? <Chart options={velOpts} series={velSeries} type="bar" height="100%" />
                : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-[#F5F5F2] flex items-center justify-center mb-2 text-[#C8C8C0]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="13" width="4" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
                        <rect x="10" y="8" width="4" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
                        <rect x="17" y="3" width="4" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-black text-[#0D0D0D] mb-1">No velocity data</p>
                    <p className="text-[11px] text-[#B0B0A8] text-center max-w-[180px]">Complete tasks to see sprint velocity here.</p>
                  </div>
                )
              }
            </div>
          </Card>
        </Reveal>

        {/* NudgeAI — 4 cols */}
        <Reveal delay={0.08} className="col-span-8 lg:col-span-4 flex">
          <Card dark className="flex flex-col flex-1 min-h-[400px] min-h-0 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
              style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />

            <div className="relative flex flex-col h-full p-4 min-h-0">

              {/* Header */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10 flex-shrink-0">
                {/* Logo SVG as avatar */}
                <div className="w-8 h-8 rounded-xl bg-[#0D0D0D] flex items-center justify-center flex-shrink-0 shadow-lg ring-1 ring-white/10">
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
                    <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
                    <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
                    <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">Nudge AI</h3>
                  <p className="text-[10px] text-green-400 leading-tight">● online</p>
                </div>
              </div>

              {/* Chat Messages — scrollable, fills remaining height */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                {/* Bot Message */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0D0D0D] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
                      <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
                      <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
                      <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
                      <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
                    </svg>
                  </div>
                  <div className="bg-white/10 rounded-lg rounded-tl-sm p-2.5 max-w-[82%]">
                    <p className="text-xs text-white/80 leading-relaxed">Hello! How can I help you today?</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex items-start gap-2 justify-end">
                  <div className="bg-[#36C5F0]/20 border border-[#36C5F0]/20 rounded-lg rounded-tr-sm p-2.5 max-w-[82%]">
                    <p className="text-xs text-white leading-relaxed">What tasks are due today?</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-purple-500/80 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">U</div>
                </div>

                {/* Bot Response with task list */}
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0D0D0D] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
                      <rect x="6" y="6" width="16" height="16" rx="8" fill="#36C5F0" />
                      <rect x="6" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
                      <rect x="26" y="6" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
                      <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
                    </svg>
                  </div>
                  <div className="bg-white/10 rounded-lg rounded-tl-sm p-2.5 max-w-[82%]">
                    <p className="text-xs text-white/80 leading-relaxed mb-2">
                      You have <span className="text-white font-semibold">3 tasks</span> due today:
                    </p>
                    <ul className="space-y-1.5">
                      {[["Finish report", "2:00 PM", "#36C5F0"], ["Team meeting", "3:00 PM", "#2EB67D"], ["Review PR", "5:00 PM", "#ECB22E"]].map(([task, time, color]) => (
                        <li key={task} className="flex items-center justify-between gap-2 bg-white/5 rounded-md px-2 py-1">
                          <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                            {task}
                          </span>
                          <span className="text-[10px] text-white/40 flex-shrink-0 font-mono">{time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Input — pinned to bottom */}
              <div className="flex gap-2 pt-3 border-t border-white/10 flex-shrink-0">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask Nudge AI..."
                  className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#36C5F0] transition-all"
                />
                <button className="bg-[#36C5F0] hover:bg-[#2ba9d4] w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

            </div>
          </Card>
        </Reveal>
      </div>

      {/* ── ROW 4: Tasks table (8) | Projects + Team sidebar (4) — items-stretch ── */}
      <div className="grid grid-cols-12 gap-4" style={{ alignItems: "stretch" }}>

        {/* Tasks — 8 cols */}
        <Reveal delay={0.04} className="col-span-12 lg:col-span-8">
          <Card>
            <CardHeader title="Tasks"
              right={
                <div className="flex bg-[#F5F5F2] rounded-lg p-0.5 gap-px">
                  {(["all", "mine", "stalled"] as const).map(t => (
                    <motion.button key={t} onClick={() => setTab(t)}
                      className="relative px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer border-0 capitalize"
                      style={{ color: tab === t ? "#0D0D0D" : "#9CA3AF", background: "transparent", fontFamily: "inherit" }}>
                      {tab === t && <motion.div layoutId="ttab" className="absolute inset-0 bg-white rounded-md" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />}
                      <span className="relative">{t}</span>
                    </motion.button>
                  ))}
                </div>
              }
            />
            {/* table scrolls inside, card height is driven by the grid row */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-[#F5F5F2]">
                    {["Task", "Project", "Assignee", "Status", "Age"].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[9.5px] font-black uppercase tracking-[0.08em] text-[#B0B0A8]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={5}>
                          <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-9 h-9 rounded-xl bg-[#F5F5F2] flex items-center justify-center mb-2 text-[#C8C8C0]">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" /><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 2" /></svg>
                            </div>
                            <p className="text-[12px] font-black text-[#0D0D0D] mb-0.5">
                              {tab === "mine" ? "No assigned tasks" : tab === "stalled" ? "No stalled tasks" : "No tasks yet"}
                            </p>
                            <p className="text-[10.5px] text-[#B0B0A8] text-center max-w-[160px] leading-relaxed">
                              {tab === "mine" ? "Tasks assigned to you appear here." : tab === "stalled" ? "Everything is moving!" : "Create tasks in your projects."}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    ) : filtered.map((task, i) => {
                      const s = STATUS_META[task.status];
                      return (
                        <motion.tr key={task.id}
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.28 }}
                          whileHover={{ background: "#FAFAF8" }}
                          className="border-b border-[#F9F9F7] last:border-0">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: task.project_color ?? "#9CA3AF" }} />
                              <span className="text-[11.5px] font-semibold text-[#0D0D0D] truncate max-w-[140px]">{task.title}</span>
                              {task.stalled_days >= 5 && (
                                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                                  className="text-[8px] font-black bg-[#FFF8EC] text-[#ECB22E] px-1 py-0.5 rounded flex-shrink-0">⚡</motion.span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10.5px] text-[#6B7280] font-medium truncate max-w-[80px] block">{task.project_name ?? "—"}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {task.assignee_id ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white flex-shrink-0"
                                  style={{ background: strColor(task.assignee_id) }}>{ini(task.assignee_name)}</div>
                                <span className="text-[10.5px] text-[#6B7280] truncate max-w-[55px]">{task.assignee_name}</span>
                              </div>
                            ) : <span className="text-[10.5px] text-[#D1D5DB]">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[9.5px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ color: s.fg, background: s.bg }}>{s.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-[10.5px] font-semibold whitespace-nowrap"
                            style={{ color: task.stalled_days >= 5 ? "#ECB22E" : "#B0B0A8" }}>
                            {task.stalled_days === 0 ? "Now" : `${task.stalled_days}d`}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filtered.length > 5 && (
              <div className="px-5 py-2 border-t border-[#F5F5F2] flex-shrink-0">
                <span className="text-[10px] text-[#B0B0A8]">Showing {filtered.length} of {tasks.length}</span>
              </div>
            )}
          </Card>
        </Reveal>

        {/* Nudge feed */}
        <Reveal delay={0.04} className="col-span-12 lg:col-span-4">
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "#0D0D0D", boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative px-5 pt-5 pb-0">
              <div className="flex items-center gap-2 mb-4">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-[#36C5F0]" />
                <h3 className="text-[14px] font-black text-white">Nudge feed</h3>
                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(54,197,240,0.15)", color: "#36C5F0" }}>AI</span>
              </div>
            </div>
            <div className="relative pb-4">
              {NUDGES.map((n, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="px-5 py-3.5"
                  style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <span className="text-[12px] font-bold truncate" style={{ color: n.accent }}>{n.task}</span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{n.time}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>{n.msg}</p>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-black text-white border-0 cursor-pointer"
                      style={{ background: n.accent, fontFamily: "'Sora',sans-serif" }}>
                      Send nudge
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold border-0 cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontFamily: "'Sora',sans-serif" }}>
                      Dismiss
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── ROW 5: Nudge feed (7) | NudgeAI (5) — same height, dark cards ── */}
      <div className="grid grid-cols-12 gap-4 items-stretch">

        {/* Donut */}
        <Reveal delay={0.08} className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader title="Status breakdown" sub="Task distribution" />
            <div className="flex-1 px-4 pb-2 pt-2 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0">
                {stats.total > 0
                  ? <Chart options={donutOpts} series={donutS} type="donut" height="100%" />
                  : <EmptySlot msg="Add tasks to see the status breakdown." />
                }
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-2 flex-shrink-0">
                {([
                  ["Done", donutS[0], "#2EB67D"],
                  ["Active", donutS[1], "#36C5F0"],
                  ["Review", donutS[2], "#ECB22E"],
                  ["To Do", donutS[3], "#D1D5DB"]
                ]).map(([l, n, c]) => (
                  <div key={l} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#F9F9F7]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    <span className="text-[10px] font-semibold text-[#6B7280] flex-1 truncate">{l}</span>
                    <span className="text-[11px] font-black text-[#0D0D0D]">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Project health */}
        <Reveal delay={0.04} className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader
              title="Project health"
              right={<span className="text-[10px] font-bold text-[#B0B0A8]">{projects.length} active</span>}
            />
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {projects.length === 0
                ? <EmptySlot msg="Join or create a project to track health." />
                : (
                  <div className="flex flex-col gap-3.5">
                    {projects.slice(0, 5).map((p, i) => (
                      <Link key={p.id} href={`/space/${p.id}`} className="no-underline block">
                        <motion.div whileHover={{ x: 2 }} className="flex items-center gap-2.5 cursor-pointer">
                          <MiniRing value={p.progress} color={p.color} size={34} />

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11.5px] font-bold text-[#0D0D0D] truncate">{p.name}</span>
                              <span className="text-[9px] text-[#B0B0A8]">{p.task_count}t</span>
                            </div>

                            <div className="h-[3px] bg-[#F0F0EB] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${p.progress}%` }}
                                transition={{ delay: 0.3 + i * 0.06, duration: 0.8 }}
                                className="h-full rounded-full"
                                style={{ background: p.color }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )
              }
            </div>
          </Card>
        </Reveal>

        {/* Team activity */}
        <Reveal delay={0.04} className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader
              title="Team activity"
              right={<span className="text-[10px] font-bold text-[#B0B0A8]">{team.length} members</span>}
            />
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {team.length === 0
                ? <EmptySlot msg="Assign tasks to track team output." />
                : (
                  <div className="flex flex-col gap-3">
                    {team.map(m => {
                      const p = m.task_count ? Math.round((m.done_count / m.task_count) * 100) : 0;

                      return (
                        <div key={m.id} className="flex items-center gap-2.5">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                            style={{ background: strColor(m.id) }}
                          >
                            {ini(m.full_name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-semibold text-[#374151] truncate">
                                {m.full_name?.split(" ")[0] ?? "Unknown"}
                              </span>
                              <span className="text-[9px] font-bold text-[#B0B0A8]">
                                {m.done_count}/{m.task_count}
                              </span>
                            </div>

                            <div className="h-[3px] bg-[#F0F0EB] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${p}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full rounded-full bg-[#2EB67D]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          </Card>
        </Reveal>

      </div>
    </div>
  );
}



// <Reveal delay={0.04} className="col-span-12 lg:col-span-7">
//   <Card dark>
//     {/* dot pattern */}
//     <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
//       style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
//     <div className="relative flex flex-col h-full">
//       <div className="flex items-center gap-2 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
//         <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
//           className="w-1.5 h-1.5 rounded-full bg-[#36C5F0]" />
//         <h3 className="text-[13px] font-black text-white">Nudge feed</h3>
//         <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full"
//           style={{ background: "rgba(54,197,240,0.15)", color: "#36C5F0" }}>AI · {NUDGES.length}</span>
//       </div>
//       {/* 3 nudge cards in a row — no scrolling needed */}
//       <div className="flex-1 grid grid-cols-3 gap-3 p-4">
//         {NUDGES.map((n, i) => (
//           <motion.div key={i}
//             initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
//             className="flex flex-col rounded-xl p-3"
//             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
//             <div className="flex items-center gap-1.5 mb-1.5">
//               <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: n.accent }} />
//               <span className="text-[10.5px] font-bold truncate flex-1" style={{ color: n.accent }}>{n.task}</span>
//               <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{n.time}</span>
//             </div>
//             <p className="text-[10px] leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>{n.msg}</p>
//             <div className="flex gap-1.5 mt-3">
//               <motion.button whileTap={{ scale: 0.96 }}
//                 className="flex-1 py-1.5 rounded-lg text-[10px] font-black text-white border-0 cursor-pointer"
//                 style={{ background: n.accent, fontFamily: "inherit" }}>Nudge</motion.button>
//               <button className="px-2 rounded-lg text-[10px] border-0 cursor-pointer"
//                 style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", fontFamily: "inherit" }}>✕</button>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </div>
//   </Card>
// </Reveal>
