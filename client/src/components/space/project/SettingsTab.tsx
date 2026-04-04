"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Settings, Pencil, Trash2, AlertTriangle, Loader2,
  Save, X, Palette, FileText, Clock, Users, CheckCircle2
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

const COLORS = [
  "#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#8B5CF6",
  "#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#6366F1",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#A855F7",
];

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      className="flex items-center gap-3.5 px-5 py-4 rounded-2xl"
      style={{ background: "#FAFAF9", border: "1px solid #F0F0EB" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12`, border: `1px solid ${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className="text-[18px] font-black text-gray-900 leading-none mt-1">{value}</p>
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
  const [selectedColor, setSelectedColor] = useState(project?.color ?? "#36C5F0");
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

  const handleColorChange = async (color: string) => {
    if (!project) return;
    setSelectedColor(color);
    const res = await updateProject(project.id, { color });
    if (res.error) { toast.error(res.error); return; }
    onProjectUpdate({ color });
    toast.success("Color updated");
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
    ? new Date(project.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#0D0D0D" }}
        >
          <Settings size={18} color="#fff" />
        </div>
        <div>
          <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Project Settings</h2>
          <p className="text-[12px] text-gray-400 font-medium mt-0.5">Manage project details and configuration</p>
        </div>
      </div>

      {/* ── Quick Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label="Members" value={teamCount} color="#36C5F0" />
        <StatCard icon={<FileText size={18} />} label="Tasks" value={taskCount} color="#2EB67D" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Progress" value={`${project.progress ?? 0}%`} color="#ECB22E" />
        <StatCard icon={<Clock size={18} />} label="Created" value={createdDate} color="#8B5CF6" />
      </div>

      {/* ── Project Name ───────────────────────────────────── */}
      <div
        className="rounded-[20px] overflow-hidden"
        style={{ background: "#fff", border: "1px solid #EBEBEB", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "#FAFAF9", borderBottom: "1px solid #F0F0EB" }}>
          <span className="text-[13px] font-bold text-gray-900">Project Name</span>
          {!editingName && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setName(project.name); setEditingName(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] font-bold text-gray-500 cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Pencil size={11} /> Edit
            </motion.button>
          )}
        </div>
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {editingName ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] font-semibold text-gray-900 outline-none focus:border-gray-400 transition-colors"
                  style={{ fontFamily: "'Sora',sans-serif" }}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingName(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-[12px] font-bold text-gray-500 border-0 cursor-pointer hover:bg-gray-200 transition-colors"><X size={12} className="inline mr-1" />Cancel</button>
                  <button onClick={handleSaveName} disabled={saving || !name.trim()} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-colors"><Save size={12} className="inline mr-1" />{saving ? "Saving..." : "Save"}</button>
                </div>
              </motion.div>
            ) : (
              <motion.p key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[16px] font-bold text-gray-900">
                {project.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Description / Overview ─────────────────────────── */}
      <div
        className="rounded-[20px] overflow-hidden"
        style={{ background: "#fff", border: "1px solid #EBEBEB", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "#FAFAF9", borderBottom: "1px solid #F0F0EB" }}>
          <div>
            <span className="text-[13px] font-bold text-gray-900">Description</span>
            <p className="text-[11px] text-gray-400 mt-0.5">Add context so your team knows what this project is about</p>
          </div>
          {!editingDesc && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setDescription(project.description ?? ""); setEditingDesc(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] font-bold text-gray-500 cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Pencil size={11} /> Edit
            </motion.button>
          )}
        </div>
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {editingDesc ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this project&#39;s goals, scope, and key objectives..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-medium text-gray-900 outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed"
                  style={{ fontFamily: "'Sora',sans-serif", minHeight: 120 }}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingDesc(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-[12px] font-bold text-gray-500 border-0 cursor-pointer hover:bg-gray-200 transition-colors"><X size={12} className="inline mr-1" />Cancel</button>
                  <button onClick={handleSaveDescription} disabled={saving} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold border-0 cursor-pointer disabled:opacity-50 hover:bg-black transition-colors"><Save size={12} className="inline mr-1" />{saving ? "Saving..." : "Save"}</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {project.description ? (
                  <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                ) : (
                  <p className="text-[13px] text-gray-300 italic">No description yet. Click Edit to add one.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Project Color ──────────────────────────────────── */}
      {/* <div
        className="rounded-[20px] overflow-hidden"
        style={{ background: "#fff", border: "1px solid #EBEBEB", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}
      >
        <div className="px-6 py-4" style={{ background: "#FAFAF9", borderBottom: "1px solid #F0F0EB" }}>
          <div className="flex items-center gap-2">
            <Palette size={14} className="text-gray-400" />
            <span className="text-[13px] font-bold text-gray-900">Project Color</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Used in the sidebar, progress bar, and badges</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleColorChange(c)}
                className="w-9 h-9 rounded-xl border-0 cursor-pointer transition-all relative"
                style={{
                  background: c,
                  boxShadow: selectedColor === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : "0 1px 3px rgba(0,0,0,0.12)",
                }}
              >
                {selectedColor === c && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-[11px] font-bold text-gray-400">Preview:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md" style={{ background: selectedColor }} />
              <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${project.progress ?? 0}%`, background: selectedColor }} />
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* ── Danger Zone ────────────────────────────────────── */}
      <div
        className="rounded-[20px] overflow-hidden"
        style={{ background: "#fff", border: "1px solid #FEE2E2", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div className="px-6 py-4" style={{ background: "#FEF2F2", borderBottom: "1px solid #FEE2E2" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-[13px] font-bold text-red-900">Danger Zone</span>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-900">Delete this project</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Once deleted, all channels, messages, tasks, and resources will be <strong>permanently removed</strong>.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-[12px] font-bold text-red-600 cursor-pointer hover:bg-red-100 hover:border-red-300 transition-all flex-shrink-0 ml-4"
            >
              <Trash2 size={13} /> Delete Project
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
              className="w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-7 py-6" style={{ background: "#0D0D0D" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                    <Trash2 size={22} color="#EF4444" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black text-white tracking-tight">Delete Project</h3>
                    <p className="text-[12px] text-white/40 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="px-7 py-6 space-y-5">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-[12px] text-red-800 leading-relaxed">
                    <strong>Warning:</strong> Deleting <strong>{project.name}</strong> will permanently remove all associated channels, messages, tasks, resources, and integrations. Team members will lose access immediately.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Type <span className="text-red-500 normal-case tracking-normal font-bold">"{project.name}"</span> to confirm
                  </label>
                  <input
                    value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={project.name}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-[14px] font-medium text-gray-900 outline-none focus:border-red-300 transition-colors"
                    style={{ fontFamily: "'Sora',sans-serif" }}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-[13px] font-bold text-gray-600 border-0 cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput.trim() !== project.name.trim() || deleting}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[13px] font-bold border-0 cursor-pointer disabled:opacity-40 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {deleting ? "Deleting..." : "Delete Forever"}
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