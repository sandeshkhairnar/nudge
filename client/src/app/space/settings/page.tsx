"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import Avatar from "@/components/global/Avatar";
import { 
  Building, Shield, Bell, Zap, LogOut, Camera, Check, Loader2, AlertCircle,
  User, Mail, ShieldCheck, Lock, Trash2, CreditCard
} from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("Profile");
  const [wsName, setWsName] = useState(workspace?.name || "");
  const [wsSaving, setWsSaving] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    tasks: true,
  });
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    if (workspace?.name) setWsName(workspace.name);
  }, [workspace?.name]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setEmail(data.email || "");
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);
    
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadProfile();
    }
    setSaving(false);
  };

  const handleSaveWorkspace = async () => {
    if (!workspace) return;
    setWsSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: wsName })
      .eq("id", workspace.id);
    
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // The store will need to be updated or page reloaded
      window.location.reload();
    }
    setWsSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwords.new) return;
    setSecurityLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (!error) {
      setSuccess(true);
      setPasswords({ current: "", new: "" });
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert(error.message);
    }
    setSecurityLoading(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace || deleteInput !== workspace.name) return;
    const { error } = await supabase.from("workspaces").delete().eq("id", workspace.id);
    if (!error) {
      window.location.href = "/space";
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (!updateError) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        loadProfile();
      }
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-[#36C5F0]" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight leading-none">Settings</h1>
          <p className="text-gray-500 text-[15px] mt-2">Manage your personal presence and collective workspace.</p>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#36C5F0] bg-[#36C5F0]/5 px-4 py-2 rounded-full border border-[#36C5F0]/10">
          <Zap size={14} />
          <span>Pro Workspace</span>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="sticky top-8 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { label: "Profile", icon: User },
              { label: "Workspace", icon: Building },
              { label: "Notifications", icon: Bell },
              { label: "Security", icon: Shield },
              { label: "Integrations", icon: Zap },
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => setActiveTab(item.label)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-bold border-0 cursor-pointer transition-all ${
                  activeTab === item.label 
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold text-red-500 border-0 bg-transparent cursor-pointer hover:bg-red-50/50 hover:shadow-sm transition-all grayscale hover:grayscale-0"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-6 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "Profile" && (
              <motion.section 
                key="profile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                <h3 className="text-[18px] font-black text-gray-900 mb-6 flex items-center gap-2">
                  Personal Information
                </h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group">
                    <Avatar 
                      url={profile?.avatar_url} 
                      name={fullName} 
                      email={email}
                      role="You"
                      size={80} 
                      className="rounded-2xl" 
                    />
                    <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-gray-100 shadow-lg text-gray-500 hover:text-[#36C5F0] transition-all border-0 cursor-pointer group-hover:scale-110">
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
                      <input 
                        value={email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 italic">Contact support to change your primary email.</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                      onClick={() => setFullName(profile?.full_name || "")}
                      disabled={saving || fullName === profile?.full_name}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-100 transition-all"
                    >
                      Discard
                    </button>
                  </div>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] bg-emerald-50 px-4 py-2 rounded-lg"
                    >
                      <Check size={16} />
                      Saved Successfully
                    </motion.div>
                  )}
                </div>
              </motion.section>
            )}

            {activeTab === "Workspace" && (
              <motion.section 
                key="workspace"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                <h3 className="text-[18px] font-black text-gray-900 mb-6 flex items-center gap-2">
                  Workspace Settings
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Workspace Name</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={handleSaveWorkspace}
                    disabled={wsSaving || wsName === workspace?.name}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {wsSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Update Workspace
                  </button>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] bg-emerald-50 px-4 py-2 rounded-lg"
                    >
                      <Check size={16} />
                      Name Updated
                    </motion.div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-red-50">
                  <h4 className="text-[14px] font-black text-red-600 mb-2 uppercase tracking-widest">Danger Zone</h4>
                  <p className="text-[13px] text-gray-400 mb-4">Once you delete a workspace, there is no going back. Please be certain.</p>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                  >
                    Delete Workspace
                  </button>
                </div>
              </motion.section>
            )}

            {activeTab === "Notifications" && (
              <motion.section 
                key="notifications"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                <h3 className="text-[18px] font-black text-gray-900 mb-6">Notification Preferences</h3>
                <div className="space-y-6">
                  {[
                    { key: "email" as const, title: "Email Notifications", desc: "Receive daily summary and direct mentions via email." },
                    { key: "push" as const, title: "Push Notifications", desc: "Get real-time updates in your browser." },
                    { key: "tasks" as const, title: "Task Assignments", desc: "Notify me when a task is assigned to me." },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between pb-6 border-b border-gray-50 last:border-0">
                      <div>
                        <h4 className="text-[14px] font-bold text-gray-900">{pref.title}</h4>
                        <p className="text-[12px] text-gray-400">{pref.desc}</p>
                      </div>
                      <div 
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                        className={`w-12 h-6 rounded-full relative cursor-pointer p-1 transition-all ${notificationPrefs[pref.key] ? "bg-[#36C5F0]" : "bg-gray-200"}`}
                      >
                        <motion.div 
                          animate={{ x: notificationPrefs[pref.key] ? 24 : 0 }}
                          className="w-4 h-4 bg-white rounded-full" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {activeTab === "Integrations" && (
              <motion.section 
                key="integrations"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-[20px] font-black text-gray-900 tracking-tight">Integrations</h3>
                    <p className="text-[14px] text-gray-500 mt-1">Connect your workspace with third-party tools.</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-black uppercase tracking-widest text-gray-400">Beta</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "Slack", icon: "#4A154B", desc: "Sync tasks to channels", connected: false },
                    { name: "Discord", icon: "#5865F2", desc: "Real-time notifications", connected: false },
                    { name: "GitHub", icon: "#181717", desc: "Connect repos to projects", connected: true },
                    { name: "Google", icon: "#4285F4", desc: "Calendar & Drive sync", connected: false },
                  ].map((app) => (
                    <div key={app.name} className="p-6 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-[#36C5F0]/30 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                          <Zap size={24} style={{ color: app.icon }} />
                        </div>
                        <button className={`px-4 py-1.5 rounded-full text-[12px] font-bold border-0 cursor-pointer transition-all ${
                          app.connected ? "bg-emerald-50 text-emerald-600" : "bg-white text-gray-900 shadow-sm hover:shadow-md"
                        }`}>
                          {app.connected ? "Connected" : "Connect"}
                        </button>
                      </div>
                      <h4 className="text-[15px] font-bold text-gray-900">{app.name}</h4>
                      <p className="text-[12px] text-gray-400 mt-1">{app.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {activeTab === "Security" && (
              <motion.section 
                key="security"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[32px] p-8 lg:p-10 shadow-xl shadow-gray-200/20"
              >
                <h3 className="text-[18px] font-black text-gray-900 mb-6">Security Settings</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">New Password</label>
                    <input 
                      type="password" 
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
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

          {activeTab === "Workspace" && showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-4"
              >
                <h3 className="text-[20px] font-black text-red-600">Delete Workspace?</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  This action is permanent. To confirm, please type <span className="font-bold text-gray-900">{workspace?.name}</span> below.
                </p>
                <input 
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Workspace Name"
                  className="w-full px-4 py-3 bg-gray-50 border border-red-100 rounded-xl text-[14px] outline-none focus:border-red-500"
                />
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-all border-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteWorkspace}
                    disabled={deleteInput !== workspace?.name}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-[14px] hover:bg-red-700 transition-all border-0 cursor-pointer disabled:opacity-50"
                  >
                    Delete Forever
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          <section className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <Avatar 
              url={profile?.avatar_url} 
              name={profile?.full_name} 
              email={profile?.email}
              role="You"
              size={32} 
              fallbackColor="#36C5F0" 
            />
            <div>
              <h4 className="text-[14px] font-black text-amber-900 mb-1">Workspace Sync</h4>
              <p className="text-[12.5px] text-amber-800 leading-relaxed">
                Changes made to your profile affect all projects in the <span className="font-bold">{workspace?.name}</span> workspace.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
