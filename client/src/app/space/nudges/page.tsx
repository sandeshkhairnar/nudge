"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Sparkles, Bell, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface Nudge {
  id: string;
  project_id: string;
  task_id: string | null;
  content: string;
  dismissed: boolean;
  created_at: string;
  projects?: { name: string, color: string };
  tasks?: { title: string };
}

export default function NudgesPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            My Nudges
            <motion.div 
              animate={{ rotate: [0, 15, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="text-[#36C5F0]" size={24} />
            </motion.div>
          </h1>
          <p className="text-gray-500 text-[14px]">AI-generated action items and project updates.</p>
        </div>
        <button 
          onClick={loadNudges}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-900 transition-all border-0 bg-transparent cursor-pointer font-bold text-[13px]"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {nudges.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-16 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-[#F9F9F7] rounded-2xl flex items-center justify-center mb-4 text-[#36C5F0]">
              <Bell size={32} />
            </div>
            <h3 className="text-[18px] font-black text-gray-900 mb-1">Stay tuned!</h3>
            <p className="text-gray-400 text-[14px] max-w-xs">You're all caught up. No active nudges requiring your attention right now.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {nudges.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex gap-5 items-start"
              >
                <div 
                  className="w-1.5 h-full absolute left-0 top-0 rounded-l-full" 
                  style={{ background: n.projects?.color ?? "#36C5F0" }} 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ background: n.projects?.color ?? "#36C5F0" }}
                    >
                      {n.projects?.name}
                    </span>
                    <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-[15px] font-bold text-gray-900 leading-snug mb-3">{n.content}</p>
                  
                  {n.tasks && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl mb-4">
                      <CheckCircle2 size={13} className="text-[#36C5F0]" />
                      <span className="text-[12px] font-semibold text-gray-600 truncate max-w-[200px]">{n.tasks.title}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      className="px-5 py-2 bg-[#0D0D0D] text-white rounded-xl text-[12px] font-bold border-0 cursor-pointer hover:bg-gray-800 transition-all shadow-lg shadow-black/5"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => dismissNudge(n.id)}
                      className="px-5 py-2 bg-gray-100 text-gray-500 rounded-xl text-[12px] font-bold border-0 cursor-pointer hover:bg-gray-200 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <div className="w-12 h-12 bg-blue-50/50 rounded-2xl flex items-center justify-center text-[#36C5F0] flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="bg-[#DFF5FF] border border-[#B3E5FC] rounded-3xl p-8 flex gap-6 items-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#36C5F0] shadow-sm flex-shrink-0">
          <AlertCircle size={32} />
        </div>
        <div>
          <h4 className="text-[16px] font-black text-[#01579B] mb-1">AI Insights</h4>
          <p className="text-[13.5px] text-[#0277BD] leading-relaxed">Nudges are automatically generated based on project activity, stalled tasks, and commit patterns. Keep your projects healthy by addressing them regularly.</p>
        </div>
      </div>
    </div>
  );
}
