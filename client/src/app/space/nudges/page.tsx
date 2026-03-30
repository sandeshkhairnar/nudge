"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Sparkles, Bell, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Zap, Settings2, Plus } from "lucide-react";

interface Nudge {
  id: string;
  project_id: string;
  task_id: string | null;
  content: string;
  dismissed: boolean;
  created_at: string;
  projects?: { name: string; color: string };
  tasks?: { title: string };
}

export default function NudgesPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state initialized from workspace
  const [engineActive, setEngineActive] = useState((workspace as any)?.nudge_engine_active ?? true);
  const [checkTimes, setCheckTimes] = useState<string[]>((workspace as any)?.nudge_check_times ?? ["09:00"]);
  const [newTime, setNewTime] = useState("09:00");
  const [nextRunText, setNextRunText] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!workspace?.id) return;

      let { data, error } = await supabase
        .from("workspaces")
        .select("nudge_engine_active, nudge_check_time, nudge_check_times")
        .eq("id", workspace.id)
        .single();

      if (error && error.code === '42703') {
        const fallback = await supabase
          .from("workspaces")
          .select("nudge_engine_active, nudge_check_time")
          .eq("id", workspace.id)
          .single();
        data = fallback.data as any;
        error = fallback.error;
      }

      if (data && !error) {
        if (data.nudge_engine_active !== null) setEngineActive(data.nudge_engine_active);

        let times: string[] = [];
        if (Array.isArray(data.nudge_check_times)) {
          times = data.nudge_check_times;
        } else if (data.nudge_check_time) {
          times = [data.nudge_check_time];
        }
        setCheckTimes(times.length ? times : ["09:00"]);
      }
    };
    loadSettings();
  }, [workspace?.id]);

  useEffect(() => {
    if (checkTimes.length === 0) {
      setNextRunText(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const sorted = [...checkTimes].sort();
      const nextTimeStr = sorted.find(t => t > currentStr) ?? sorted[0];

      const [h, m] = nextTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);

      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHrs > 0) {
        setNextRunText(`IN ${diffHrs}HR ${diffMins}M`);
      } else {
        setNextRunText(`IN ${diffMins === 0 ? 'LESS THAN A MINUTE' : `${diffMins}M`}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, [checkTimes]);

  const saveTimes = async (times: string[]) => {
    if (!workspace?.id) return;
    await supabase
      .from("workspaces")
      .update({ nudge_check_times: times })
      .eq("id", workspace.id);
  };

  const addTime = () => {
    if (checkTimes.includes(newTime)) return;
    const updated = [...checkTimes, newTime].sort();
    setCheckTimes(updated);
    saveTimes(updated);
  };

  const removeTime = (t: string) => {
    const updated = checkTimes.filter(time => time !== t);
    setCheckTimes(updated);
    saveTimes(updated);
  };

  const handleToggleEngine = async () => {
    if (!workspace?.id) return;
    const newState = !engineActive;
    setEngineActive(newState);

    const { data, error } = await supabase
      .from("workspaces")
      .update({ nudge_engine_active: newState })
      .eq("id", workspace.id)
      .select("nudge_engine_active")
      .single();

    if (error || !data) {
      setEngineActive(!newState);
      console.error("Toggle failed:", error);
    }
  };

  const handleRunNow = async () => {
    if (!workspace?.id) return;
    setTimeout(() => {
      loadNudges();
    }, 2000);
  };

  useEffect(() => {
    if (workspace?.id) {
      loadNudges();
    }
  }, [workspace?.id]);

  const loadNudges = async () => {
    if (!workspace?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from("nudges")
      .select("*, projects(name, color), tasks(title)")
      .eq("workspace_id", workspace.id)
      .eq("dismissed", false)
      .order("created_at", { ascending: false });

    if (data) setNudges(data as any);
    else setNudges([]);

    setLoading(false);
  };

  const dismissNudge = async (id: string) => {
    const { error } = await supabase
      .from("nudges")
      .update({ dismissed: true })
      .eq("id", id);

    if (!error) {
      setNudges(prev => prev.filter(n => n.id !== id));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-[#36C5F0]" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-[#F4F4F0]">
        <div>
          <h1 className="text-[32px] font-[800] text-[#111111] mb-1.5 tracking-[-0.02em] flex items-center gap-3">
            Nudges
            <motion.div animate={{ rotate: [0, 15, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <Sparkles className="text-[#36C5F0]" fill="#36C5F0" size={24} />
            </motion.div>
          </h1>
          <p className="text-[14px] text-[#A0A09B] font-[600] tracking-tight">AI-generated action items and automated project updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunNow}
            disabled={!engineActive}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-[12px] text-[12px] font-[800] hover:bg-[#059669] transition-all border-0 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95 tracking-wider uppercase"
          >
            <Zap size={14} fill="currentColor" />
            RUN NOW
          </button>
          <button
            onClick={loadNudges}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#111111] border border-[#F4F4F0] rounded-[12px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer font-[800] text-[12px] active:scale-95 tracking-wider uppercase"
          >
            <RefreshCw size={14} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Settings Block */}
      <div className="bg-white border border-[#F4F4F0] rounded-[24px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm border ${engineActive ? 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]' : 'bg-[#F9F9F8] text-[#A0A09B] border-[#F4F4F0]'}`}>
            <Zap size={24} strokeWidth={2.5} className={engineActive ? 'fill-current' : ''} />
          </div>
          <div>
            <h3 className="text-[18px] font-[800] text-[#111111] mb-1">Nudge Engine</h3>
            <p className="text-[13.5px] text-[#A0A09B] font-[500]">
              {engineActive ? "Active. Monitoring the workspace." : "Paused. No automations are running."}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-[900] tracking-[0.15em] uppercase text-[#A0A09B]">SCHEDULE</label>
            <div className="flex flex-wrap gap-2 items-center">
              {checkTimes.map((t) => (
                <div key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F8] border border-[#F4F4F0] rounded-[8px] text-[12px] font-[800] text-[#111111] shadow-sm">
                  <Clock size={12} className="text-[#36C5F0]" strokeWidth={3} />
                  {t}
                  <button onClick={() => removeTime(t)} className="ml-1 text-[#A0A09B] hover:text-[#FF6B6B] border-0 bg-transparent cursor-pointer p-0 transition-colors">
                    <XCircle size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  disabled={!engineActive}
                  className="px-3 py-1.5 bg-white border border-[#F4F4F0] rounded-[8px] text-[12px] font-[800] outline-none shadow-sm focus:border-[#E0E0E0] transition-colors w-[100px] disabled:opacity-50 text-[#111111]"
                />
                <button
                  onClick={addTime}
                  disabled={!engineActive}
                  className="p-1.5 bg-[#111111] text-white rounded-[8px] hover:bg-[#222222] shadow-sm disabled:opacity-50 border-0 cursor-pointer transition-colors"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {nextRunText && (
            <div className="flex flex-col gap-3 transition-all min-w-[140px]">
              <label className="text-[10px] font-[900] tracking-[0.15em] uppercase text-[#A0A09B]">NEXT RUN</label>
              <div className="flex items-center gap-2 text-[12px] font-[800] text-[#36C5F0] bg-[#F0F9FF] px-3 py-1.5 rounded-[8px] border border-blue-100/50 shadow-sm whitespace-nowrap">
                <Clock size={14} strokeWidth={3} />
                {nextRunText}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 items-end ml-auto">
            <label className="text-[10px] font-[900] tracking-[0.15em] uppercase text-[#A0A09B]">STATUS</label>
            <motion.div
              className={`w-12 h-[26px] flex items-center bg-[#E0E0E0] rounded-full p-1 cursor-pointer transition-colors shadow-inner ${engineActive ? 'bg-[#10B981]' : ''}`}
              onClick={handleToggleEngine}
            >
              <motion.div
                className="bg-white w-[18px] h-[18px] rounded-full shadow-sm border border-black/5"
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                style={{ marginLeft: engineActive ? "auto" : "0px" }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Nudges List */}
      <div className="space-y-4">
        {nudges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-[#F4F4F0] bg-white rounded-[32px] p-20 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div className="w-20 h-20 bg-[#F9F9F8] border border-[#F4F4F0] rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Sparkles size={36} strokeWidth={2} className="text-[#36C5F0] opacity-50" />
            </div>
            <h3 className="text-[20px] font-[800] text-[#111111] mb-2">You're all caught up!</h3>
            <p className="text-[#A0A09B] text-[14px] font-[500] max-w-sm leading-relaxed">The Nudge Engine is monitoring your projects. Any new insights or alerts will appear right here.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {nudges.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-white border border-[#F4F4F0] rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row gap-6 items-start overflow-hidden"
                >
                  <div
                    className="w-2 h-full absolute left-0 top-0"
                    style={{ background: n.projects?.color ?? "#36C5F0" }}
                  />

                  <div className="flex-1 min-w-0 w-full pl-2">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span
                        className="px-2.5 py-1 rounded-[6px] text-[9px] font-[900] uppercase tracking-widest text-white shadow-sm"
                        style={{ background: n.projects?.color ?? "#36C5F0" }}
                      >
                        {n.projects?.name}
                      </span>
                      <span className="text-[10px] font-[800] tracking-wider text-[#A0A09B] flex items-center gap-1.5 uppercase">
                        <Clock size={12} strokeWidth={3} />
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[15.5px] font-[500] text-[#111111] leading-relaxed mb-5 pr-8">{n.content}</p>

                    {n.tasks && (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#F9F9F8] border border-[#F4F4F0] rounded-[12px] mb-6 shadow-sm">
                        <CheckCircle2 size={16} strokeWidth={2.5} className="text-[#36C5F0]" />
                        <span className="text-[13px] font-[700] text-[#111111] truncate max-w-[280px]">{n.tasks.title}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        className="px-6 py-2.5 bg-[#111111] text-white rounded-[12px] text-[12px] font-[800] border-0 cursor-pointer hover:bg-[#222222] transition-all shadow-md active:scale-95 uppercase tracking-wider"
                      >
                        VIEW DETAILS
                      </button>
                      <button
                        onClick={() => dismissNudge(n.id)}
                        className="px-6 py-2.5 bg-[#F9F9F8] text-[#A0A09B] hover:text-[#111111] border border-[#F4F4F0] rounded-[12px] text-[12px] font-[800] cursor-pointer hover:bg-white transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                      >
                        DISMISS
                      </button>
                    </div>
                  </div>

                  <div className="w-14 h-14 bg-[#F9F9F8] border border-[#F4F4F0] shadow-sm rounded-full flex items-center justify-center text-[#36C5F0] flex-shrink-0 group-hover:scale-110 group-hover:bg-[#EBF8FF] group-hover:border-[#B3E5FC] transition-all absolute right-6 top-6 sm:static sm:right-auto sm:top-auto">
                    <Sparkles size={24} strokeWidth={2.5} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="bg-[#F9F9F8] border border-[#F4F4F0] shadow-sm rounded-[24px] p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#36C5F0]/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="w-16 h-16 bg-white border border-[#F4F4F0] rounded-full flex items-center justify-center text-[#36C5F0] shadow-sm flex-shrink-0">
          <AlertCircle size={32} strokeWidth={2} />
        </div>
        <div className="text-center sm:text-left z-10">
          <h4 className="text-[18px] font-[800] text-[#111111] mb-2 tracking-tight">AI Insights Context</h4>
          <p className="text-[13.5px] font-[500] text-[#A0A09B] leading-relaxed max-w-2xl">
            Nudges are automatically generated by the engine based on project activity, stalled tasks, and commit patterns from connected repositories. Keep your workspace healthy by acting upon them regularly.
          </p>
        </div>
      </div>
    </div>
  );
}
