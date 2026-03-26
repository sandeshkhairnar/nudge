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
