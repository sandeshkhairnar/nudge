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
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight leading-none">Settings</h1>
          <p className="text-gray-500 text-[15px] mt-2">Manage your personal presence and collective workspace.</p>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#36C5F0] bg-[#36C5F0]/5 px-4 py-2 rounded-full border border-[#36C5F0]/10">
          <Zap size={14} />
          <span>{editingWorkspace?.plan ?? "Solo"} Plan</span>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">

        {/* Sidebar tabs */}
        <aside className="lg:col-span-1">
          <div className="sticky top-8 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-bold border-0 cursor-pointer transition-all ${activeTab === item.label
                  ? "bg-[#36C5F0]/10 text-[#36C5F0] shadow-sm"
                  : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <item.icon size={16} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
            <div className="hidden lg:block pt-6 mt-6 border-t border-gray-100/50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold text-red-500 border-0 bg-transparent cursor-pointer hover:bg-red-50/50 transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <AnimatePresence mode="wait">

            {/* ── Profile ── */}
            {activeTab === "Profile" && (
              <motion.section
                key="profile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                <h3 className="text-[18px] font-black text-gray-900 mb-6">Personal Information</h3>

                {/* Avatar */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group">
                    <Avatar url={profile?.avatar_url} name={fullName} email={email} role="You" size={80} className="rounded-2xl" />
                    <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-gray-100 shadow-lg text-gray-500 hover:text-[#36C5F0] transition-all cursor-pointer group-hover:scale-110">
                      <Camera size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-gray-900">Profile Photo</h4>
                    <p className="text-[13px] text-gray-400">Click to upload a new avatar.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input value={email} disabled className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none opacity-60 cursor-not-allowed" />
                    </div>
                    <p className="text-[11px] text-gray-400 italic">Contact support to change your primary email.</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleSave}
                      disabled={saving || fullName === profile?.full_name}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Save Changes
                    </button>
                    <button
                      onClick={() => setFullName(profile?.full_name ?? "")}
                      disabled={saving || fullName === profile?.full_name}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-100 transition-all"
                    >
                      Discard
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[18px] font-black text-gray-900">Workspace Settings</h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#36C5F0]/10 text-[#36C5F0] rounded-xl text-[13px] font-bold border-0 cursor-pointer hover:bg-[#36C5F0]/20 transition-all"
                  >
                    <Plus size={16} /> New Workspace
                  </button>
                </div>

                {/* Workspace picker */}
                <div className="mb-8">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Your Workspaces</p>
                  <div className="flex flex-wrap gap-3">
                    {workspaces.map((ws) => {
                      const initials = ws.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                      const isEditing = editingWorkspace?.id === ws.id;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer ${isEditing
                            ? "bg-[#36C5F0]/5 border-[#36C5F0] shadow-sm"
                            : "bg-white border-gray-100 hover:border-gray-200"
                            }`}
                        >
                          {/* Logo or gradient initial */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                            style={{ background: ws.logo_url ? "transparent" : "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
                            {ws.logo_url
                              ? <img src={ws.logo_url} alt={ws.name} className="w-full h-full object-cover" />
                              : <span className="text-white text-[11px] font-black">{initials}</span>
                            }
                          </div>
                          <div className="text-left">
                            <p className={`text-[13.5px] font-bold ${isEditing ? "text-[#36C5F0]" : "text-gray-900"}`}>
                              {ws.name}
                            </p>
                            <p className="text-[10px] text-gray-400 capitalize">{ws.plan} Plan</p>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-gray-200 text-gray-400 hover:text-[#36C5F0] hover:border-[#36C5F0] transition-all cursor-pointer bg-transparent"
                    >
                      <Plus size={18} />
                      <span className="text-[13px] font-bold">Add</span>
                    </button>
                  </div>
                </div>

                {/* Logo upload */}
                <div className="flex items-center gap-6 mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="relative group flex-shrink-0">
                    <div className="w-[72px] h-[72px] rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                      {wsLogoUrl
                        ? <img src={wsLogoUrl} className="w-full h-full object-cover" alt="Logo" />
                        : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#36C5F0,#2EB67D)" }}>
                            <span className="text-white text-[18px] font-black">
                              {editingWorkspace?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )
                      }
                    </div>
                    <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-gray-100 shadow-lg text-gray-500 hover:text-[#36C5F0] transition-all cursor-pointer group-hover:scale-110">
                      <Camera size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-gray-900">Workspace Logo</h4>
                    <p className="text-[12px] text-gray-400 mt-0.5">Shown in the sidebar and workspace switcher.</p>
                    {wsSaving && (
                      <p className="text-[12px] text-[#36C5F0] mt-1 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Uploading…
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit fields */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Workspace Name</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          value={wsName}
                          onChange={(e) => setWsName(e.target.value)}
                          placeholder="My Workspace"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Slug</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          value={wsSlug}
                          onChange={(e) => setWsSlug(e.target.value)}
                          placeholder="my-workspace"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Logo URL</label>
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        value={wsLogoUrl}
                        onChange={(e) => setWsLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleSaveWorkspace}
                    disabled={
                      wsSaving ||
                      (wsName === editingWorkspace?.name &&
                        wsSlug === editingWorkspace?.slug &&
                        wsLogoUrl === (editingWorkspace?.logo_url ?? ""))
                    }
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {wsSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Update Workspace
                  </button>
                  {success && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] bg-emerald-50 px-4 py-2 rounded-lg">
                      <Check size={16} /> Saved
                    </motion.div>
                  )}
                </div>

                {/* Danger zone */}
                <div className="mt-12 pt-8 border-t border-red-50">
                  <h4 className="text-[14px] font-black text-red-600 mb-2 uppercase tracking-widest">Danger Zone</h4>
                  <p className="text-[13px] text-gray-400 mb-4">Once you delete a workspace, there is no going back.</p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                  >
                    Delete Workspace
                  </button>
                </div>
              </motion.section>
            )}

            {/* ── Notifications ── */}
            {activeTab === "Notifications" && (
              <motion.section key="notifications" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20">
                <h3 className="text-[18px] font-black text-gray-900 mb-6">Notification Preferences</h3>
                <div className="space-y-6">
                  {([
                    { key: "email" as const, title: "Email Notifications", desc: "Receive daily summary and direct mentions." },
                    { key: "push" as const, title: "Push Notifications", desc: "Get real-time updates in your browser." },
                    { key: "tasks" as const, title: "Task Assignments", desc: "Notify me when a task is assigned to me." },
                  ]).map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between pb-6 border-b border-gray-50 last:border-0">
                      <div>
                        <h4 className="text-[14px] font-bold text-gray-900">{pref.title}</h4>
                        <p className="text-[12px] text-gray-400">{pref.desc}</p>
                      </div>
                      <div
                        onClick={() => setNotificationPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                        className={`w-12 h-6 rounded-full relative cursor-pointer p-1 transition-all ${notificationPrefs[pref.key] ? "bg-[#36C5F0]" : "bg-gray-200"}`}
                      >
                        <motion.div animate={{ x: notificationPrefs[pref.key] ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ── Security ── */}
            {activeTab === "Security" && (
              <motion.section key="security" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20">
                <h3 className="text-[18px] font-black text-gray-900 mb-6">Security Settings</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">New Password</label>
                    <input
                      type="password" value={passwords.new}
                      onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] outline-none focus:border-[#36C5F0] transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={securityLoading || !passwords.new}
                      className="px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                      {securityLoading && <Loader2 size={16} className="animate-spin" />}
                      Change Password
                    </button>
                    {success && <span className="text-emerald-600 text-[13px] font-bold">Updated successfully</span>}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Workspace sync notice */}
          <section className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <Avatar url={profile?.avatar_url} name={profile?.full_name} email={profile?.email} role="You" size={32} fallbackColor="#36C5F0" />
            <div>
              <h4 className="text-[14px] font-black text-amber-900 mb-1">Workspace Sync</h4>
              <p className="text-[12.5px] text-amber-800 leading-relaxed">
                Changes made to your profile affect all projects in the{" "}
                <span className="font-bold">{editingWorkspace?.name}</span> workspace.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {activeTab === "Workspace" && showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-4">
              <h3 className="text-[20px] font-black text-red-600">Delete Workspace?</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">
                This action is permanent. Type{" "}
                <span className="font-bold text-gray-900">{editingWorkspace?.name}</span> to confirm.
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Workspace Name"
                className="w-full px-4 py-3 bg-gray-50 border border-red-100 rounded-xl text-[14px] outline-none focus:border-red-500"
              />
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-all border-0 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleDeleteWorkspace} disabled={deleteInput !== editingWorkspace?.name}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-[14px] hover:bg-red-700 transition-all border-0 cursor-pointer disabled:opacity-50">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-black text-gray-900">Create Workspace</h3>
                <button onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full border-0 bg-transparent cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Name</label>
                  <input
                    value={newWs.name}
                    onChange={(e) => setNewWs({ ...newWs, name: e.target.value })}
                    placeholder="Engineering Team"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] outline-none focus:border-[#36C5F0]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Slug</label>
                  <input
                    value={newWs.slug}
                    onChange={(e) => setNewWs({ ...newWs, slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                    placeholder="engineering-team"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] outline-none focus:border-[#36C5F0]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-[14px] hover:bg-gray-100 border-0 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleCreateWorkspace} disabled={wsSaving || !newWs.name || !newWs.slug}
                  className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {wsSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
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