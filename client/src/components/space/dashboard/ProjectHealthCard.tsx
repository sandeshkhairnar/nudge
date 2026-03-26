"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Card, CardHeader, EmptySlot } from "./DashboardBase";

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
  );
}
