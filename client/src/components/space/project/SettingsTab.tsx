"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Settings, Pencil, Trash2, AlertTriangle, Loader2,
  Save, X, FileText, Clock, Users, CheckCircle2, ChevronRight
} from "lucide-react";
import { updateProject, deleteProject } from "@/lib/projects";
import { toast } from "sonner";

interface SettingsTabProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    progress?: number;
    created_at?: string;
    workspace_id?: string;
  } | null;
  teamCount: number;
  taskCount: number;
  onProjectUpdate: (updates: { name?: string; description?: string; color?: string }) => void;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4.5 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
    >
      <div
        className="w-10.5 h-10.5 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}0F`, border: `1px solid ${color}1A` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-[17px] font-black text-gray-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

export default function SettingsTab({ project, teamCount, taskCount, onProjectUpdate }: SettingsTabProps) {
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSaveName = async () => {
    if (!project || !name.trim()) return;
    setSaving(true);
    const res = await updateProject(project.id, { name: name.trim() });
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    onProjectUpdate({ name: name.trim() });
    setEditingName(false);
    toast.success("Project name updated");
  };

  const handleSaveDescription = async () => {
    if (!project) return;
    setSaving(true);
    const res = await updateProject(project.id, { description: description.trim() });
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    onProjectUpdate({ description: description.trim() });
    setEditingDesc(false);
    toast.success("Description updated");
  };

  const handleDelete = async () => {
    if (!project || deleteInput.trim() !== project.name.trim()) return;
    setDeleting(true);
    const res = await deleteProject(project.id);
    setDeleting(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Project deleted");
    router.replace("/space");
  };

  if (!project) return null;

  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8  space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Project Configurations</h1>
        <p className="text-[13px] font-medium text-gray-500">Manage your project credentials, scope, and settings.</p>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Team Size" value={`${teamCount} members`} color="#4F46E5" />
        <StatCard icon={<FileText size={18} />} label="Total Tasks" value={`${taskCount} tasks`} color="#10B981" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Completion" value={`${project.progress ?? 0}%`} color="#F59E0B" />
        <StatCard icon={<Clock size={18} />} label="Initialized" value={createdDate} color="#8B5CF6" />
      </div>

      {/* ── General Info Card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.01)] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
          <h3 className="text-[15px] font-black text-gray-900">General Information</h3>
          <p className="text-[12px] text-gray-400 font-bold mt-0.5">Edit project name and general overview details</p>
        </div>

        <div className="p-6 space-y-6 divide-y divide-gray-100">
          {/* Project Name Section */}
          <div className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Project Name</label>
              {!editingName && (
                <button
                  onClick={() => { setName(project.name); setEditingName(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[11px] font-bold text-gray-600 hover:border-gray-900 transition-colors cursor-pointer shadow-sm"
                >
                  <Pencil size={11} /> Edit Name
                </button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {editingName ? (
                <motion.div key="edit-name" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-3 max-w-xl">
                  <input
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13.5px] font-semibold text-gray-800 outline-none focus:border-gray-900 focus:bg-white transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingName(false)} className="px-3.5 py-2 rounded-xl bg-gray-100 text-[12px] font-bold text-gray-600 border-0 cursor-pointer hover:bg-gray-200/80 transition-colors">Cancel</button>
                    <button onClick={handleSaveName} disabled={saving || !name.trim()} className="px-3.5 py-2 rounded-xl bg-gray-900 text-white text-[12px] font-black border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-colors shadow-sm">{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </motion.div>
              ) : (
                <motion.p key="display-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[15px] font-bold text-gray-800">
                  {project.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Project Description</label>
              {!editingDesc && (
                <button
                  onClick={() => { setDescription(project.description ?? ""); setEditingDesc(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[11px] font-bold text-gray-600 hover:border-gray-900 transition-colors cursor-pointer shadow-sm"
                >
                  <Pencil size={11} /> Edit Description
                </button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {editingDesc ? (
                <motion.div key="edit-desc" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-3">
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this project's goals, scope, and key objectives..."
                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13.5px] font-semibold text-gray-800 outline-none focus:border-gray-900 focus:bg-white transition-all resize-none leading-relaxed min-h-[120px]"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingDesc(false)} className="px-3.5 py-2 rounded-xl bg-gray-100 text-[12px] font-bold text-gray-600 border-0 cursor-pointer hover:bg-gray-200/80 transition-colors">Cancel</button>
                    <button onClick={handleSaveDescription} disabled={saving} className="px-3.5 py-2 rounded-xl bg-gray-900 text-white text-[12px] font-black border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-colors shadow-sm">{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="display-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {project.description ? (
                    <p className="text-[13.5px] text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{project.description}</p>
                  ) : (
                    <p className="text-[13.5px] text-gray-300 italic font-semibold">No description added yet. Add a description to give your team context.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-[0_4px_24px_rgba(239,68,68,0.01)] overflow-hidden">
        <div className="px-6 py-5 border-b border-red-50 bg-red-50/20">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" />
            <h3 className="text-[15px] font-black text-red-950">Danger Zone</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-bold text-gray-900">Delete this project</p>
              <p className="text-[12px] text-gray-400 mt-1 leading-relaxed font-semibold max-w-xl">
                Once you delete a project, there is no going back. All channels, uploaded resources, tasks, integrations, and message archives will be permanently removed.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl bg-red-50 border border-red-200 text-[12px] font-bold text-red-600 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all cursor-pointer shadow-sm flex-shrink-0"
            >
              <Trash2 size={13.5} /> Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
              className="w-full max-w-md bg-white rounded-[24px] overflow-hidden shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-black text-gray-900 tracking-tight">Delete Project</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">This action is irreversible</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <p className="text-[12px] text-red-800 leading-relaxed font-semibold">
                    Warning: You are about to permanently delete <strong>{project.name}</strong>. All messages, files, and integrations will be completely erased.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Type <span className="text-red-600 font-bold normal-case">"{project.name}"</span> to confirm deletion
                  </label>
                  <input
                    value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={project.name}
                    className="w-full h-11 px-4 rounded-xl border border-gray-250 bg-gray-50/30 text-[13.5px] font-semibold text-gray-800 outline-none focus:border-red-300 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                    className="flex-1 h-11 rounded-xl bg-gray-100 text-[12.5px] font-bold text-gray-600 border-0 cursor-pointer hover:bg-gray-255 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput.trim() !== project.name.trim() || deleting}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[12.5px] font-black border-0 cursor-pointer disabled:opacity-40 hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}