"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import Avatar from "@/components/global/Avatar";
import {
  Building, Shield, Bell, Zap, LogOut, Camera, Check, Loader2,
  User, Mail, Link, Globe, Plus, X,
} from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();

  // ── Store ────────────────────────────────────────────────────────────────
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  // ── Profile state ────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Profile");

  // ── Workspace edit state ─────────────────────────────────────────────────
  const [editingWorkspace, setEditingWorkspace] = useState(workspace);
  const [wsName, setWsName] = useState(workspace?.name ?? "");
  const [wsSlug, setWsSlug] = useState(workspace?.slug ?? "");
  const [wsLogoUrl, setWsLogoUrl] = useState(workspace?.logo_url ?? "");
  const [wsSaving, setWsSaving] = useState(false);

  // ── Modals / forms ───────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWs, setNewWs] = useState({ name: "", slug: "" });
  const [deleteInput, setDeleteInput] = useState("");

  // ── Notifications ────────────────────────────────────────────────────────
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true, push: true, tasks: true,
  });

  // ── Security ─────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [securityLoading, setSecurityLoading] = useState(false);

  // ── Sync editing workspace from store on mount ───────────────────────────
  useEffect(() => {
    if (!editingWorkspace && workspace) {
      setEditingWorkspace(workspace);
    }
  }, [workspace]);

  // ── Keep form fields in sync when user picks a different workspace ───────
  useEffect(() => {
    if (editingWorkspace) {
      setWsName(editingWorkspace.name);
      setWsSlug(editingWorkspace.slug ?? "");
      setWsLogoUrl(editingWorkspace.logo_url ?? "");
    }
  }, [editingWorkspace]);

  // ── Profile load ─────────────────────────────────────────────────────────
  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
      }
    }
    setLoading(false);
  };

  // ── Flash success helper ─────────────────────────────────────────────────
  const flash = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // ── Reload workspaces from DB and sync store ─────────────────────────────
  const reloadWorkspaces = async (selectId?: string) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspaces(*)")
      .eq("user_id", profile.id);

    if (error || !data) return;

    const fresh = data
      .flatMap((row: any) =>
        Array.isArray(row.workspaces) ? row.workspaces : [row.workspaces]
      )
      .filter(Boolean);

    setWorkspaces(fresh);

    const target = selectId
      ? fresh.find((w: any) => w.id === selectId)
      : fresh.find((w: any) => w.id === editingWorkspace?.id) ?? fresh[0];

    if (target) {
      setWorkspace(target);
      setEditingWorkspace(target);
      localStorage.setItem("lastWorkspaceId", target.id);
    }
  };

  // ── Profile save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    if (!error) { flash(); loadProfile(); }
    setSaving(false);
  };

  // ── Workspace save ───────────────────────────────────────────────────────
  const handleSaveWorkspace = async () => {
    if (!editingWorkspace) return;
    setWsSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: wsName, slug: wsSlug, logo_url: wsLogoUrl })
      .eq("id", editingWorkspace.id);

    if (!error) {
      flash();
      // Update both the list and active workspace in-store without reload
      const updated = { ...editingWorkspace, name: wsName, slug: wsSlug, logo_url: wsLogoUrl };
      setEditingWorkspace(updated);
      setWorkspaces(workspaces.map((w) => w.id === updated.id ? updated : w));
      if (workspace?.id === updated.id) setWorkspace(updated);
    }
    setWsSaving(false);
  };

  // ── Password update ──────────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (!passwords.new) return;
    setSecurityLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (!error) { flash(); setPasswords({ current: "", new: "" }); }
    else alert(error.message);
    setSecurityLoading(false);
  };

  // ── Delete workspace ─────────────────────────────────────────────────────
  const handleDeleteWorkspace = async () => {
    if (!editingWorkspace || deleteInput !== editingWorkspace.name) return;
    const { error } = await supabase
      .from("workspaces").delete().eq("id", editingWorkspace.id);

    if (!error) {
      const remaining = workspaces.filter((w) => w.id !== editingWorkspace.id);
      setWorkspaces(remaining);
      setShowDeleteConfirm(false);
      setDeleteInput("");

      if (remaining.length > 0) {
        setWorkspace(remaining[0]);
        setEditingWorkspace(remaining[0]);
        localStorage.setItem("lastWorkspaceId", remaining[0].id);
      } else {
        window.location.href = "/space";
      }
    }
  };

  // ── Create workspace ─────────────────────────────────────────────────────
  const handleCreateWorkspace = async () => {
    if (!newWs.name || !newWs.slug || !profile) return;
    setWsSaving(true);

    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: newWs.name, slug: newWs.slug, owner_id: profile.id })
      .select()
      .single();

    if (!wsError && ws) {
      // ✅ No workspace_members insert needed — trigger handles it automatically
      flash();
      setShowCreateModal(false);
      setNewWs({ name: "", slug: "" });
      const updated = [...workspaces, ws];
      setWorkspaces(updated);
      setWorkspace(ws);
      setEditingWorkspace(ws);
      localStorage.setItem("lastWorkspaceId", ws.id);
    } else if (wsError) {
      console.error("Workspace creation error:", wsError);
    }

    setWsSaving(false);
  };

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setSaving(true);
    const filePath = `${profile.id}/avatar.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars").upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error } = await supabase
        .from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
      if (!error) { flash(); loadProfile(); }
    }
    setSaving(false);
  };

  // ── Logo upload ──────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingWorkspace) return;
    setWsSaving(true);
    const filePath = `${editingWorkspace.id}/logo.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("workspace-logos").upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("workspace-logos").getPublicUrl(filePath);
      const { error } = await supabase
        .from("workspaces").update({ logo_url: publicUrl }).eq("id", editingWorkspace.id);
      if (!error) {
        flash();
        setWsLogoUrl(publicUrl);
        const updated = { ...editingWorkspace, logo_url: publicUrl };
        setEditingWorkspace(updated);
        setWorkspaces(workspaces.map((w) => w.id === updated.id ? updated : w));
        if (workspace?.id === updated.id) setWorkspace(updated);
      }
    } else {
      alert("Upload failed. Make sure the 'workspace-logos' bucket exists in Supabase Storage.");
    }
    setWsSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ── Select workspace to edit ─────────────────────────────────────────────
  const handleSelectWorkspace = (ws: any) => {
    setEditingWorkspace(ws);
    // Also switch active workspace in store + sidebar
    setWorkspace(ws);
    localStorage.setItem("lastWorkspaceId", ws.id);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-[#36C5F0]" size={32} />
    </div>
  );

  const tabs = [
    { label: "Profile", icon: User },
    { label: "Workspace", icon: Building },
    { label: "Notifications", icon: Bell },
    { label: "Security", icon: Shield },
  ];

  return (
    <div className="mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-500 text-[14px] mt-1">Manage your personal presence and collective workspace.</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4F46E5] bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
          <Zap size={14} className="fill-indigo-500" />
          <span>{editingWorkspace?.plan ?? "Solo"} Plan</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

        {/* Sidebar tabs */}
        <aside className="w-full lg:w-48 flex-shrink-0">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">
            {tabs.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium border-0 cursor-pointer transition-all ${activeTab === item.label
                  ? "bg-indigo-50 text-[#4F46E5]"
                  : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <item.icon size={16} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
            <div className="hidden lg:block pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 border-0 bg-transparent cursor-pointer hover:bg-red-50 transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 w-full max-w-3xl space-y-6 min-w-0">
          <AnimatePresence mode="wait">

            {/* ── Profile ── */}
            {activeTab === "Profile" && (
              <motion.section
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                <h3 className="text-[15px] font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Personal Information</h3>

                <div className="flex items-center gap-5 mb-6">
                  <div className="relative group flex-shrink-0">
                    <Avatar url={profile?.avatar_url} name={fullName} email={email} role="You" size={64} className="rounded-2xl shadow-sm" />
                    <label className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-500 hover:text-[#4F46E5] transition-all cursor-pointer group-hover:scale-105">
                      <Camera size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-gray-900">Profile Photo</h4>
                    <p className="text-[12px] text-gray-500 mt-0.5">Click to upload a new avatar.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-gray-700">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input value={email} disabled className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-medium outline-none opacity-70 cursor-not-allowed shadow-sm" />
                    </div>
                    <p className="text-[11px] text-gray-400">Contact support to change your primary email.</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSave}
                      disabled={saving || fullName === profile?.full_name}
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[13px] font-semibold border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save Changes
                    </button>
                    <button
                      onClick={() => setFullName(profile?.full_name ?? "")}
                      disabled={saving || fullName === profile?.full_name}
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-[13px] font-semibold cursor-pointer disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  {success && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] bg-emerald-50 px-4 py-2 rounded-lg">
                      <Check size={16} /> Saved Successfully
                    </motion.div>
                  )}
                </div>
              </motion.section>
            )}

            {/* ── Workspace ── */}
            {activeTab === "Workspace" && (
              <motion.section
                key="workspace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                  <h3 className="text-[15px] font-bold text-gray-900">Workspace Settings</h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-[#4F46E5] rounded-lg text-[12px] font-semibold border-0 cursor-pointer hover:bg-indigo-100 transition-all"
                  >
                    <Plus size={14} /> New Workspace
                  </button>
                </div>

                {/* Workspace picker */}
                <div className="mb-5">
                  <p className="text-[12px] font-semibold text-gray-700 mb-2">Your Workspaces</p>
                  <div className="flex flex-wrap gap-2">
                    {workspaces.map((ws) => {
                      const initials = ws.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                      const isEditing = editingWorkspace?.id === ws.id;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws)}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${isEditing
                            ? "bg-indigo-50/50 border-[#4F46E5] shadow-sm"
                            : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                            }`}
                        >
                          {/* Logo or gradient initial */}
                          <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0"
                            style={{ background: ws.logo_url ? "transparent" : "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
                            {ws.logo_url
                              ? <img src={ws.logo_url} alt={ws.name} className="w-full h-full object-cover" />
                              : <span className="text-white text-[10px] font-bold">{initials}</span>
                            }
                          </div>
                          <div className="text-left">
                            <p className={`text-[12.5px] font-semibold ${isEditing ? "text-[#4F46E5]" : "text-gray-900"}`}>
                              {ws.name}
                            </p>
                            <p className="text-[10px] text-gray-500 capitalize leading-none mt-0.5">{ws.plan} Plan</p>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:text-[#4F46E5] hover:border-[#4F46E5] transition-all cursor-pointer bg-gray-50"
                    >
                      <Plus size={14} />
                      <span className="text-[12px] font-semibold">Add</span>
                    </button>
                  </div>
                </div>

                {/* Logo upload */}
                <div className="flex items-center gap-4 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="relative group flex-shrink-0">
                    <div className="w-[48px] h-[48px] rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                      {wsLogoUrl
                        ? <img src={wsLogoUrl} className="w-full h-full object-cover" alt="Logo" />
                        : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
                            <span className="text-white text-[14px] font-bold">
                              {editingWorkspace?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )
                      }
                    </div>
                    <label className="absolute -bottom-1.5 -right-1.5 p-1 bg-white rounded-md border border-gray-200 shadow-sm text-gray-500 hover:text-[#4F46E5] transition-all cursor-pointer group-hover:scale-105">
                      <Camera size={12} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-gray-900">Workspace Logo</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Shown in the sidebar and workspace switcher.</p>
                    {wsSaving && (
                      <p className="text-[12px] text-[#4F46E5] mt-1 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Uploading…
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-gray-700">Workspace Name</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          value={wsName}
                          onChange={(e) => setWsName(e.target.value)}
                          placeholder="My Workspace"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-gray-700">Slug</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          value={wsSlug}
                          onChange={(e) => setWsSlug(e.target.value)}
                          placeholder="my-workspace"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleSaveWorkspace}
                    disabled={
                      wsSaving ||
                      (wsName === editingWorkspace?.name &&
                        wsSlug === editingWorkspace?.slug &&
                        wsLogoUrl === (editingWorkspace?.logo_url ?? ""))
                    }
                    className="w-full sm:w-auto px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[13px] font-semibold border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {wsSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save Changes
                  </button>
                  {success && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] bg-emerald-50 px-4 py-2 rounded-lg">
                      <Check size={16} /> Saved
                    </motion.div>
                  )}
                </div>

                {/* Danger zone */}
                <div className="mt-5 pt-4 border-t border-red-100 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[13px] font-semibold text-red-600 mb-0.5">Danger Zone</h4>
                    <p className="text-[12px] text-gray-500">Once you delete a workspace, there is no going back.</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-shrink-0 px-3 py-1.5 bg-white text-red-600 rounded-lg text-[12px] font-semibold border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer shadow-sm"
                  >
                    Delete Workspace
                  </button>
                </div>
              </motion.section>
            )}

            {/* ── Notifications ── */}
            {activeTab === "Notifications" && (
              <motion.section key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <h3 className="text-[15px] font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Notification Preferences</h3>
                <div className="space-y-5">
                  {([
                    { key: "email" as const, title: "Email Notifications", desc: "Receive daily summary and direct mentions." },
                    { key: "push" as const, title: "Push Notifications", desc: "Get real-time updates in your browser." },
                    { key: "tasks" as const, title: "Task Assignments", desc: "Notify me when a task is assigned to me." },
                  ]).map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                      <div>
                        <h4 className="text-[14px] font-semibold text-gray-900">{pref.title}</h4>
                        <p className="text-[13px] text-gray-500 mt-0.5">{pref.desc}</p>
                      </div>
                      <div
                        onClick={() => setNotificationPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                        className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all shadow-inner border border-black/5 ${notificationPrefs[pref.key] ? "bg-[#4F46E5]" : "bg-gray-200"}`}
                      >
                        <motion.div animate={{ x: notificationPrefs[pref.key] ? 20 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ── Security ── */}
            {activeTab === "Security" && (
              <motion.section key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <h3 className="text-[15px] font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Security Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-gray-700">New Password</label>
                    <input
                      type="password" value={passwords.new}
                      onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={securityLoading || !passwords.new}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-semibold border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {securityLoading && <Loader2 size={14} className="animate-spin" />}
                      Change Password
                    </button>
                    {success && <span className="text-emerald-600 text-[13px] font-semibold">Updated successfully</span>}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {activeTab === "Workspace" && showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 border border-gray-200">
              <h3 className="text-[16px] font-bold text-gray-900">Delete Workspace?</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                This action is permanent. Type{" "}
                <span className="font-semibold text-gray-900">{editingWorkspace?.name}</span> to confirm.
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Workspace Name"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-sm transition-all"
              />
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold text-[13px] hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                  Cancel
                </button>
                <button onClick={handleDeleteWorkspace} disabled={deleteInput !== editingWorkspace?.name}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold text-[13px] hover:bg-red-700 transition-all border-0 cursor-pointer disabled:opacity-50 shadow-sm">
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create workspace modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-gray-900">Create Workspace</h3>
                <button onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-md border-0 bg-transparent cursor-pointer text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Name</label>
                  <input
                    value={newWs.name}
                    onChange={(e) => setNewWs({ ...newWs, name: e.target.value })}
                    placeholder="Engineering Team"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-gray-700">Slug</label>
                  <input
                    value={newWs.slug}
                    onChange={(e) => setNewWs({ ...newWs, slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                    placeholder="engineering-team"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] shadow-sm transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold text-[13px] hover:bg-gray-50 cursor-pointer shadow-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleCreateWorkspace} disabled={wsSaving || !newWs.name || !newWs.slug}
                  className="flex-1 py-2 bg-[#4F46E5] text-white rounded-lg font-semibold text-[13px] hover:bg-[#4338CA] border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm transition-all">
                  {wsSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}