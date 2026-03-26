"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface Nudge {
  id: string;
  severity: string;
  created_at: string;
  content: string;
  tasks?: { title: string };
}

interface NudgeFeedCardProps {
  nudges: Nudge[];
  engineActive: boolean;
}

export default function NudgeFeedCard({ nudges, engineActive }: NudgeFeedCardProps) {
  return (
    <div className="h-full rounded-2xl overflow-hidden relative" style={{ background: "#0D0D0D", boxShadow: "0 4px 20px rgba(0,0,0,0.14)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
      <div className="relative px-5 pt-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${engineActive ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
            <Zap size={12} className={engineActive ? 'fill-emerald-500' : ''} />
          </div>
          <h3 className="text-[14px] font-black text-white">Nudge feed</h3>
        </div>
      </div>
      <div className="relative pb-4">
        {nudges.length === 0 ? (
          <div className="px-5 py-8 text-center text-white/50 text-[11px]">No active nudges right now.</div>
        ) : nudges.map((n, i) => {
          const accent = n.severity === "high" ? "#E01E5A" : n.severity === "low" ? "#36C5F0" : "#ECB22E";
          const mins = Math.floor((new Date().getTime() - new Date(n.created_at).getTime()) / 60000);
          const timeStr = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;

          return (
            <motion.div key={n.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className="px-5 py-3.5"
              style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div className="flex justify-between items-start mb-1.5 gap-2">
                <span className="text-[12px] font-bold truncate" style={{ color: accent }}>{n.tasks?.title || "Workspace Update"}</span>
                <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{timeStr}</span>
              </div>
              <p className="text-[11.5px] leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>{n.content}</p>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-black text-white border-0 cursor-pointer"
                  style={{ background: accent, fontFamily: "'Sora',sans-serif" }}>
                  Send nudge
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border-0 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontFamily: "'Sora',sans-serif" }}>
                  Dismiss
                </motion.button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}
