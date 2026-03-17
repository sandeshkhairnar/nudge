"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/store/workspace-store";
import { User, Mail, Building, Shield, Bell, Zap, LogOut, Camera, Check, Loader2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

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
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[400px]">
      <Loader2 className="animate-spin text-[#36C5F0]" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-[14px]">Manage your profile and workspace preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {[
            { label: "Profile", icon: User },
            { label: "Workspace", icon: Building },
            { label: "Notifications", icon: Bell },
            { label: "Security", icon: Shield },
            { label: "Integrations", icon: Zap },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-bold border-0 cursor-pointer transition-all ${
                i === 0 ? "bg-[#36C5F0]/10 text-[#36C5F0]" : "bg-transparent text-gray-500 hover:bg-gray-50"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-bold text-red-500 border-0 bg-transparent cursor-pointer hover:bg-red-50 transition-all">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="md:col-span-3 space-y-6">
          <section className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-[18px] font-black text-gray-900 mb-6 flex items-center gap-2">
              Personal Information
            </h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#36C5F0] to-[#2EB67D] flex items-center justify-center text-white text-[32px] font-black">
                  {fullName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-gray-100 shadow-lg text-gray-500 hover:text-gray-900 transition-all border-0 cursor-pointer opacity-0 group-hover:opacity-100">
                  <Camera size={16} />
                </button>
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

            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSave}
                  disabled={saving || fullName === profile?.full_name}
                  className="px-6 py-2.5 bg-[#0D0D0D] text-white rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Changes
                </button>
                <button 
                  onClick={() => setFullName(profile?.full_name || "")}
                  disabled={saving || fullName === profile?.full_name}
                  className="px-6 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[13.5px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-gray-100 transition-all"
                >
                  Reset
                </button>
              </div>
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-600 font-bold text-[13px]"
                  >
                    <Check size={16} />
                    Saved Successfully
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <AlertCircle size={20} />
            </div>
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
