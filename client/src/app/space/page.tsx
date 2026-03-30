"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Reveal } from "@/components/space/dashboard/DashboardBase";
import StatsRow from "@/components/space/dashboard/StatsRow";
import VelocityCard from "@/components/space/dashboard/VelocityCard";
import NudgeAiCard from "@/components/space/dashboard/NudgeAiCard";
import TasksTableCard from "@/components/space/dashboard/TasksTableCard";
import NudgeFeedCard from "@/components/space/dashboard/NudgeFeedCard";
import DonutCard from "@/components/space/dashboard/DonutCard";
import ProjectHealthCard from "@/components/space/dashboard/ProjectHealthCard";
import TeamCard from "@/components/space/dashboard/TeamCard";

interface Stats { total: number; done: number; inProgress: number; stalled: number; projects: number; members: number; }

export default function DashboardPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);

  const [stats, setStats] = useState<Stats>({ total: 0, done: 0, inProgress: 0, stalled: 0, projects: 0, members: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [nudges, setNudges] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<{ week: string; done: number; inProgress: number; todo: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [engineActive, setEngineActive] = useState(false);
  const [tab, setTab] = useState<"all" | "mine" | "stalled">("all");
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hello! I'm your Nudge AI assistant. Ask me about tasks, projects, or team status — I can help!" }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleAiSend = async (customPrompt?: string) => {
    const userMsg = customPrompt ?? aiInput;
    if (!userMsg.trim() || isAiTyping || !workspace?.id) return;

    if (!customPrompt) setAiInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setMessages(prev => [...prev, { role: "ai", content: "" }]);
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, content: userMsg }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "ai", content: aiResponse };
          return updated;
        });
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", content: "Sorry, I encountered an error. Please try again." };
        return updated;
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    if (!workspace?.id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id,full_name,avatar_url,email").eq("id", user.id).single();
      if (prof) setMe(prof);

      const { data: pm } = await supabase
        .from("project_members")
        .select("project_id, projects!project_members_project_id_fkey(id,name,color,progress,workspace_id)")
        .eq("user_id", user.id);

      const myProjects = ((pm ?? []) as any[]).map(r => r.projects).filter(p => p?.workspace_id === workspace.id);
      const pids: string[] = myProjects.map((p: any) => p.id);
      if (!pids.length) { setLoading(false); return; }

      const { data: raw } = await supabase
        .from("tasks")
        .select("id,title,status,stalled_days,due_date,project_id,created_at,assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url,email),project:projects!tasks_project_id_fkey(name,color)")
        .in("project_id", pids)
        .order("created_at", { ascending: false });

      const shaped = ((raw ?? []) as any[]).map(t => ({
        id: t.id, title: t.title, status: t.status,
        stalled_days: t.stalled_days ?? 0, due_date: t.due_date, project_id: t.project_id,
        created_at: t.created_at,
        project_name: t.project?.name ?? null, project_color: t.project?.color ?? null,
        assignee_name: t.assignee?.full_name ?? null, assignee_id: t.assignee?.id ?? null,
        assignee_avatar_url: t.assignee?.avatar_url ?? null,
        assignee_email: t.assignee?.email ?? null,
      }));

      const tByP: Record<string, number> = {};
      shaped.forEach(t => { tByP[t.project_id] = (tByP[t.project_id] ?? 0) + 1; });

      const hydrated = myProjects.map((p: any) => ({
        id: p.id, name: p.name, color: p.color ?? "#36C5F0", progress: p.progress ?? 0, task_count: tByP[p.id] ?? 0,
      }));

      const { data: mem } = await supabase
        .from("project_members")
        .select("user_id, profiles!project_members_user_id_fkey(id,full_name,avatar_url,email)")
        .in("project_id", pids);

      const mmap: Record<string, any> = {};
      ((mem ?? []) as any[]).forEach(m => {
        const p = m.profiles; if (!p || mmap[p.id]) return;
        mmap[p.id] = { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, email: p.email, task_count: 0, done_count: 0 };
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

      const { data: rawNudges } = await supabase
        .from("nudges")
        .select("*, tasks(title)")
        .eq("workspace_id", workspace.id)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: wsData } = await supabase
        .from("workspaces")
        .select("nudge_engine_active")
        .eq("id", workspace.id)
        .single();

      if (wsData) setEngineActive(wsData.nudge_engine_active);

      setProjects(hydrated); setTasks(shaped); setNudges(rawNudges ?? []);
      setTeam(Object.values(mmap).sort((a, b) => b.task_count - a.task_count).slice(0, 6));
      setWeekly(wk);
      setStats({ total: shaped.length, done: shaped.filter(t => t.status === "done").length, inProgress: shaped.filter(t => t.status === "in_progress").length, stalled: shaped.filter(t => t.stalled_days >= 3).length, projects: hydrated.length, members: Object.keys(mmap).length });
      setLoading(false);
    })();
  }, [workspace?.id]);

  const filtered = tasks.filter(t => tab === "mine" ? t.assignee_id === me?.id : tab === "stalled" ? t.stalled_days >= 3 : true);
  const donutS = [tasks.filter(t => t.status === "done").length, tasks.filter(t => t.status === "in_progress").length, tasks.filter(t => t.status === "review").length, tasks.filter(t => t.status === "todo").length];
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div className="flex flex-col gap-5 pb-8 relative min-h-full">
      {/* <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#36C5F0]/[0.08] to-transparent pointer-events-none -z-10" /> */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-[#2EB67D]/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-[500px] h-[500px] bg-[#A259FF]/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Greeting Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2 border-b border-black/[0.02] pb-6 mb-2">
        <div className="space-y-3">
          <div className="h-3 w-40 bg-black/[0.04] rounded-full animate-pulse" />
          <div className="h-8 w-72 bg-black/[0.04] rounded-full animate-pulse" />
        </div>
        <div className="h-16 w-48 bg-black/[0.04] rounded-2xl animate-pulse" />
      </div>

      {/* StatsRow Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-black/[0.03] rounded-2xl animate-pulse" />
        ))}
      </div>

      {/* Velocity & AI Skeleton */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-12 lg:col-span-8 h-[400px] bg-black/[0.03] rounded-[22px] animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-[500px] lg:h-auto bg-black/[0.03] rounded-[22px] animate-pulse" />
      </div>

      {/* Tasks & Feed Skeleton */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-12 lg:col-span-8 h-[400px] bg-black/[0.03] rounded-[22px] animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-[400px] bg-black/[0.03] rounded-[22px] animate-pulse" />
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[350px] bg-black/[0.03] rounded-[22px] animate-pulse" />
        <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[350px] bg-black/[0.03] rounded-[22px] animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-[350px] bg-black/[0.03] rounded-[22px] animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-8 relative min-h-full">
      {/* Ambient Dashboard Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-[#2EB67D]/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-[500px] h-[500px] bg-[#A259FF]/[0.05] blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* ── ROW 1: Greeting ── */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2 border-b border-[#F4F4F0] pb-6 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2EB67D] shadow-[0_0_8px_rgba(46,182,125,0.4)] relative">
                <span className="absolute inset-0 rounded-full bg-[#2EB67D] animate-ping opacity-50" />
              </span>
              <p className="text-[10px] text-[#A0A09B] font-[800] uppercase tracking-[0.15em]">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
            <h1 className="text-[28px] font-[800] text-[#111111] tracking-[-0.03em] leading-none">
              {greeting}, {me?.full_name?.split(" ")[0] ?? "there"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white border border-[#F4F4F0] rounded-2xl px-4 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="#F4F4F0" strokeWidth="4" />
                  <motion.circle cx="16" cy="16" r="14" fill="none" stroke="#2EB67D" strokeWidth="4"
                    strokeLinecap="round" strokeDasharray={88}
                    initial={{ strokeDashoffset: 88 }}
                    animate={{ strokeDashoffset: 88 - (pct / 100) * 88 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              </div>
              <div>
                <p className="text-[9px] text-[#A0A09B] font-[800] uppercase tracking-wider mb-0.5">Workspace Health</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[16px] font-[800] text-[#111111] leading-none">{pct}%</span>
                  <span className="text-[10px] font-[600] text-[#A0A09B]">done</span>
                </div>
              </div>
            </div>
            {stats.stalled > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 bg-white border border-[#F4F4F0] rounded-2xl px-4 py-2.5 shadow-[0_2px_12px_rgba(236,178,46,0.08)]">
                <div className="w-8 h-8 rounded-full bg-[#ECB22E]/10 flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-[#ECB22E] shadow-[0_0_10px_rgba(236,178,46,0.4)]" />
                </div>
                <div>
                  <p className="text-[9px] font-[800] uppercase tracking-wider text-[#ECB22E] mb-0.5">Attention Needed</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[16px] font-[800] text-[#111111] leading-none">{stats.stalled}</span>
                    <span className="text-[10px] font-[600] text-[#A0A09B]">stalled</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ── ROW 2: Stat cards ── */}
      <Reveal delay={0.02}>
        <StatsRow stats={stats} pct={pct} />
      </Reveal>

      {/* ── ROW 3: Velocity (8) | NudgeAI (4) ── */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <Reveal delay={0.04} className="col-span-12 lg:col-span-8 flex">
          <VelocityCard tasks={tasks} weekly={weekly} />
        </Reveal>
        <Reveal delay={0.08} className="col-span-12 lg:col-span-4">
          <NudgeAiCard
            messages={messages}
            input={aiInput}
            loading={isAiTyping}
            onInputChange={setAiInput}
            onSend={() => handleAiSend()}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAiSend()}
            onSuggestionClick={(p) => handleAiSend(p)}
            me={me}
            chatContainerRef={chatContainerRef}
            onClear={() => setMessages([{ role: "ai", content: "Hello! I'm your Nudge AI assistant. Ask me about tasks, projects, or team status — I can help!" }])}
          />
        </Reveal>
      </div>

      {/* ── ROW 4: Tasks table (8) | Nudge feed (4) ── */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <Reveal delay={0.04} className="col-span-12 lg:col-span-8">
          <TasksTableCard tasks={filtered} tab={tab} onTabChange={setTab} />
        </Reveal>
        <Reveal delay={0.04} className="col-span-12 lg:col-span-4">
          <NudgeFeedCard nudges={nudges} engineActive={engineActive} />
        </Reveal>
      </div>

      {/* ── ROW 5: Donut (4) | Health (4) | Team (4) ── */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <Reveal delay={0.08} className="col-span-12 md:col-span-6 lg:col-span-4">
          <DonutCard stats={stats} donutS={donutS} />
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
