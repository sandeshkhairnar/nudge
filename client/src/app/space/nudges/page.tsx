"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Sparkles, Bell, Clock, CheckCircle2, X, AlertCircle, Loader2, RefreshCw, Zap, Settings2, Plus, Info } from "lucide-react";

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
  const [showSettings, setShowSettings] = useState(false);

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
        setNextRunText(`in ${diffHrs}hr ${diffMins}m`);
      } else {
        setNextRunText(`in ${diffMins === 0 ? 'less than a minute' : `${diffMins}m`}`);
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
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="w-full flex flex-col font-sans bg-transparent pb-12">
      {/* Header */}
      <div className="pb-6 mb-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Nudges
            <motion.div animate={{ rotate: [0, 15, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <Sparkles className="text-indigo-500" size={20} />
            </motion.div>
          </h1>
          <p className="text-[13px] text-gray-500 font-medium mt-1">AI-generated action items and automated project updates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunNow}
            disabled={!engineActive}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0"
          >
            <Zap size={14} className="fill-current" />
            Run Now
          </button>
          <button
            onClick={loadNudges}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-semibold text-[12px] shadow-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer border shadow-sm ${
              showSettings 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Settings2 size={14} />
            Settings
          </button>
        </div>
      </div>

      {/* Settings Block */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border transition-colors ${engineActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
            <Zap size={20} className={engineActive ? 'fill-current' : ''} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-0.5">Nudge Engine</h3>
            <p className="text-[13px] text-gray-500 font-medium">
              {engineActive ? "Active. Monitoring the workspace." : "Paused. No automations are running."}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Schedule</label>
            <div className="flex flex-wrap gap-2 items-center">
              {checkTimes.map((t) => (
                <div key={t} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 shadow-sm">
                  <Clock size={12} className="text-gray-400" />
                  {t}
                  <button onClick={() => removeTime(t)} className="ml-0.5 text-gray-400 hover:text-red-500 bg-transparent border-0 cursor-pointer p-0.5 transition-colors">
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  disabled={!engineActive}
                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[12px] font-semibold outline-none shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors w-[90px] disabled:opacity-50 text-gray-700"
                />
                <button
                  onClick={addTime}
                  disabled={!engineActive}
                  className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-900 shadow-sm disabled:opacity-50 border border-gray-200 cursor-pointer transition-colors"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {nextRunText && (
            <div className="flex flex-col gap-2 transition-all min-w-[120px]">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Next Run</label>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm whitespace-nowrap">
                <Clock size={12} strokeWidth={2.5} />
                {nextRunText}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 items-end ml-auto">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Status</label>
            <motion.div
              className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-0.5 cursor-pointer transition-colors shadow-inner ${engineActive ? 'bg-emerald-500' : ''}`}
              onClick={handleToggleEngine}
            >
              <motion.div
                className="bg-white w-5 h-5 rounded-full shadow-sm"
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                style={{ marginLeft: engineActive ? "auto" : "0px" }}
              />
            </motion.div>
          </div>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Nudges List */}
      <div className="flex-1 space-y-4">
        {nudges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-gray-200 bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
              <Sparkles size={28} className="text-indigo-500" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">You're all caught up!</h3>
            <p className="text-gray-500 text-[13.5px] font-medium max-w-sm leading-relaxed">The Nudge Engine is monitoring your projects. Any new insights or alerts will appear right here.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {nudges.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col sm:flex-row gap-5 items-start"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full" style={{ background: n.projects?.color ?? "#4F46E5" }} />
                        {n.projects?.name}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[14px] font-medium text-gray-900 leading-relaxed mb-4 pr-6">{n.content}</p>

                    {n.tasks && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg mb-5 shadow-sm">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-[12.5px] font-semibold text-gray-700 truncate max-w-[280px]">{n.tasks.title}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[12px] font-semibold border-0 cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                        View Details
                      </button>
                      <button
                        onClick={() => dismissNudge(n.id)}
                        className="px-4 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 shadow-sm rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0 group-hover:bg-indigo-100 transition-colors hidden sm:flex">
                    <Sparkles size={18} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="mt-8 bg-gray-50 border border-gray-200 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row gap-4 items-center sm:items-start relative overflow-hidden">
        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm flex-shrink-0">
          <Info size={24} />
        </div>
        <div className="text-center sm:text-left z-10 pt-0.5">
          <h4 className="text-[15px] font-bold text-gray-900 mb-1 tracking-tight">AI Insights Context</h4>
          <p className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-3xl">
            Nudges are automatically generated by the engine based on project activity, stalled tasks, and commit patterns from connected repositories. Keep your workspace healthy by acting upon them regularly.
          </p>
        </div>
      </div>
    </div>
  );
}
