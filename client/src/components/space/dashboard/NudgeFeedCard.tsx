"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Card } from "./DashboardBase";

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
    <Card className="h-full flex flex-col relative overflow-hidden group/feed">
      {/* Subtle Background Pattern */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#36C5F0]/[0.05] rounded-full blur-[60px] pointer-events-none group-hover/feed:bg-[#36C5F0]/[0.08] transition-all duration-700" />
      
      <div className="relative flex flex-col h-full pt-5 z-10">
        <div className="px-6 flex items-center justify-between mb-5 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {!engineActive && <div className="absolute inset-0 bg-indigo-500 blur-[10px] opacity-20 animate-pulse" />}
              <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 shadow-sm border ${engineActive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                <Zap size={18} className={engineActive ? 'fill-emerald-600' : ''} />
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900 tracking-tight leading-none mb-1.5">Nudge Feed</h3>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Real-time alerts</p>
            </div>
          </div>
          
          {engineActive && (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
               <span className="relative flex h-1.5 w-1.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
               </span>
               <span className="text-[10px] font-semibold text-emerald-700 tracking-wider">SYNCED</span>
             </div>
          )}
        </div>

        <div className="relative flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide space-y-3 pt-1">
          {nudges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50 text-center">
              <Zap size={32} className="mb-4 stroke-[1.5px] text-gray-400" />
              <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-400">Everything is quiet</p>
            </div>
          ) : nudges.map((n, i) => {
            const colors = n.severity === "high" 
              ? { bg: "bg-white", border: "border-rose-100", softBg: "bg-rose-50", text: "text-rose-600", bgGlow: "bg-rose-600", glow: "shadow-sm hover:shadow-md" }
              : n.severity === "low" 
                ? { bg: "bg-white", border: "border-sky-100", softBg: "bg-sky-50", text: "text-sky-600", bgGlow: "bg-sky-600", glow: "shadow-sm hover:shadow-md" }
                : { bg: "bg-white", border: "border-amber-100", softBg: "bg-amber-50", text: "text-amber-600", bgGlow: "bg-amber-600", glow: "shadow-sm hover:shadow-md" };
            
            const mins = Math.floor((new Date().getTime() - new Date(n.created_at).getTime()) / 60000);
            const timeStr = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;

            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={`group/nudge relative p-4 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:bg-white hover:border-gray-200 ${colors.glow}`}>
                
                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md opacity-80 ${colors.bgGlow}`} />

                <div className="flex justify-between items-start mb-2 gap-3 pl-2">
                  <div className="flex-1 min-w-0">
                    <span className={`text-[12px] font-bold truncate block tracking-tight leading-tight ${colors.text}`}>
                      {n.tasks?.title || "WORKSPACE SYNC"}
                    </span>
                    <span className="text-[10px] uppercase font-medium tracking-wider text-gray-500 mt-1 block">{n.severity} priority</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 tabular-nums">{timeStr}</span>
                </div>

                <p className="text-[12px] leading-relaxed text-gray-700 mb-4 font-medium pl-2">{n.content}</p>

                <div className="flex gap-2 pl-2">
                  <motion.button whileTap={{ scale: 0.95 }}
                    className={`relative flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-white border-0 cursor-pointer overflow-hidden group/btn shadow-sm ${colors.bgGlow}`}>
                    <span className="relative z-10 uppercase tracking-wider">Take Action</span>
                  </motion.button>
                  <motion.button whileHover={{ backgroundColor: "#F9FAFB" }}
                    className="px-4 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 cursor-pointer transition-colors shadow-sm">
                    Skip
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Card>
  );
}
