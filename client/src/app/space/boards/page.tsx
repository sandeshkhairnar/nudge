"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

/* ═══════════════════════════
   TYPES
═══════════════════════════ */
type Priority = "high" | "medium" | "low";
type Status   = "todo" | "in-progress" | "review" | "done";

interface Task {
  id: string;
  title: string;
  project: string;
  projectColor: string;
  assignee: string;
  assigneeColor: string;
  priority: Priority;
  dueDate: string;
  tags: string[];
  stalled?: boolean;
  subtasks?: { done: number; total: number };
}

interface Column {
  id: Status;
  label: string;
  color: string;
  bg: string;
}

/* ═══════════════════════════
   STATIC DATA
═══════════════════════════ */
const COLUMNS: Column[] = [
  { id: "todo",        label: "To Do",       color: "#9CA3AF", bg: "#F5F5F2" },
  { id: "in-progress", label: "In Progress", color: "#36C5F0", bg: "#EFF9FE" },
  { id: "review",      label: "Review",      color: "#ECB22E", bg: "#FFFBEB" },
  { id: "done",        label: "Done",        color: "#2EB67D", bg: "#ECFDF5" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  high:   { label: "High",   color: "#E01E5A", bg: "#FEF2F6", icon: "▲" },
  medium: { label: "Medium", color: "#ECB22E", bg: "#FFFBEB", icon: "■" },
  low:    { label: "Low",    color: "#9CA3AF", bg: "#F5F5F2", icon: "▼" },
};

const INITIAL_TASKS: Record<Status, Task[]> = {
  todo: [
    {
      id: "t1", title: "Onboarding flow v2 — redesign welcome screen",
      project: "Q3 Launch", projectColor: "#36C5F0",
      assignee: "AM", assigneeColor: "#36C5F0",
      priority: "high", dueDate: "Mar 10",
      tags: ["Design", "UX"],
      subtasks: { done: 0, total: 4 },
    },
    {
      id: "t2", title: "Write API documentation for auth endpoints",
      project: "API v2", projectColor: "#E01E5A",
      assignee: "S", assigneeColor: "#E01E5A",
      priority: "medium", dueDate: "Mar 14",
      tags: ["Docs"],
      subtasks: { done: 1, total: 3 },
    },
    {
      id: "t3", title: "Mobile nav fix — iOS Safari overflow",
      project: "Q3 Launch", projectColor: "#36C5F0",
      assignee: "TR", assigneeColor: "#2EB67D",
      priority: "low", dueDate: "Mar 18",
      tags: ["Bug", "Mobile"],
    },
  ],
  "in-progress": [
    {
      id: "t4", title: "API rate limiting — implement per-user quotas",
      project: "API v2", projectColor: "#E01E5A",
      assignee: "TR", assigneeColor: "#2EB67D",
      priority: "high", dueDate: "Mar 8",
      tags: ["Backend"],
      stalled: true,
      subtasks: { done: 2, total: 5 },
    },
    {
      id: "t5", title: "Design tokens audit and documentation",
      project: "Design System", projectColor: "#ECB22E",
      assignee: "KJ", assigneeColor: "#ECB22E",
      priority: "medium", dueDate: "Mar 9",
      tags: ["Design"],
      subtasks: { done: 3, total: 4 },
    },
    {
      id: "t6", title: "Dashboard analytics charts integration",
      project: "Q3 Launch", projectColor: "#36C5F0",
      assignee: "S", assigneeColor: "#E01E5A",
      priority: "medium", dueDate: "Mar 11",
      tags: ["Frontend", "Data"],
      subtasks: { done: 1, total: 3 },
    },
  ],
  review: [
    {
      id: "t7", title: "Auth refactor — JWT refresh token flow",
      project: "Auth Refactor", projectColor: "#2EB67D",
      assignee: "TR", assigneeColor: "#2EB67D",
      priority: "high", dueDate: "Mar 7",
      tags: ["Security", "Backend"],
      subtasks: { done: 4, total: 4 },
    },
    {
      id: "t8", title: "PDF export fix — Firefox rendering issue",
      project: "API v2", projectColor: "#E01E5A",
      assignee: "MW", assigneeColor: "#A259FF",
      priority: "medium", dueDate: "Mar 9",
      tags: ["Bug"],
    },
  ],
  done: [
    {
      id: "t9", title: "Login page — design and implementation",
      project: "Q3 Launch", projectColor: "#36C5F0",
      assignee: "S", assigneeColor: "#E01E5A",
      priority: "high", dueDate: "Mar 4",
      tags: ["Frontend"],
      subtasks: { done: 5, total: 5 },
    },
    {
      id: "t10", title: "Signup multi-step flow",
      project: "Q3 Launch", projectColor: "#36C5F0",
      assignee: "AM", assigneeColor: "#36C5F0",
      priority: "medium", dueDate: "Mar 5",
      tags: ["Frontend", "UX"],
      subtasks: { done: 3, total: 3 },
    },
    {
      id: "t11", title: "Sidebar component with collapse",
      project: "Design System", projectColor: "#ECB22E",
      assignee: "PN", assigneeColor: "#FF6B6B",
      priority: "low", dueDate: "Mar 3",
      tags: ["Component"],
    },
  ],
};

const PROJECTS = [
  { name: "All projects", color: "#9CA3AF" },
  { name: "Q3 Launch",    color: "#36C5F0" },
  { name: "API v2",       color: "#E01E5A" },
  { name: "Design System",color: "#ECB22E" },
  { name: "Auth Refactor",color: "#2EB67D" },
];

const MEMBERS = [
  { id: "all",   label: "Everyone" },
  { id: "AM",    label: "Ava M." },
  { id: "TR",    label: "Tomás R." },
  { id: "KJ",    label: "Kira J." },
  { id: "S",     label: "Sandesh" },
  { id: "MW",    label: "Marcus W." },
];

/* ═══════════════════════════
   AVATAR
═══════════════════════════ */
function Av({ i, c, sz = 24 }: { i: string; c: string; sz?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
      style={{ width: sz, height: sz, background: c, fontSize: sz * 0.38 }}
    >
      {i}
    </div>
  );
}

/* ═══════════════════════════
   TASK CARD
═══════════════════════════ */
function TaskCard({
  task,
  columnColor,
  onOpen,
}: {
  task: Task;
  columnColor: string;
  onOpen: (t: Task) => void;
}) {
  const p = PRIORITY_CONFIG[task.priority];
  const isDone = task.id.startsWith("t9") || task.id.startsWith("t10") || task.id.startsWith("t11");

  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.09)" }}
      onClick={() => onOpen(task)}
      className="bg-white rounded-2xl border border-[#EBEBEB] p-4 cursor-pointer select-none"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Project dot + name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.projectColor }} />
          <span className="text-[11px] font-semibold text-[#9CA3AF] truncate">{task.project}</span>
        </div>

        {/* Stalled badge */}
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

      {/* Title */}
      <p className={`text-[13px] font-semibold leading-snug mb-3 ${isDone ? "line-through text-[#C4C4BC]" : "text-[#0D0D0D]"}`}>
        {task.title}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#6B7280]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress */}
      {task.subtasks && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#9CA3AF] font-medium">
              {task.subtasks.done}/{task.subtasks.total} subtasks
            </span>
            <span className="text-[10px] font-bold" style={{ color: columnColor }}>
              {Math.round((task.subtasks.done / task.subtasks.total) * 100)}%
            </span>
          </div>
          <div className="h-1 bg-[#F0F0EB] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(task.subtasks.done / task.subtasks.total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: columnColor }}
            />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: p.bg, color: p.color }}
          >
            {p.icon} {p.label}
          </span>

          {/* Due date */}
          <span className="text-[11px] text-[#C4C4BC] font-medium">{task.dueDate}</span>
        </div>

        {/* Assignee */}
        <Av i={task.assignee} c={task.assigneeColor} sz={24} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════
   COLUMN
