"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Calendar, User, Zap, X, Layout, List, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { updateTask, createTask } from "@/lib/tasks";
import Avatar from "@/components/global/Avatar";

/* ═══════════════════════════
   TYPES
═══════════════════════════ */
type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  project: string;
  project_id: string;
  projectColor: string;
  assignee: string;
  assignee_id: string | null;
  assigneeColor: string;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  status: Status;
  stalled?: boolean;
  avatar_url?: string | null;
  email?: string | null;
  role?: string | null;
}

interface Column {
  id: Status;
  label: string;
  color: string;
  bg: string;
}

const COLUMNS: Column[] = [
  { id: "todo", label: "To Do", color: "#9CA3AF", bg: "#F5F5F2" },
  { id: "in_progress", label: "In Progress", color: "#36C5F0", bg: "#EFF9FE" },
  { id: "review", label: "Review", color: "#ECB22E", bg: "#FFFBEB" },
  { id: "done", label: "Done", color: "#2EB67D", bg: "#ECFDF5" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  high: { label: "High", color: "#E01E5A", bg: "#FEF2F6", icon: "▲" },
  medium: { label: "Medium", color: "#ECB22E", bg: "#FFFBEB", icon: "■" },
  low: { label: "Low", color: "#9CA3AF", bg: "#F5F5F2", icon: "▼" },
};

function colorFromString(s: string) {
  const palette = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}


/* ═══════════════════════════
   BOARD COMPONENT
═══════════════════════════ */
export function TaskBoard({ 
  tasks: initialTasks, 
  projects, 
  members, 
  projectId,
  onRefresh 
}: { 
  tasks: Task[]; 
  projects: any[]; 
  members: any[]; 
  projectId?: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [filter, setFilter] = useState("All projects");
  const [memberFilter, setMemberFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStatus, setAddStatus] = useState<Status>("todo");
  
  // New Task form state
  const [newTitle, setNewTitle] = useState("");
  const [newProjectId, setNewProjectId] = useState(projectId || "");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const filtered = tasks.filter(t => {
    const matchProject = filter === "All projects" || t.project === filter;
    const matchMember = memberFilter === "all" || t.assignee_id === memberFilter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchProject && matchMember && matchSearch;
  });

  const handleUpdateStatus = async (taskId: string, newStatus: Status) => {
    const result = await updateTask(taskId, { status: newStatus }, projectId || "workspace");
    if (!("error" in result)) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (openTask?.id === taskId) setOpenTask(prev => prev ? { ...prev, status: newStatus } : null);
      onRefresh();
    }
  };

  const handleUpdateDueDate = async (taskId: string, newDueDate: string) => {
    const result = await updateTask(taskId, { due_date: newDueDate }, projectId || "workspace");
    if (!("error" in result)) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t));
      if (openTask?.id === taskId) setOpenTask(prev => prev ? { ...prev, dueDate: newDueDate } : null);
      onRefresh();
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !newProjectId) return;
    setSubmitting(true);
    const result = await createTask({
      projectId: newProjectId,
      title: newTitle.trim(),
      status: addStatus,
      priority: newPriority,
      assigneeId: newAssigneeId || undefined,
      dueDate: newDueDate || undefined,
    });
    if (!("error" in result)) {
      setNewTitle("");
      setNewDueDate("");
      setShowAddModal(false);
      onRefresh();
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Find tasks..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#36C5F0] transition-all w-[240px] shadow-sm"
            />
          </div>

          {!projectId && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13.5px] font-bold outline-none cursor-pointer shadow-sm min-w-[160px]"
            >
              <option>All projects</option>
              {projects.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
          )}

          <select
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13.5px] font-bold outline-none cursor-pointer shadow-sm min-w-[160px]"
          >
            <option value="all">Everyone</option>
            {members.map(m => (
              <option key={m.profiles.id} value={m.profiles.id}>
                {m.profiles.full_name || m.profiles.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {(["board", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-all border-0 cursor-pointer ${
                  viewMode === v ? "bg-[#F5F5F2] text-[#0D0D0D]" : "text-gray-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAddStatus("todo"); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold hover:bg-gray-800 transition-all border-0 cursor-pointer shadow-sm"
          >
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 min-w-0">
        {viewMode === "board" ? (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide h-full">
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="flex flex-col w-[300px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="text-[14px] font-black text-[#0D0D0D]">{col.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-100 text-[11px] font-black text-gray-400">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {colTasks.map(t => (
                      <TaskCardInternal key={t.id} task={t} columnColor={col.color} onOpen={setOpenTask} />
                    ))}
                    <button 
                      onClick={() => { setAddStatus(col.id); setShowAddModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all bg-transparent cursor-pointer"
                    >
                      <Plus size={14} /> <span className="text-[12px] font-bold">Add task</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-full overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Task</th>
                  {!projectId && <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Project</th>}
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Assignee</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Priority</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => {
                  const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  const col = COLUMNS.find(c => c.id === t.status) || COLUMNS[0];
                  return (
                    <tr key={t.id} onClick={() => setOpenTask(t)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <p className={`text-[13.5px] font-bold text-gray-900 ${t.status === 'done' ? 'line-through text-gray-300' : ''}`}>{t.title}</p>
                      </td>
                      {!projectId && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: t.projectColor }} />
                            <span className="text-[12px] font-semibold text-gray-600">{t.project}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Avatar 
                            url={t.avatar_url} 
                            name={t.assignee} 
                            email={t.email}
                            role={t.role}
                            size={24} 
                            fallbackColor={t.assigneeColor} 
                          />
                          <span className="text-[12px] font-semibold text-gray-600">{t.assignee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color }}>
                          {p.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.color }}>
                          {col.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Drawer */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-[22px] font-black text-[#0D0D0D] mb-6">New Task</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Task Title</label>
                  <input 
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none focus:border-[#36C5F0] transition-all"
                  />
                </div>
                {!projectId && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Project</label>
                    <select 
                      value={newProjectId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none cursor-pointer"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Assign To</label>
                  <select 
                    value={newAssigneeId}
                    onChange={e => setNewAssigneeId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.profiles.id} value={m.profiles.id}>
                        {m.profiles.full_name || m.profiles.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Priority</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as Priority)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none cursor-pointer hover:border-gray-200 transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Status</label>
                    <select 
                      value={addStatus}
                      onChange={e => setAddStatus(e.target.value as Status)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none cursor-pointer hover:border-gray-200 transition-all"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Due Date</label>
                    <input 
                      type="date"
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[14px] font-medium outline-none cursor-pointer hover:border-gray-200 transition-all"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={submitting || !newTitle.trim() || !newProjectId}
                    onClick={handleCreateTask}
                    className="flex-1 py-3 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-bold border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Create Task
                  </button>
                  <button onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl text-[13px] font-bold border-0 cursor-pointer">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {openTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenTask(null)} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[120]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-[121] shadow-2xl flex flex-col">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: openTask.projectColor }} />
                  <span className="text-[13px] font-black uppercase tracking-wider text-gray-400">{openTask.project}</span>
                </div>
                <button onClick={() => setOpenTask(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors border-0 bg-transparent cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
                <h2 className="text-[24px] font-black text-gray-900 leading-tight">{openTask.title}</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Priority</p>
                    <div className="flex items-center gap-2 text-[14px] font-bold" style={{ color: PRIORITY_CONFIG[openTask.priority]?.color }}>
                      {PRIORITY_CONFIG[openTask.priority]?.icon} {PRIORITY_CONFIG[openTask.priority]?.label}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Assignee</p>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        url={openTask.avatar_url} 
                        name={openTask.assignee} 
                        email={openTask.email}
                        role={openTask.role}
                        size={32} 
                        fallbackColor={openTask.assigneeColor} 
                      />
                      <span className="text-[14px] font-bold text-gray-700">{openTask.assignee}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Status</p>
                    <select 
                      value={openTask.status}
                      onChange={(e) => handleUpdateStatus(openTask.id, e.target.value as Status)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold outline-none cursor-pointer hover:border-gray-300 transition-all"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Due Date</p>
                    <input 
                      type="date" 
                      value={openTask.dueDate || ""}
                      onChange={(e) => handleUpdateDueDate(openTask.id, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold outline-none cursor-pointer hover:border-gray-300 transition-all"
                    />
                  </div>
                </div>

                {openTask.stalled && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
                    <AlertCircle className="text-amber-500 flex-shrink-0" size={24} />
                    <div>
                      <p className="text-[14px] font-black text-amber-900">Task is stalled</p>
                      <p className="text-[13px] text-amber-600 mt-1">This task hasn't seen progress in 4 days. Send a nudge to get it moving?</p>
                      <button className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-[12px] font-bold border-0 cursor-pointer shadow-lg shadow-amber-500/20">Send Nudge</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCardInternal({ task, columnColor, onOpen }: { task: Task; columnColor: string; onOpen: (t: Task) => void }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isDone = task.status === "done";

  return (
    <motion.div
      layout
      layoutId={task.id}
      whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.09)" }}
      onClick={() => onOpen(task)}
      className="bg-white rounded-2xl border border-[#EBEBEB] p-4 cursor-pointer select-none"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.projectColor }} />
          <span className="text-[11px] font-semibold text-[#9CA3AF] truncate">{task.project}</span>
        </div>
        {task.stalled && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0 border border-amber-100"
          >
            ⚡ Stalled
          </motion.span>
        )}
      </div>

      <p className={`text-[13.5px] font-bold leading-snug mb-3 ${isDone ? "line-through text-[#C4C4BC]" : "text-[#0D0D0D]"}`}>
        {task.title}
      </p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ background: p.bg, color: p.color }}>
            {p.icon} {p.label}
          </span>
          {task.dueDate && <span className="text-[11px] text-[#C4C4BC] font-medium">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
        </div>
        <Avatar 
          url={task.avatar_url} 
          name={task.assignee} 
          email={task.email}
          role={task.role}
          size={24} 
          fallbackColor={task.assigneeColor} 
        />
      </div>
    </motion.div>
  );
}
