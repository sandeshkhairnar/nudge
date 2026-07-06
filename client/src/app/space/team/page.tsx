"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Users, Mail, Shield, ShieldCheck, UserPlus, Search, X, Loader2, AlertCircle, Briefcase, ChevronDown } from "lucide-react";
import Avatar from "@/components/global/Avatar";
import { inviteMember, getWorkspaceInvitations, revokeInvitation } from "@/lib/project-members";

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
  invited_by?: string;
}

interface Invitation {
  id: string;
  invitee_email: string;
  role: string;
  status: string;
  created_at: string;
  project_id: string | null;
  project_name?: string;
  inviter?: {
    full_name: string | null;
  };
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user's project memberships
    const { data: userProjects } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);
    const userProjectIds = userProjects?.map(p => p.project_id) || [];

    const { data: mems } = await supabase
      .from("workspace_members")
      .select("id, role, profiles(id, email, full_name, avatar_url)")
      .eq("workspace_id", workspace.id);

    // Fetch all members, admins see everything
    const { data: wsMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const isAdmin = wsMembership?.role === "admin";

    // Use server action to fetch invitations (handles RLS and role-based filtering)
    const { invitations: invs } = await getWorkspaceInvitations(workspace.id);
    const filteredInvs = (invs || []).map(inv => ({
      ...inv,
      project_name: (inv.projects as any)?.name,
      inviter: inv.inviter
    }));

    const { data: projs } = await supabase
      .from("projects")
      .select("id, name, color")
      .eq("workspace_id", workspace.id);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("project_id, assignee_id")
      .in("project_id", projs?.map(p => p.id) || []);

    // Fetch all accepted invitations to track attribution
    const { data: attributionInvites } = await supabase
      .from("invitations")
      .select("invitee_id, inviter:profiles!invitations_inviter_id_fkey(full_name, email)")
      .eq("workspace_id", workspace.id)
      .eq("status", "accepted");

    if (mems) {
      const enrichedMembers = mems.map((m: any) => {
        const memberTasks = tasks?.filter(t => t.assignee_id === m.profiles.id) || [];
        const memberProjectIds = Array.from(new Set(memberTasks.map(t => t.project_id)));
        const memberProjects = projs?.filter(p => memberProjectIds.includes(p.id)) || [];
        
        // Find who invited this member
        const invite = attributionInvites?.find(i => i.invitee_id === m.profiles.id);
        const inviterObj = (invite?.inviter as any)?.[0] || (invite?.inviter as any);
        const invitedBy = inviterObj?.full_name || inviterObj?.email || "Direct/Admin";

        return {
          ...m,
          projects: memberProjects,
          invited_by: invitedBy
        };
      });
      setMembers(enrichedMembers as any);
    }
    setInvites(filteredInvs as any);
    setLoading(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !workspace?.id) return;
    setInviteLoading(true);
    setError("");

    const result = await inviteMember(
      workspace.id,
      inviteEmail.toLowerCase().trim(),
      selectedProjectId || null,
      inviteRole as any
    );

    if (result.error) {
      setError(result.error);
    } else {
      setInviteEmail("");
      setSelectedProjectId("");
      setShowInvite(false);
      loadTeam();
    }
    setInviteLoading(false);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    const { error } = await revokeInvitation(id);
    if (error) {
      alert(error);
    } else {
      loadTeam();
    }
  };

  const filteredMembers = members.filter(m => 
    m.profiles.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profiles.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="w-full flex flex-col font-sans bg-transparent pb-12">
      <div className="pb-6 mb-6 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-[13px] text-gray-500 font-medium mt-1">Manage your workspace access and roles.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowInvite(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[12px] font-semibold transition-colors border-0 cursor-pointer shadow-sm"
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Member</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Projects</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Invited By</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            url={m.profiles.avatar_url} 
                            name={m.profiles.full_name || m.profiles.email} 
                            email={m.profiles.email}
                            role={m.role}
                            size={36} 
                            className="border border-gray-200 shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-gray-900 truncate">{m.profiles.full_name ?? "Pending Name"}</p>
                            <p className="text-[12px] font-medium text-gray-500 truncate">{m.profiles.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {m.projects.length > 0 ? (
                            m.projects.map(proj => (
                              <span 
                                key={proj.id}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
                                style={{ background: `${proj.color}10`, color: proj.color, borderColor: `${proj.color}25` }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: proj.color }} />
                                {proj.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[12px] font-medium text-gray-400 italic">No projects</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[12.5px] font-medium text-gray-700">{m.invited_by}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md w-fit border ${m.role === 'admin' ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                          {m.role === 'admin' ? <ShieldCheck size={12} className="text-indigo-600" /> : <Shield size={12} className="text-gray-500" />}
                          <span className={`text-[11px] font-semibold capitalize ${m.role === 'admin' ? 'text-indigo-700' : 'text-gray-600'}`}>{m.role}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredMembers.map((m) => (
                <div key={m.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar 
                        url={m.profiles.avatar_url} 
                        name={m.profiles.full_name || m.profiles.email} 
                        email={m.profiles.email}
                        role={m.role}
                        size={40} 
                        className="border border-gray-200 shadow-sm"
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-gray-900 truncate">{m.profiles.full_name ?? "Pending Name"}</p>
                        <p className="text-[12px] font-medium text-gray-500 truncate">{m.profiles.email}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${m.role === 'admin' ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                        {m.role === 'admin' ? <ShieldCheck size={12} className="text-indigo-600" /> : <Shield size={12} className="text-gray-500" />}
                        <span className={`text-[11px] font-semibold capitalize ${m.role === 'admin' ? 'text-indigo-700' : 'text-gray-600'}`}>{m.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Projects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.projects.length > 0 ? (
                          m.projects.map(proj => (
                            <span 
                              key={proj.id}
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1.5"
                              style={{ background: `${proj.color}10`, color: proj.color, borderColor: `${proj.color}25` }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: proj.color }} />
                              {proj.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] font-medium text-gray-400 italic">No projects assigned</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Invited By</p>
                      <p className="text-[12.5px] font-medium text-gray-700">{m.invited_by}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" />
              Pending Invites
            </h3>
            <div className="space-y-3">
              {invites.length === 0 ? (
                <p className="text-[13px] font-medium text-gray-400 italic">No pending invitations.</p>
              ) : (
                invites.map((inv) => {
                  const invObj = (inv.inviter as any)?.[0] || (inv.inviter as any);
                  const inviterName = invObj?.full_name || invObj?.email;
                  return (
                    <div key={inv.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-gray-800 truncate">{inv.invitee_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{inv.role}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[11px] font-medium text-gray-500">By {inviterName || "Admin"}</span>
                        </div>
                        {inv.project_name && (
                          <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-white border border-gray-200 rounded-md w-fit shadow-sm">
                            <Briefcase size={10} className="text-gray-500" />
                            <span className="text-[11px] font-medium text-gray-600">{inv.project_name}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
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
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative shadow-xl mx-4 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[18px] font-bold text-gray-900">Invite to Team</h2>
                <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 hover:bg-gray-100 cursor-pointer text-gray-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-gray-500 text-[13px] font-medium mb-6">Send an invitation to join your workspace.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 block">Email Address</label>
                  <input 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    autoFocus
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 block">Project Access (Optional)</label>
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="">Full Workspace Access</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  </div>
                  <p className="text-[11.5px] text-gray-500 font-medium mt-1.5">
                    {selectedProjectId ? "User will only see this project." : "User will see all projects in workspace."}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 block">Role</label>
                  <div className="flex gap-2">
                    {["member", "admin"].map((r) => (
                      <button 
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-colors capitalize cursor-pointer shadow-sm ${
                          inviteRole === r 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[12.5px] font-semibold shadow-sm">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowInvite(false)}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-[12.5px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendInvite}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[12.5px] font-semibold border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-sm min-w-[110px]"
                  >
                    {inviteLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
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
