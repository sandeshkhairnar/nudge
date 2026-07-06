"use client";

import Avatar from "@/components/global/Avatar";
import { Card, CardHeader, EmptySlot } from "./DashboardBase";
import { strColor } from "@/lib/utils/color";
import { motion } from "framer-motion";

interface TeamMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  task_count: number;
  done_count: number;
}

interface TeamCardProps {
  team: TeamMember[];
}

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <Card>
      <CardHeader
        title="Team Hub"
        sub="Member throughput"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        right={<span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{team.length} MEMBERS</span>}
      />
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
        {team.length === 0
          ? <EmptySlot msg="Team activity will appear here." />
          : (
            <div className="flex flex-col gap-4">
              {team.map((m, i) => {
                const p = m.task_count ? Math.round((m.done_count / m.task_count) * 100) : 0;

                return (
                  <div key={m.id} className="flex items-center gap-4 p-2 -m-2 rounded-xl hover:bg-gray-50 transition-all group/member">
                    <div className="relative">
                      <Avatar
                        url={m.avatar_url}
                        name={m.full_name || "Unknown"}
                        email={m.email}
                        size={32}
                        fallbackColor={strColor(m.id)}
                        className="ring-2 ring-white shadow-sm"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <span className="text-[13px] font-semibold text-gray-900 truncate group-hover/member:text-indigo-600 transition-colors">
                          {m.full_name?.split(" ")[0] ?? "Unknown"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-gray-900">{m.done_count}</span>
                          <span className="text-[10px] font-medium text-gray-400">/ {m.task_count}</span>
                        </div>
                      </div>

                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p}%` }}
                          transition={{ delay: 0.5 + i * 0.05, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full bg-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </Card>
  );
}