═══════════════════════════ */
function BoardColumn({
  col,
  tasks,
  onAddTask,
  onOpenTask,
}: {
  col: Column;
  tasks: Task[];
  onAddTask: (colId: Status) => void;
  onOpenTask: (t: Task) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col w-[300px] flex-shrink-0"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
          <span className="text-[13px] font-black text-[#0D0D0D]">{col.label}</span>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ background: col.bg, color: col.color }}
          >
            {tasks.length}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAddTask(col.id)}
          className="w-6 h-6 rounded-lg bg-white border border-[#EBEBEB] flex items-center justify-center cursor-pointer hover:border-[#C4C4BC] transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      {/* Column top accent line */}
      <div className="h-0.5 rounded-full mb-3 mx-1" style={{ background: col.color }} />

      {/* Cards */}
      <div className="flex flex-col gap-2.5 flex-1 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnColor={col.color}
              onOpen={onOpenTask}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-[#EBEBEB] text-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-[#F5F5F2] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#C4C4BC" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[11px] text-[#C4C4BC] font-semibold">No tasks</p>
          </motion.div>
        )}
      </div>

      {/* Add task bottom */}
      <motion.button
        whileHover={{ background: "#F5F5F2" }}
        onClick={() => onAddTask(col.id)}
        className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#E0E0D8] text-[12px] font-semibold text-[#C4C4BC] hover:text-[#9CA3AF] cursor-pointer transition-colors w-full bg-transparent"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        Add task
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════
   ADD TASK MODAL
