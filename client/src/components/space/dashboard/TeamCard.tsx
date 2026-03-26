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
        title="Team activity"
        right={<span className="text-[10px] font-bold text-[#B0B0A8]">{team.length} members</span>}
      />
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        {team.length === 0
          ? <EmptySlot msg="Assign tasks to track team output." />
          : (
            <div className="flex flex-col gap-3">
              {team.map(m => {
                const p = m.task_count ? Math.round((m.done_count / m.task_count) * 100) : 0;

                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar
                      url={m.avatar_url}
                      name={m.full_name || "Unknown"}
                      email={m.email}
                      size={24}
                      fallbackColor={strColor(m.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-semibold text-[#374151] truncate">
                          {m.full_name?.split(" ")[0] ?? "Unknown"}
                        </span>
                        <span className="text-[9px] font-bold text-[#B0B0A8]">
                          {m.done_count}/{m.task_count}
                        </span>
                      </div>

                      <div className="h-[3px] bg-[#F0F0EB] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-[#2EB67D]"
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
