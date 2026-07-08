"use client";

import { motion } from "framer-motion";
import { Users, Shield, User, Star } from "lucide-react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { TeamMember, OnlineUser } from "@/types";

interface TeamTabProps {
  team: TeamMember[];
  onlineUsers: OnlineUser[];
}

function RoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();

  if (normalized === "owner" || normalized === "creator") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider">
        <Star size={9} className="fill-indigo-600 text-indigo-650" /> {role}
      </span>
    );
  }

  if (normalized === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
        <Shield size={9} className="fill-emerald-600 text-emerald-650" /> {role}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-[9px] font-black uppercase tracking-wider">
      <User size={9} /> {role}
    </span>
  );
}

export default function TeamTab({ team, onlineUsers }: TeamTabProps) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Project Members</h1>
        <p className="text-[13px] font-medium text-gray-500">Collaborating users, active presence statuses, and access credentials.</p>
      </div>

      {/* ── Online Now Section ── */}
      {onlineUsers.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Active Members ({onlineUsers.length})
          </p>
          <div className="flex flex-wrap gap-2.5">
            {onlineUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl"
              >
                <div className="relative flex-shrink-0">
                  <GlobalAvatar
                    url={u.avatar_url}
                    name={u.full_name}
                    email={u.email}
                    size={22}
                    fallbackColor={strColor(u.id)}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[12.5px] font-bold text-emerald-800">
                  {u.full_name ?? "User"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All Members Grid ── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">
          Workspace Roster ({team.length})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {team.map((m, i) => {
            const p = m.profiles;
            if (!p) return null;
            const isOnline = onlineUsers.some((u) => u.id === p.id);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 p-4.5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-200 group"
              >
                <div className="relative flex-shrink-0 mt-0.5">
                  <GlobalAvatar
                    url={p.avatar_url}
                    name={p.full_name}
                    email={p.email}
                    role={m.role}
                    size={42}
                    fallbackColor={strColor(p.id)}
                  />
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-black text-gray-900 truncate">
                      {p.full_name ?? "Member name"}
                    </p>
                  </div>
                  <p className="text-[11.5px] font-semibold text-gray-400 truncate mt-0.5">{p.email}</p>
                  <div className="mt-2.5">
                    <RoleBadge role={m.role} />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {team.length === 0 && (
            <div className="col-span-2 py-16 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
              <Users size={28} className="mx-auto mb-3 opacity-40 text-gray-400" />
              <p className="text-[13.5px] font-bold text-gray-900">No team members</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Invite people to your workspace to collaborate on this project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
