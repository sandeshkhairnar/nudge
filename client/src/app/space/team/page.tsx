"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Users, Mail, Shield, ShieldCheck, UserPlus, Search, X, Loader2, AlertCircle, Briefcase, ChevronDown } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

interface Member {
  id: string;
  role: string;
  profiles: Profile;
  projects: ProjectTag[];
}

interface Invitation {
  id: string;
  invitee_email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function TeamPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [projects, setProjects] = useState<ProjectTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (workspace?.id) {
      loadTeam();
      loadProjects();
    }
  }, [workspace?.id]);

  const loadProjects = async () => {
    if (!workspace?.id) return;
    const { data } = await supabase
      .from("projects")
      .select("id, name, color")
      .eq("workspace_id", workspace.id);
    if (data) setProjects(data);
  };

  const loadTeam = async () => {
    if (!workspace?.id) return;
    setLoading(true);

    const { data: mems } = await supabase
      .from("workspace_members")
      .select("id, role, profiles(id, email, full_name, avatar_url)")
      .eq("workspace_id", workspace.id);

    const { data: invs } = await supabase
      .from("invitations")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("status", "pending");

    const { data: projs } = await supabase
      .from("projects")
      .select("id, name, color")
      .eq("workspace_id", workspace.id);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("project_id, assignee_id")
      .in("project_id", projs?.map(p => p.id) || []);

    if (mems) {
      const enrichedMembers = mems.map((m: any) => {
        const memberTasks = tasks?.filter(t => t.assignee_id === m.profiles.id) || [];
        const memberProjectIds = Array.from(new Set(memberTasks.map(t => t.project_id)));
        const memberProjects = projs?.filter(p => memberProjectIds.includes(p.id)) || [];
        
        return {
          ...m,
          projects: memberProjects
        };
      });
      setMembers(enrichedMembers as any);
    }
    if (invs) setInvites(invs as any);
    setLoading(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !workspace?.id) return;
    setInviteLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: invErr } = await supabase.from("invitations").insert({
      workspace_id: workspace.id,
      project_id: selectedProjectId || null,
      inviter_id: user.id,
      invitee_email: inviteEmail.toLowerCase().trim(),
      role: inviteRole,
    });

    if (invErr) {
      setError(invErr.message);
    } else {
      setInviteEmail("");
      setSelectedProjectId("");
      setShowInvite(false);
      loadTeam();
    }
    setInviteLoading(false);
  };

  const filteredMembers = members.filter(m => 
    m.profiles.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profiles.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-[#36C5F0]" size={32} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-gray-500 text-[14px]">Manage your workspace access and roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#36C5F0] transition-all w-[240px]"
            />
          </div>
          <button 
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13.5px] font-bold hover:bg-gray-800 transition-all border-0 cursor-pointer"
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Member</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Projects</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Role</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F5F5F2] flex items-center justify-center font-bold text-[#b0b0a8] border border-gray-100 uppercase overflow-hidden">
                          {m.profiles.avatar_url ? (
                            <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            m.profiles.full_name?.[0] ?? m.profiles.email[0]
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-gray-900">{m.profiles.full_name ?? "Pending Name"}</p>
                          <p className="text-[12px] text-gray-400">{m.profiles.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {m.projects.length > 0 ? (
                          m.projects.map(proj => (
                            <span 
                              key={proj.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-gray-100 flex items-center gap-1"
                              style={{ background: `${proj.color}10`, color: proj.color }}
                            >
                              <div className="w-1 h-1 rounded-full" style={{ background: proj.color }} />
                              {proj.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No projects assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 w-fit">
                        {m.role === 'admin' ? <ShieldCheck size={12} className="text-[#36C5F0]" /> : <Shield size={12} className="text-gray-400" />}
                        <span className="text-[11.5px] font-bold capitalize text-gray-600">{m.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#F9F9F7] border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[15px] font-black text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={18} className="text-[#36C5F0]" />
              Pending Invites
            </h3>
            <div className="space-y-3">
              {invites.length === 0 ? (
                <p className="text-[13px] text-gray-400 italic">No pending invitations.</p>
              ) : (
                invites.map((inv) => (
                  <div key={inv.id} className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-gray-800 truncate">{inv.invitee_email}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#36C5F0] mt-0.5">{inv.role}</p>
                    </div>
                    <button className="p-1.5 text-gray-300 hover:text-red-500 transition-colors border-0 bg-transparent cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowInvite(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-[22px] font-black text-gray-900 mb-2">Invite to Team</h2>
              <p className="text-gray-500 text-[14px] mb-6">Send an invitation to join your workspace.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Email Address</label>
                  <input 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Project Access (Optional)</label>
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Full Workspace Access</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 italic">
                    {selectedProjectId ? "User will only see this project." : "User will see all projects in workspace."}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Role</label>
                  <div className="flex gap-2">
                    {["member", "admin"].map((r) => (
                      <button 
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`flex-1 py-3 rounded-xl text-[13px] font-bold border transition-all capitalize cursor-pointer ${
                          inviteRole === r 
                            ? "bg-[#0D0D0D] text-white border-[#0D0D0D]" 
                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[12px] font-semibold">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => setShowInvite(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendInvite}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="flex-1 py-3 bg-[#36C5F0] text-white rounded-xl text-[13px] font-bold border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {inviteLoading ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