═══════════════════════════ */
function AddTaskModal({
  open,
  defaultStatus,
  onClose,
  onAdd,
}: {
  open: boolean;
  defaultStatus: Status;
  onClose: () => void;
  onAdd: (status: Status, task: Omit<Task, "id">) => void;
}) {
  const [title,    setTitle]    = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate,  setDueDate]  = useState("");
  const [project,  setProject]  = useState("Q3 Launch");
  const [status,   setStatus]   = useState<Status>(defaultStatus);
  const [tag,      setTag]      = useState("");
  const [tags,     setTags]     = useState<string[]>([]);
  const [tFocused, setTF]       = useState(false);

  function addTag() {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTag("");
  }

  function submit() {
    if (!title.trim()) return;
    const proj = PROJECTS.find(p => p.name === project);
    onAdd(status, {
      title: title.trim(),
      project,
      projectColor: proj?.color ?? "#9CA3AF",
      assignee: "S",
      assigneeColor: "#E01E5A",
      priority,
      dueDate: dueDate || "TBD",
      tags,
    });
    setTitle(""); setPriority("medium"); setDueDate("");
    setProject("Q3 Launch"); setTags([]); setTag("");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/25 z-[200] backdrop-blur-[2px]"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none"
          >
            <div
              className="w-[480px] bg-white rounded-2xl overflow-hidden pointer-events-auto"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.14)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0EC]">
                <div>
                  <h2 className="text-[15px] font-black text-[#0D0D0D]">New task</h2>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">Add to the board</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-[#F5F5F2] flex items-center justify-center border-0 cursor-pointer text-[#9CA3AF] hover:text-[#374151]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] block mb-1.5">
                    Title *
                  </label>
                  <motion.div
                    animate={{ boxShadow: tFocused ? "0 0 0 2px rgba(54,197,240,0.22)" : "0 0 0 1px #E8E8E2" }}
                    className="rounded-xl overflow-hidden">
                    <input
                      value={title} onChange={e => setTitle(e.target.value)}
                      onFocus={() => setTF(true)} onBlur={() => setTF(false)}
                      onKeyDown={e => e.key === "Enter" && submit()}
                      placeholder="What needs to be done?"
                      autoFocus
                      className="w-full px-4 py-3 text-[14px] font-semibold text-[#0D0D0D] placeholder-[#C4C4BC] bg-white border-0 outline-none"
                    />
                  </motion.div>
                </div>

                {/* Row: Project + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] block mb-1.5">Project</label>
                    <select value={project} onChange={e => setProject(e.target.value)}
                      className="w-full px-3 py-2.5 text-[13px] font-semibold text-[#374151] bg-[#F9F9F7] border border-[#E8E8E2] rounded-xl outline-none cursor-pointer">
                      {PROJECTS.filter(p => p.name !== "All projects").map(p => (
                        <option key={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] block mb-1.5">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as Status)}
                      className="w-full px-3 py-2.5 text-[13px] font-semibold text-[#374151] bg-[#F9F9F7] border border-[#E8E8E2] rounded-xl outline-none cursor-pointer">
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row: Priority + Due date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] block mb-1.5">Priority</label>
                    <div className="flex gap-1.5">
                      {(["high","medium","low"] as Priority[]).map(pr => {
                        const cfg = PRIORITY_CONFIG[pr];
                        return (
                          <motion.button key={pr} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setPriority(pr)}
                            className="flex-1 py-2 rounded-xl text-[11px] font-black border cursor-pointer transition-all"
                            style={{
                              background: priority === pr ? cfg.color : cfg.bg,
                              color: priority === pr ? "#fff" : cfg.color,
                              borderColor: priority === pr ? cfg.color : "transparent",
                            }}>
                            {cfg.icon}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] block mb-1.5">Due date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-[13px] font-semibold text-[#374151] bg-[#F9F9F7] border border-[#E8E8E2] rounded-xl outline-none cursor-pointer" />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] block mb-1.5">Tags</label>
                  <div className="flex gap-2">
                    <input value={tag} onChange={e => setTag(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag, press Enter…"
                      className="flex-1 px-3 py-2 text-[13px] font-medium bg-[#F9F9F7] border border-[#E8E8E2] rounded-xl outline-none focus:border-[#36C5F0] placeholder-[#C4C4BC]" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addTag}
                      className="px-3.5 py-2 bg-[#F5F5F2] border border-[#E8E8E2] rounded-xl text-[12px] font-bold text-[#9CA3AF] hover:text-[#374151] cursor-pointer">
                      Add
                    </motion.button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map(t => (
                        <motion.span key={t} initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="flex items-center gap-1 text-[11px] font-bold bg-[#F5F5F2] text-[#6B7280] px-2.5 py-1 rounded-full">
                          {t}
                          <button onClick={() => setTags(p => p.filter(x => x !== t))}
                            className="text-[#C4C4BC] hover:text-[#E01E5A] border-0 bg-transparent cursor-pointer leading-none">×</button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0F0EC] bg-[#FAFAF8]">
                <button onClick={onClose} className="text-[13px] font-semibold text-[#9CA3AF] hover:text-[#6B7280] border-0 bg-transparent cursor-pointer">
                  Cancel
                </button>
                <motion.button
                  whileHover={title.trim() ? { y: -1, boxShadow: "0 6px 20px rgba(0,0,0,0.18)" } : {}}
                  whileTap={title.trim() ? { scale: 0.97 } : {}}
                  onClick={submit}
                  className="h-9 px-5 rounded-xl text-[13px] font-black text-white border-0 flex items-center gap-2 cursor-pointer"
                  style={{
                    background: title.trim() ? "#0D0D0D" : "#E5E7EB",
                    color: title.trim() ? "#fff" : "#9CA3AF",
                    cursor: title.trim() ? "pointer" : "not-allowed",
                    boxShadow: title.trim() ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  }}>
                  Add task →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════
   TASK DETAIL DRAWER
═══════════════════════════ */
function TaskDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [comment, setComment] = useState("");

  if (!task) return null;
  const p = PRIORITY_CONFIG[task.priority];
  const col = COLUMNS.find(c => c.id === (
    task.stalled ? "in-progress" : task.subtasks?.done === task.subtasks?.total ? "done" : "in-progress"
  )) ?? COLUMNS[0];

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            key="drawer-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[180]"
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-[420px] bg-white z-[181] flex flex-col"
            style={{ boxShadow: "-12px 0 48px rgba(0,0,0,0.1)" }}
          >
            {/* Drawer header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-[#F0F0EC] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: task.projectColor }} />
                <span className="text-[12px] font-semibold text-[#9CA3AF] truncate">{task.project}</span>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[#F5F5F2] flex items-center justify-center border-0 cursor-pointer text-[#9CA3AF] flex-shrink-0 ml-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Title */}
              <h2 className="text-[17px] font-black text-[#0D0D0D] leading-snug tracking-[-0.02em]">
                {task.title}
              </h2>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Priority",  value: <span className="text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: p.bg, color: p.color }}>{p.icon} {p.label}</span> },
                  { label: "Due date",  value: <span className="text-[13px] font-semibold text-[#374151]">{task.dueDate}</span> },
                  { label: "Assignee",  value: <div className="flex items-center gap-2"><Av i={task.assignee} c={task.assigneeColor} sz={22} /><span className="text-[12px] font-semibold text-[#374151]">{task.assignee}</span></div> },
                  { label: "Status",    value: <span className="text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: col.bg, color: col.color }}>{col.label}</span> },
                ].map((item, i) => (
                  <div key={i} className="bg-[#F9F9F7] rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C4C4BC] mb-1.5">{item.label}</p>
                    {item.value}
                  </div>
                ))}
              </div>

              {/* Stalled alert */}
              {task.stalled && (
                <motion.div
                  animate={{ borderColor: ["#ECB22E", "#E01E5A", "#ECB22E"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[18px]">⚡</span>
                  <div>
                    <p className="text-[12px] font-black text-amber-800">Task is stalled</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">This task has had no activity for 6 days. Nudge the assignee?</p>
                    <motion.button whileHover={{ y: -1 }} className="mt-2 text-[11px] font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border-0 cursor-pointer">
                      Send nudge →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C4C4BC] mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map(tag => (
                      <span key={tag} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F5F5F2] text-[#6B7280]">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {task.subtasks && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C4C4BC]">Subtasks</p>
                    <span className="text-[11px] font-bold text-[#9CA3AF]">{task.subtasks.done}/{task.subtasks.total}</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F0EB] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(task.subtasks.done / task.subtasks.total) * 100}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[#2EB67D]"
                    />
                  </div>
                </div>
              )}

              {/* Activity / comment */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#C4C4BC] mb-3">Activity</p>
                <div className="flex gap-2.5">
                  <Av i="S" c="#E01E5A" sz={26} />
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Leave a comment…"
                        className="flex-1 text-[13px] font-medium bg-[#F9F9F7] border border-[#E8E8E2] rounded-xl px-3 py-2 outline-none focus:border-[#36C5F0] placeholder-[#C4C4BC]"
                      />
                      <motion.button
                        whileHover={comment.trim() ? { scale: 1.05 } : {}}
                        whileTap={comment.trim() ? { scale: 0.95 } : {}}
                        onClick={() => setComment("")}
                        className="px-3.5 py-2 rounded-xl text-[12px] font-black border-0 cursor-pointer"
                        style={{
                          background: comment.trim() ? "#0D0D0D" : "#F0F0EB",
                          color: comment.trim() ? "#fff" : "#C4C4BC",
                        }}>
                        Send
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════
   PAGE
═══════════════════════════ */
export default function BoardsPage() {
  const [tasks,       setTasks]       = useState(INITIAL_TASKS);
  const [filter,      setFilter]      = useState("All projects");
  const [memberFilter,setMemberFilter]= useState("all");
  const [viewMode,    setViewMode]    = useState<"board" | "list">("board");
  const [addModal,    setAddModal]    = useState(false);
  const [addStatus,   setAddStatus]   = useState<Status>("todo");
  const [openTask,    setOpenTask]    = useState<Task | null>(null);
  const [search,      setSearch]      = useState("");

  /* Filtered tasks */
  const allTasks = Object.values(tasks).flat();
  const filtered = (colTasks: Task[]) =>
    colTasks.filter(t => {
      const matchProject = filter === "All projects" || t.project === filter;
      const matchMember  = memberFilter === "all" || t.assignee === memberFilter;
      const matchSearch  = !search || t.title.toLowerCase().includes(search.toLowerCase());
      return matchProject && matchMember && matchSearch;
    });

  function handleAddTask(status: Status, task: Omit<Task, "id">) {
    const newTask: Task = { ...task, id: `t${Date.now()}` };
    setTasks(p => ({ ...p, [status]: [...p[status], newTask] }));
    setAddModal(false);
  }

  function openAddModal(colId: Status) {
    setAddStatus(colId);
    setAddModal(true);
  }

  /* Stats */
  const totalTasks   = allTasks.length;
  const stalledCount = allTasks.filter(t => t.stalled).length;
  const doneCount    = tasks.done.length;
  const inProgCount  = tasks["in-progress"].length;

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-black text-[#0D0D0D] tracking-[-0.025em] mb-1">Boards</h1>
          <p className="text-[13px] text-[#9CA3AF] font-medium">
            {totalTasks} tasks · {inProgCount} in progress · {doneCount} done
            {stalledCount > 0 && <span className="ml-2 text-amber-500 font-bold">· ⚡ {stalledCount} stalled</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-white border border-[#EBEBEB] rounded-xl p-1 gap-1">
            {(["board","list"] as const).map(v => (
              <motion.button key={v} onClick={() => setViewMode(v)}
                className="relative px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer border-0 transition-colors"
                style={{ color: viewMode === v ? "#0D0D0D" : "#9CA3AF", background: "transparent" }}>
                {viewMode === v && (
                  <motion.div layoutId="view-bg"
                    className="absolute inset-0 bg-[#F5F5F2] rounded-lg" />
                )}
                <span className="relative capitalize">{v}</span>
              </motion.button>
            ))}
          </div>

          {/* Add task */}
          <motion.button
            whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openAddModal("todo")}
            className="h-9 px-4 bg-[#0D0D0D] text-white rounded-xl text-[13px] font-black flex items-center gap-1.5 border-0 cursor-pointer"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Add task
          </motion.button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#EBEBEB] rounded-xl px-3 h-9">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#C4C4BC" strokeWidth="1.8"/>
            <path d="M20 20l-3-3" stroke="#C4C4BC" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="bg-transparent border-0 outline-none text-[13px] font-medium text-[#0D0D0D] w-36 placeholder-[#C4C4BC]" />
        </div>

        {/* Project filter */}
        <div className="flex gap-1.5 flex-wrap">
          {PROJECTS.map(p => (
            <motion.button key={p.name} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(p.name)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
              style={{
                background: filter === p.name ? "#0D0D0D" : "white",
                color: filter === p.name ? "#fff" : "#6B7280",
                borderColor: filter === p.name ? "#0D0D0D" : "#EBEBEB",
              }}>
              {p.name !== "All projects" && (
                <div className="w-2 h-2 rounded-full" style={{ background: filter === p.name ? "#fff" : p.color }} />
              )}
              {p.name}
            </motion.button>
          ))}
        </div>

        {/* Member filter */}
        <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)}
          className="h-9 px-3 bg-white border border-[#EBEBEB] rounded-xl text-[12px] font-semibold text-[#6B7280] outline-none cursor-pointer">
          {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* ── BOARD VIEW ── */}
      {viewMode === "board" && (
        <div className="flex gap-5 overflow-x-auto pb-4 flex-1" style={{ scrollbarWidth: "thin" }}>
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              col={col}
              tasks={filtered(tasks[col.id])}
              onAddTask={openAddModal}
              onOpenTask={setOpenTask}
            />
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto space-y-6">
          {COLUMNS.map(col => {
            const colTasks = filtered(tasks[col.id]);
            if (colTasks.length === 0) return null;
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="text-[13px] font-black text-[#0D0D0D]">{col.label}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: col.bg, color: col.color }}>{colTasks.length}</span>
                </div>
                <div className="space-y-1.5">
                  {colTasks.map((task, i) => {
                    const p = PRIORITY_CONFIG[task.priority];
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ x: 2 }}
                        onClick={() => setOpenTask(task)}
                        className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-[#EBEBEB] hover:border-[#D0D0C8] hover:shadow-sm cursor-pointer transition-all">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                        <p className="flex-1 text-[13px] font-semibold text-[#0D0D0D] truncate">{task.title}</p>
                        {task.stalled && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⚡ Stalled</span>}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F2] text-[#9CA3AF]">{tag}</span>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{ background: p.bg, color: p.color }}>{p.icon} {p.label}</span>
                        <span className="text-[11px] text-[#C4C4BC] flex-shrink-0">{task.dueDate}</span>
                        <Av i={task.assignee} c={task.assigneeColor} sz={24} />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddTaskModal
        open={addModal}
        defaultStatus={addStatus}
        onClose={() => setAddModal(false)}
        onAdd={handleAddTask}
      />

      <TaskDrawer task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  );
}