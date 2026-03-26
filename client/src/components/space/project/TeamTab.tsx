"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { TeamMember, OnlineUser } from "@/types";

interface TeamTabProps {
  team: TeamMember[];
  onlineUsers: OnlineUser[];
}

export default function TeamTab({ team, onlineUsers }: TeamTabProps) {
  return (
    <div className="p-4 sm:p-5">
      {onlineUsers.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Online now · {onlineUsers.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full"
              >
                <div className="relative">
                  <GlobalAvatar
                    url={u.avatar_url}
                    name={u.full_name}
                    email={u.email}
                    size={20}
                    fallbackColor={strColor(u.id)}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white bg-emerald-400" />
                </div>
                <span className="text-[12px] font-semibold text-emerald-700">
                  {u.full_name ?? "User"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-3">
        All members · {team.length}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {team.map((m, i) => {
          const p = m.profiles;
          if (!p) return null;
          const isOnline = onlineUsers.some((u) => u.id === p.id);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="relative">
                <GlobalAvatar
                  url={p.avatar_url}
                  name={p.full_name}
                  email={p.email}
                  role={m.role}
                  size={38}
                  fallbackColor={strColor(p.id)}
                />
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-900 truncate">
                  {p.full_name ?? "Unknown"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                <span className="text-[10px] font-semibold capitalize" style={{ color: "#36C5F0" }}>
                  {m.role}
                </span>
              </div>
            </motion.div>
          );
        })}
        {team.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-300">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-[13px] font-semibold">No team members yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
