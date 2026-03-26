"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, X, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import GlobalAvatar from "@/components/global/Avatar";
import { strColor } from "@/lib/utils/color";
import { TeamMember } from "@/types";

interface NewTaskModalProps {
  title: string;
  assigneeId: string | null;
  dueDate: string;
  priority: string;
  status: string;
  assigneeOpen: boolean;
  loading: boolean;
  team: TeamMember[];
  onTitleChange: (v: string) => void;
  onAssigneeChange: (id: string | null) => void;
  onDueDateChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onAssigneeOpenToggle: () => void;
  onAssigneeClose: () => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function NewTaskModal({
  title, assigneeId, dueDate, priority, status,
  assigneeOpen, loading, team,
  onTitleChange, onAssigneeChange, onDueDateChange,
  onPriorityChange, onStatusChange, onAssigneeOpenToggle, onAssigneeClose,
  onCreate, onCancel,
}: NewTaskModalProps) {
  const selectedMember = team.find((m) => m.profiles?.id === assigneeId);

  return (
    <>
      <h3 className="text-[18px] font-black text-gray-900 mb-1">New Task</h3>
      <p className="text-[12.5px] text-gray-400 mb-5">Add a task to this project.</p>
      <div className="flex flex-col gap-3 mb-4">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !assigneeOpen && onCreate()}
          placeholder="Task title…"
          autoFocus
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
          style={{ fontFamily: "'Sora',sans-serif" }}
        />
        <div className="relative">
          <button
            onClick={onAssigneeOpenToggle}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] font-medium text-left flex items-center gap-2.5 cursor-pointer bg-white"
            style={{ fontFamily: "'Sora',sans-serif" }}
          >
            {selectedMember ? (
              <>
                <GlobalAvatar
                  url={selectedMember.profiles?.avatar_url}
                  name={selectedMember.profiles?.full_name || selectedMember.profiles?.email}
                  size={24}
                  fallbackColor={strColor(selectedMember.profiles?.id ?? "")}
                />
                <span className="text-gray-900 flex-1 truncate">
                  {selectedMember.profiles?.full_name ?? selectedMember.profiles?.email}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onAssigneeChange(null); }}
                  className="text-gray-300 hover:text-gray-500 border-0 bg-transparent cursor-pointer p-0"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#9CA3AF" strokeWidth="1.8" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-gray-400 flex-1">Assign to…</span>
              </>
            )}
          </button>
          <AnimatePresence>
            {assigneeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onAssigneeClose} />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 2, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  <div className="py-1 max-h-[200px] overflow-y-auto">
                    <button
                      onClick={() => { onAssigneeChange(null); onAssigneeClose(); }}
                      className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer border-0 bg-transparent text-left"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <X size={10} className="text-gray-400" />
                      </div>
                      <span className="text-[13px] text-gray-400" style={{ fontFamily: "'Sora',sans-serif" }}>
                        Unassigned
                      </span>
                    </button>
                    {team.map((member) => {
                      const p = member.profiles;
                      if (!p) return null;
                      const isSelected = assigneeId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => { onAssigneeChange(p.id); onAssigneeClose(); }}
                          className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 cursor-pointer border-0 bg-transparent text-left transition-colors"
                          style={{ background: isSelected ? "#F0FDF4" : undefined }}
                        >
                          <GlobalAvatar url={p.avatar_url} name={p.full_name || p.email} size={24} fallbackColor={strColor(p.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 truncate">{p.full_name ?? "Unknown"}</p>
                            <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                          </div>
                          {isSelected && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Priority</label>
            <select value={priority} onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium outline-none bg-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Status</label>
            <select value={status} onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium outline-none bg-white">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => onDueDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 outline-none bg-white"
              style={{ fontFamily: "'Sora',sans-serif", colorScheme: "light" }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
        <button onClick={onCreate} disabled={loading}
          className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {loading ? "Creating…" : "Create"}
        </button>
      </div>
    </>
  );
}

interface NewChannelModalProps {
  name: string;
  loading: boolean;
  onNameChange: (v: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function NewChannelModal({ name, loading, onNameChange, onCreate, onCancel }: NewChannelModalProps) {
  return (
    <>
      <h3 className="text-[18px] font-black text-gray-900 mb-1">New Channel</h3>
      <p className="text-[12.5px] text-gray-400 mb-5">Create a channel for your project.</p>
      <input value={name} onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCreate()}
        placeholder="e.g. frontend, design, general" autoFocus
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-4 placeholder-gray-300"
        style={{ fontFamily: "'Sora',sans-serif" }} />
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
        <button onClick={onCreate} disabled={loading}
          className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {loading ? "Creating…" : "Create"}
        </button>
      </div>
    </>
  );
}

interface InviteModalProps {
  email: string;
  role: "admin" | "member" | "viewer";
  error: string;
  sent: boolean;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onRoleChange: (r: "admin" | "member" | "viewer") => void;
  onInvite: () => void;
  onClose: () => void;
  onInviteAnother: () => void;
}

export function InviteModal({ email, role, error, sent, loading, onEmailChange, onRoleChange, onInvite, onClose, onInviteAnother }: InviteModalProps) {
  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h3 className="text-[18px] font-black text-gray-900 mb-1">Invite sent!</h3>
        <p className="text-[12.5px] text-gray-400 mb-1">An email was sent to</p>
        <p className="text-[13px] font-bold text-gray-700 mb-5">{email}</p>
        <p className="text-[11.5px] text-gray-400 mb-6">
          They&apos;ll get a link to accept the invitation. If they don&apos;t have an account yet, they&apos;ll be prompted to sign up first.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onInviteAnother} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Invite another</button>
          <button onClick={onClose} className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0">Done</button>
        </div>
      </motion.div>
    );
  }
  return (
    <>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Mail size={14} className="text-blue-500" />
        </div>
        <h3 className="text-[18px] font-black text-gray-900">Invite to Project</h3>
      </div>
      <p className="text-[12.5px] text-gray-400 mb-5">Works for anyone — existing users get a notification, new users receive a sign-up link.</p>
      <input value={email} onChange={(e) => { onEmailChange(e.target.value); }}
        onKeyDown={(e) => e.key === "Enter" && onInvite()}
        placeholder="colleague@company.com" type="email" autoFocus
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none mb-3 placeholder-gray-300"
        style={{ fontFamily: "'Sora',sans-serif" }} />
      <div className="mb-3">
        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Role</label>
        <div className="flex gap-2">
          {(["member", "admin", "viewer"] as const).map((r) => (
            <button key={r} onClick={() => onRoleChange(r)}
              className="flex-1 py-2 rounded-xl text-[11.5px] font-bold border cursor-pointer transition-all capitalize"
              style={{ background: role === r ? "#0D0D0D" : "#F9F9F7", color: role === r ? "#fff" : "#6B7280", borderColor: role === r ? "#0D0D0D" : "#E5E7EB", fontFamily: "'Sora',sans-serif" }}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-[12px] text-red-500 font-semibold mb-3 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
      <div className="flex gap-2.5 mt-1">
        <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
        <button onClick={onInvite} disabled={loading || !email.trim()}
          className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
          {loading ? "Sending…" : "Send Invite"}
        </button>
      </div>
    </>
  );
}

interface NewResourceModalProps {
  label: string;
  url: string;
  category: string;
  loading: boolean;
  onLabelChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export function NewResourceModal({ label, url, category, loading, onLabelChange, onUrlChange, onCategoryChange, onAdd, onCancel }: NewResourceModalProps) {
  const CATEGORIES = ["Documentation", "Credentials", "Deployment", "Testing", "Design", "Other"];
  return (
    <>
      <h3 className="text-[18px] font-black text-gray-900 mb-1">Add Resource</h3>
      <p className="text-[12.5px] text-gray-400 mb-5">Link or document for this project.</p>
      <div className="flex flex-col gap-3 mb-4">
        <input value={label} onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Label (e.g. Figma File)" autoFocus
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
          style={{ fontFamily: "'Sora',sans-serif" }} />
        <input value={url} onChange={(e) => onUrlChange(e.target.value)}
          placeholder="URL (optional)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none placeholder-gray-300"
          style={{ fontFamily: "'Sora',sans-serif" }} />
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none"
          style={{ fontFamily: "'Sora',sans-serif" }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[13px] font-bold cursor-pointer border-0">Cancel</button>
        <button onClick={onAdd} disabled={loading}
          className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {loading ? "Adding…" : "Add"}
        </button>
      </div>
    </>
  );
}
