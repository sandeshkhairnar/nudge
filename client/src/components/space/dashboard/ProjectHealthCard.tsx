"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Card, CardHeader, EmptySlot } from "./DashboardBase";

function MiniRing({ value, color, size = 42 }: { value: number; color: string; size?: number }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  const ref = useRef(null); const inView = useInView(ref, { once: true });
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F4F4F0" strokeWidth="3" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c - (value / 100) * c } : {}}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-[800] tracking-tight text-[#111111]">{value}%</span>
      </div>
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  task_count: number;
}

interface ProjectHealthCardProps {
  projects: Project[];
}

export default function ProjectHealthCard({ projects }: ProjectHealthCardProps) {
  return (
    <Card>
      <CardHeader
        title="Project Health"
        sub="Progress tracking"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        right={<span className="text-[10px] font-[800] text-[#A0A09B] uppercase tracking-wider">{projects.length} ACTIVE</span>}
      />
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
        {projects.length === 0
          ? <EmptySlot msg="No projects to monitor." />
          : (
            <div className="flex flex-col gap-4">
              {projects.slice(0, 5).map((p, i) => (
                <Link key={p.id} href={`/space/${p.id}`} className="no-underline block group/proj">
                  <motion.div 
                    whileHover={{ x: 3 }} 
                    className="flex items-center gap-4 cursor-pointer p-2 -m-2 rounded-2xl hover:bg-[#F9F9F8] transition-all duration-300"
                  >
                    <MiniRing value={p.progress} color={p.color} />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[13px] font-[800] text-[#111111] truncate group-hover/proj:text-[#36C5F0] transition-colors">{p.name}</span>
                        <div className="flex items-center px-2 py-0.5 rounded-[6px] bg-[#F9F9F8] border border-[#F4F4F0]">
                          <span className="text-[9px] font-[800] text-[#A0A09B] uppercase">{p.task_count} TASKS</span>
                        </div>
                      </div>

                      <div className="h-1.5 bg-[#F4F4F0] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.progress}%` }}
                          transition={{ delay: 0.4 + i * 0.08, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full relative"
                          style={{ background: p.color }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0" />
                        </motion.div>
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
  );
}
