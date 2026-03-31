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
        <div className="px-6 flex items-center justify-between mb-5 border-b border-[#F4F4F0] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {!engineActive && <div className="absolute inset-0 bg-[#2EB67D] blur-[10px] opacity-20 animate-pulse" />}
              <div className={`relative w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-500 shadow-sm border ${engineActive ? 'bg-emerald-50 border-emerald-100 text-[#2EB67D]' : 'bg-[#F9F9F8] border-[#F4F4F0] text-[#A0A09B]'}`}>
                <Zap size={18} className={engineActive ? 'fill-[#2EB67D]' : ''} />
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-[800] text-[#111111] tracking-[0.02em] leading-none mb-1.5">Nudge Feed</h3>
              <p className="text-[9px] font-[800] text-[#A0A09B] tracking-[0.16em] uppercase leading-none">Real-time alerts</p>
            </div>
          </div>
          
          {engineActive && (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#D1FAE5] shadow-sm">
               <span className="relative flex h-1.5 w-1.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2EB67D] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2EB67D]"></span>
               </span>
               <span className="text-[9px] font-[800] text-[#059669] tracking-wider">SYNCED</span>
             </div>
          )}
        </div>

        <div className="relative flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide space-y-3 pt-1">
          {nudges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50 text-center">
              <Zap size={32} className="mb-4 stroke-[1.5px] text-[#A0A09B]" />
              <p className="text-[11px] font-[800] tracking-[0.15em] uppercase text-[#A0A09B]">Everything is quiet</p>
            </div>
          ) : nudges.map((n, i) => {
            const colors = n.severity === "high" 
              ? { bg: "bg-white", border: "border-[#FEE2E2]", softBg: "bg-[#FEF2F2]", text: "#E01E5A", glow: "shadow-sm hover:shadow-[0_4px_20px_rgba(224,30,90,0.06)]" }
              : n.severity === "low" 
                ? { bg: "bg-white", border: "border-[#E0F2FE]", softBg: "bg-[#F0F9FF]", text: "#36C5F0", glow: "shadow-sm hover:shadow-[0_4px_20px_rgba(54,197,240,0.06)]" }
                : { bg: "bg-white", border: "border-[#FEF3C7]", softBg: "bg-[#FFFBEB]", text: "#ECB22E", glow: "shadow-sm hover:shadow-[0_4px_20px_rgba(236,178,46,0.06)]" };
            
            const mins = Math.floor((new Date().getTime() - new Date(n.created_at).getTime()) / 60000);
            const timeStr = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;

            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={`group/nudge relative p-4 rounded-2xl ${colors.bg} border ${colors.border} transition-all hover:bg-white hover:border-[#E0E0E0] ${colors.glow}`}>
                
                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md opacity-80`} style={{ background: colors.text }} />

                <div className="flex justify-between items-start mb-2 gap-3 pl-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-[800] truncate block tracking-tight leading-tight" style={{ color: colors.text }}>
                      {n.tasks?.title || "WORKSPACE SYNC"}
                    </span>
                    <span className="text-[10px] uppercase font-[700] tracking-[0.1em] text-[#A0A09B] mt-1 block">{n.severity} priority</span>
                  </div>
                  <span className="text-[10px] font-[800] text-[#A0A09B] tabular-nums">{timeStr}</span>
                </div>

                <p className="text-[12px] leading-relaxed text-[#555555] mb-4 font-[600] pl-2">{n.content}</p>

                <div className="flex gap-2 pl-2">
                  <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    className="relative flex-1 py-2 rounded-xl text-[11px] font-[800] text-white border-0 cursor-pointer overflow-hidden group/btn shadow-sm">
                    <div className="absolute inset-0 opacity-100 transition-transform group-hover/btn:scale-105 duration-300" style={{ background: colors.text }} />
                    <span className="relative z-10 uppercase tracking-[0.1em]">Take Action</span>
                  </motion.button>
                  <motion.button whileHover={{ backgroundColor: "#F4F4F0" }}
                    className="px-4 py-2 rounded-xl text-[11px] font-[700] text-[#A0A09B] bg-[#F9F9F8] border border-[#F4F4F0] cursor-pointer transition-colors shadow-sm">
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
