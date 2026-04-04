"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, X, Loader2, AlertCircle } from "lucide-react";
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
  { id: "todo", label: "TO DO", color: "#000", bg: "#FFFFFF" },
  { id: "in_progress", label: "ACTIVE", color: "#000", bg: "#A259FF" },
  { id: "review", label: "IN REVIEW", color: "#000", bg: "#FF6B6B" },
  { id: "done", label: "DONE", color: "#000", bg: "#2EB67D" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  high: { label: "HIGH", color: "#000", bg: "#FF6B6B", icon: "↑" },
  medium: { label: "MED", color: "#000", bg: "#ECB22E", icon: "→" },
  low: { label: "LOW", color: "#000", bg: "#36C5F0", icon: "↓" },
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
    <div className="flex flex-col h-full min-h-0 relative text-black">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.04 }} />

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={16} strokeWidth={3} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="SEARCH..."
              className="pl-10 pr-4 py-2 border-2 border-black bg-white text-[13px] font-[900] text-black placeholder:text-black/40 outline-none w-[220px] shadow-[3px_3px_0px_#000] focus:shadow-[5px_5px_0px_#000] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all uppercase"
            />
          </div>

          {!projectId && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-4 py-2 border-2 border-black bg-[#A259FF] text-white text-[13px] font-[900] outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#000] transition-all min-w-[140px] uppercase block appearance-none"
            >
              <option value="All projects">ALL PROJECTS</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}

          <select
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            className="px-4 py-2 border-2 border-black bg-[#ECB22E] text-black text-[13px] font-[900] outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#000] transition-all min-w-[140px] uppercase appearance-none"
          >
            <option value="all">EVERYONE</option>
            {members.map(m => (
              <option key={m.profiles.id} value={m.profiles.id}>
                {m.profiles.full_name || m.profiles.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
            {(["board", "list"] as const).map((v, i) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 text-[12px] font-[900] uppercase transition-all border-0 cursor-pointer ${
                  viewMode === v ? "bg-black text-white" : "bg-transparent text-black hover:bg-black/5"
                } ${i === 0 ? "border-r-2 border-black" : ""}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAddStatus("todo"); setShowAddModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-[#36C5F0] text-black border-2 border-black text-[13px] font-[900] cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000] transition-all uppercase"
          >
            <Plus size={16} strokeWidth={3} /> NEW TASK
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 min-w-0 relative z-10">
        {viewMode === "board" ? (
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide h-full">
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="flex flex-col w-[320px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-4 border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-black" style={{ background: col.bg === "#FFFFFF" ? "#000" : col.bg }} />
                      <span className="text-[14px] font-[900] text-black tracking-widest">{col.label}</span>
                    </div>
                    <span className="w-7 h-7 flex items-center justify-center bg-black text-white border-2 border-black text-[12px] font-[900] rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
                    {colTasks.map((t, i) => (
                      <TaskCardInternal key={t.id} task={t} onOpen={setOpenTask} index={i} />
                    ))}
                    <button 
                      onClick={() => { setAddStatus(col.id); setShowAddModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-black bg-black/5 hover:bg-black/10 text-black transition-all cursor-pointer font-[900] uppercase text-[12px] tracking-widest"
                    >
                      <Plus size={16} strokeWidth={3} /> ADD TASK
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-black overflow-hidden shadow-[6px_6px_0px_#000] h-full overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white sticky top-0 z-10">
                  <th className="px-6 py-4 text-[12px] font-[900] uppercase tracking-widest border-b-2 border-black border-r-2 border-white/20">Task</th>
                  {!projectId && <th className="px-6 py-4 text-[12px] font-[900] uppercase tracking-widest border-b-2 border-black border-r-2 border-white/20">Project</th>}
                  <th className="px-6 py-4 text-[12px] font-[900] uppercase tracking-widest border-b-2 border-black border-r-2 border-white/20">Assignee</th>
                  <th className="px-6 py-4 text-[12px] font-[900] uppercase tracking-widest border-b-2 border-black border-r-2 border-white/20">Priority</th>
                  <th className="px-6 py-4 text-[12px] font-[900] uppercase tracking-widest border-b-2 border-black">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  const col = COLUMNS.find(c => c.id === t.status) || COLUMNS[0];
                  return (
                    <tr key={t.id} onClick={() => setOpenTask(t)} className={`cursor-pointer group hover:bg-black/5 ${i !== filtered.length-1 ? 'border-b-2 border-black' : ''}`}>
                      <td className="px-6 py-4 border-r-2 border-black">
                        <p className={`text-[14px] font-[900] text-black uppercase ${t.status === 'done' ? 'line-through opacity-40' : ''}`}>{t.title}</p>
                      </td>
                      {!projectId && (
                        <td className="px-6 py-4 border-r-2 border-black">
                          <span className="text-[12px] font-[900] text-black uppercase">{t.project}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 border-r-2 border-black">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            url={t.avatar_url} 
                            name={t.assignee} 
                            email={t.email}
                            size={28} 
                            fallbackColor={t.assigneeColor} 
                            className="border-2 border-black"
                          />
                          <span className="text-[13px] font-[900] text-black uppercase">{t.assignee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r-2 border-black">
                        <span className="text-[11px] font-[900] px-3 py-1 border-2 border-black" style={{ background: p.bg, color: p.color }}>
                          {p.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-[900] px-3 py-1 border-2 border-black text-white" style={{ background: col.bg === "#FFFFFF" ? "#000" : col.bg }}>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
              className="bg-[#F9F9F7] border-4 border-black p-7 w-full max-w-lg relative shadow-[10px_10px_0px_#000]" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] font-[900] text-black uppercase tracking-tighter">NEW TASK</h2>
                <button onClick={() => setShowAddModal(false)} className="bg-transparent border-0 cursor-pointer text-black/40 hover:text-black mt-1">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-[900] uppercase tracking-widest text-black mb-1.5 block">Task Title</label>
                  <input 
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="WHAT NEEDS TO BE DONE?"
                    className="w-full px-4 py-3 bg-white border-2 border-black text-[13px] font-[900] text-black placeholder:text-black/30 outline-none shadow-[3px_3px_0px_#000] focus:shadow-[5px_5px_0px_#000] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all uppercase"
                  />
                </div>

                {!projectId && (
                  <div>
                    <label className="text-[11px] font-[900] uppercase tracking-widest text-black mb-1.5 block">Project</label>
                    <select 
                      value={newProjectId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-black text-[13px] font-[900] text-black outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase appearance-none"
                    >
                      <option value="">SELECT PROJECT</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-[900] uppercase tracking-widest text-black mb-1.5 block">Assign To</label>
                    <select 
                      value={newAssigneeId}
                      onChange={e => setNewAssigneeId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FF6B6B] border-2 border-black text-[13px] font-[900] text-black outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase appearance-none"
                    >
                      <option value="">UNASSIGNED</option>
                      {members.map(m => (
                        <option key={m.profiles.id} value={m.profiles.id}>
                          {m.profiles.full_name || m.profiles.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-[900] uppercase tracking-widest text-black mb-1.5 block">Due Date</label>
                    <input 
                      type="date"
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-black text-[13px] font-[900] text-black outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-[900] uppercase tracking-widest text-black mb-1.5 block">Priority</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as Priority)}
                      className="w-full px-4 py-3 bg-[#ECB22E] border-2 border-black text-[13px] font-[900] text-black outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase appearance-none"
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-[900] uppercase tracking-widest text-black mb-1.5 block">Status</label>
                    <select 
                      value={addStatus}
                      onChange={e => setAddStatus(e.target.value as Status)}
                      className="w-full px-4 py-3 bg-[#36C5F0] border-2 border-black text-[13px] font-[900] text-black outline-none cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase appearance-none"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-3">
                  <button 
                    disabled={submitting || !newTitle.trim() || !newProjectId}
                    onClick={handleCreateTask}
                    className="flex-1 py-3.5 bg-black text-white border-2 border-black text-[14px] font-[900] cursor-pointer disabled:opacity-50 shadow-[4px_4px_0px_#A259FF] hover:shadow-[6px_6px_0px_#A259FF] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#A259FF] transition-all uppercase"
                  >
                    {submitting ? "CREATING..." : "CREATE TASK"}
                  </button>
                  <button onClick={() => setShowAddModal(false)} className="px-6 py-3.5 bg-white text-black border-2 border-black text-[14px] font-[900] cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000] transition-all uppercase text-[12px]">CANCEL</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {openTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenTask(null)} className="fixed inset-0 bg-white/60 backdrop-blur-[4px] z-[120]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-[#F9F9F7] border-l-4 border-black z-[121] shadow-[-12px_0px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="px-8 py-6 border-b-4 border-black bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black" style={{ background: openTask.projectColor }} />
                  <span className="text-[14px] font-[900] uppercase tracking-widest text-black">{openTask.project}</span>
                </div>
                <button onClick={() => setOpenTask(null)} className="flex items-center justify-center p-2 bg-black text-white border-2 border-black shadow-[2px_2px_0px_#ECB22E] hover:shadow-[4px_4px_0px_#ECB22E] hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000] transition-all cursor-pointer">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <h2 className="text-[28px] font-[900] text-black leading-[1.1] tracking-tighter uppercase">{openTask.title}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
                    <p className="text-[11px] font-[900] uppercase tracking-widest text-black/50 mb-2">PRIORITY</p>
                    <div className="inline-flex items-center gap-2 text-[13px] font-[900] px-3 py-1.5 border-2 border-black" style={{ background: PRIORITY_CONFIG[openTask.priority]?.bg, color: PRIORITY_CONFIG[openTask.priority]?.color }}>
                      {PRIORITY_CONFIG[openTask.priority]?.icon} {PRIORITY_CONFIG[openTask.priority]?.label.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-[#A259FF] border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
                    <p className="text-[11px] font-[900] uppercase tracking-widest text-white/70 mb-2">ASSIGNEE</p>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        url={openTask.avatar_url} 
                        name={openTask.assignee} 
                        email={openTask.email}
                        size={32} 
                        fallbackColor={openTask.assigneeColor} 
                        className="border-2 border-black bg-white shadow-[2px_2px_0px_#000]"
                      />
                      <span className="text-[14px] font-[900] text-white uppercase">{openTask.assignee}</span>
                    </div>
                  </div>
                  <div className="col-span-2 bg-[#36C5F0] border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
                    <p className="text-[12px] font-[900] uppercase tracking-widest text-black/60 mb-3">STATUS</p>
                    <select 
                      value={openTask.status}
                      onChange={(e) => handleUpdateStatus(openTask.id, e.target.value as Status)}
                      className="w-full px-4 py-3 bg-white border-2 border-black text-[16px] font-[900] text-black outline-none cursor-pointer shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase appearance-none"
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000]">
                    <p className="text-[12px] font-[900] uppercase tracking-widest text-black/50 mb-3">DUE DATE</p>
                    <input 
                      type="date"
                      value={openTask.dueDate || ""}
                      onChange={(e) => handleUpdateDueDate(openTask.id, e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-black text-[14px] font-[900] text-black outline-none cursor-pointer shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all uppercase"
                    />
                  </div>
                </div>

                {openTask.stalled && (
                  <div className="bg-[#FF6B6B] border-2 border-black p-6 shadow-[6px_6px_0px_#000]">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="text-black flex-shrink-0" size={32} strokeWidth={2.5} />
                      <div>
                        <p className="text-[20px] font-[900] text-black uppercase tracking-tight">BLOCKED TASK</p>
                        <p className="text-[14px] text-black font-[700] mt-2 mb-6 uppercase leading-snug">NO PROGRESS IN 4 DAYS. TIME TO PUSH IT.</p>
                        <button className="px-6 py-3 bg-white text-black border-2 border-black text-[14px] font-[900] cursor-pointer shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_#000] transition-all uppercase tracking-widest">
                          BULLDOZE
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
  
  // Random rotation for neobrutalist sketchy feel
  const rotation = index % 3 === 0 ? "1deg" : index % 3 === 1 ? "-1deg" : "0deg";

  return (
    <motion.div
      layout
      layoutId={task.id}
      whileHover={{ scale: 1.02, rotate: "0deg", boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)", x: -2, y: -2 }}
      onClick={() => onOpen(task)}
      className="bg-white border-2 border-black p-4 cursor-pointer select-none transition-all relative overflow-hidden group"
      style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)", rotate: rotation }}
    >
      <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 -rotate-45 translate-x-4 -translate-y-4 group-hover:bg-[#36C5F0] transition-colors" />

      <div className="flex items-start justify-between gap-2 mb-4 relative z-10">
        <div className="flex items-center gap-2 min-w-0 bg-black/5 px-2 py-1 border border-black/10">
          <div className="w-2.5 h-2.5 rounded-full border border-black shadow-[1px_1px_0px_#000]" style={{ background: task.projectColor }} />
          <span className="text-[10px] font-[900] text-black uppercase tracking-widest truncate">{task.project}</span>
        </div>
        {task.stalled && (
          <span className="text-[10px] font-[900] tracking-widest text-black bg-[#FF6B6B] px-2 py-1 border-2 border-black shadow-[2px_2px_0px_#000]">
            STALLED
          </span>
        )}
      </div>

      <p className={`text-[16px] font-[900] leading-snug mb-5 uppercase tracking-tight ${isDone ? "line-through opacity-40" : "text-black"}`}>
        {task.title}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-[900] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000]" style={{ background: p.bg, color: p.color }}>
            {p.icon} {p.label}
          </span>
          {task.dueDate && <span className="text-[11px] text-black font-[900] uppercase bg-black/5 px-2 py-1 border border-black/10">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
        </div>
        <Avatar 
          url={task.avatar_url} 
          name={task.assignee} 
          email={task.email}
          size={28} 
          fallbackColor={task.assigneeColor}
          className="border-2 border-black bg-white shadow-[2px_2px_0px_#000]" 
        />
      </div>
    </motion.div>
  );
}
