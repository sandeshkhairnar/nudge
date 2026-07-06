"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, X, Loader2, AlertCircle, LayoutGrid, List } from "lucide-react";
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
  border: string;
}

const COLUMNS: Column[] = [
  { id: "todo", label: "To Do", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  { id: "in_progress", label: "In Progress", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { id: "review", label: "In Review", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "done", label: "Done", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  high: { label: "High", color: "text-red-700", bg: "bg-red-50", icon: "↑" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50", icon: "→" },
  low: { label: "Low", color: "text-gray-600", bg: "bg-gray-100", icon: "↓" },
};

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
    <div className="flex flex-col h-full min-h-0 bg-gray-50/30">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 bg-white z-10 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 outline-none w-[200px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {!projectId && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 text-[13px] font-medium outline-none cursor-pointer hover:bg-gray-50 transition-colors appearance-none min-w-[130px]"
            >
              <option value="All projects">All projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}

          <select
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 text-[13px] font-medium outline-none cursor-pointer hover:bg-gray-50 transition-colors appearance-none min-w-[130px]"
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
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            {(["board", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`p-1.5 rounded-md text-[13px] font-medium transition-all border-0 cursor-pointer flex items-center justify-center w-8 h-8 ${
                  viewMode === v ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
                title={v === "board" ? "Board View" : "List View"}
              >
                {v === "board" ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAddStatus("todo"); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold transition-colors shadow-sm cursor-pointer border-0"
          >
            <Plus size={15} /> New task
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 min-w-0 relative p-4 sm:p-5 overflow-hidden">
        {viewMode === "board" ? (
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 h-full" style={{ scrollbarWidth: "thin" }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="flex flex-col w-[280px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[12px] font-semibold border ${col.bg} ${col.color} ${col.border}`}>
                        {col.label}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-gray-400">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10" style={{ scrollbarWidth: "none" }}>
                    {colTasks.map((t, i) => (
                      <TaskCardInternal key={t.id} task={t} onOpen={setOpenTask} index={i} />
                    ))}
                    <button 
                      onClick={() => { setAddStatus(col.id); setShowAddModal(true); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300 bg-white/50 hover:bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all cursor-pointer font-medium text-[13px] shadow-sm"
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Task</th>
                    {!projectId && <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Project</th>}
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Assignee</th>
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Priority</th>
                    <th className="px-6 py-3 text-[12px] font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((t) => {
                    const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                    const col = COLUMNS.find(c => c.id === t.status) || COLUMNS[0];
                    return (
                      <tr key={t.id} onClick={() => setOpenTask(t)} className="cursor-pointer hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-3.5">
                          <p className={`text-[13px] font-semibold ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
                        </td>
                        {!projectId && (
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: t.projectColor }} />
                              <span className="text-[13px] text-gray-600">{t.project}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar 
                              url={t.avatar_url} 
                              name={t.assignee} 
                              email={t.email}
                              size={24} 
                              fallbackColor={t.assigneeColor} 
                            />
                            <span className="text-[13px] text-gray-700">{t.assignee}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${p.bg} ${p.color}`}>
                            {p.icon} {p.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md ${col.bg} ${col.color} border ${col.border}`}>
                            {col.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawer */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md relative shadow-xl" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-gray-900">New Task</h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 hover:bg-gray-100 cursor-pointer text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Task Title</label>
                  <input 
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {!projectId && (
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Project</label>
                    <select 
                      value={newProjectId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Assign To</label>
                    <select 
                      value={newAssigneeId}
                      onChange={e => setNewAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.profiles.id} value={m.profiles.id}>
                          {m.profiles.full_name || m.profiles.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Due Date</label>
                    <input 
                      type="date"
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Priority</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as Priority)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 mb-1.5 block">Status</label>
                    <select 
                      value={addStatus}
                      onChange={e => setAddStatus(e.target.value as Status)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button 
                    disabled={submitting || !newTitle.trim() || !newProjectId}
                    onClick={handleCreateTask}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold cursor-pointer disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-sm border-0"
                  >
                    {submitting ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {openTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenTask(null)} className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[120]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-white border-l border-gray-200 z-[121] shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: openTask.projectColor }} />
                  <span className="text-[13px] font-semibold text-gray-700">{openTask.project}</span>
                </div>
                <button onClick={() => setOpenTask(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer border-0">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <h2 className="text-[20px] font-bold text-gray-900 leading-snug">{openTask.title}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Priority</p>
                    <div className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-md ${PRIORITY_CONFIG[openTask.priority]?.bg} ${PRIORITY_CONFIG[openTask.priority]?.color}`}>
                      {PRIORITY_CONFIG[openTask.priority]?.icon} {PRIORITY_CONFIG[openTask.priority]?.label}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Assignee</p>
                    <div className="flex items-center gap-2">
                      <Avatar 
                        url={openTask.avatar_url} 
                        name={openTask.assignee} 
                        email={openTask.email}
                        size={24} 
                        fallbackColor={openTask.assigneeColor} 
                      />
                      <span className="text-[13px] font-medium text-gray-900">{openTask.assignee}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Status</p>
                    <select 
                      value={openTask.status}
                      onChange={(e) => handleUpdateStatus(openTask.id, e.target.value as Status)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-900 outline-none cursor-pointer hover:bg-gray-100 transition-colors appearance-none"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Due Date</p>
                    <input 
                      type="date"
                      value={openTask.dueDate || ""}
                      onChange={(e) => handleUpdateDueDate(openTask.id, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-900 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                    />
                  </div>
                </div>

                {openTask.stalled && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-[14px] font-bold text-red-800">Stalled Task</p>
                        <p className="text-[12.5px] text-red-600 mt-1 mb-3">No progress in over 3 days. Might need attention.</p>
                        <button className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold shadow-sm hover:bg-red-700 transition-colors cursor-pointer border-0">
                          Follow Up
                        </button>
                      </div>
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

function TaskCardInternal({ task, onOpen, index }: { task: Task; onOpen: (t: Task) => void; index: number }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isDone = task.status === "done";
  
  return (
    <motion.div
      layout
      layoutId={task.id}
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      onClick={() => onOpen(task)}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer select-none transition-all relative overflow-hidden group shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: task.projectColor }} />
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider truncate max-w-[140px]">{task.project}</span>
        </div>
        {task.stalled && (
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
            Stalled
          </span>
        )}
      </div>

      <p className={`text-[13.5px] font-semibold leading-relaxed mb-4 ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
        {task.title}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${p.bg} ${p.color}`}>
            {p.icon} {p.label}
          </span>
          {task.dueDate && <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
        </div>
        <Avatar 
          url={task.avatar_url} 
          name={task.assignee} 
          email={task.email}
          size={24} 
          fallbackColor={task.assigneeColor}
        />
      </div>
    </motion.div>
  );
}
