"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, color: string) => Promise<void>;
}

export default function CreateProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [loading, setLoading]     = useState(false);

  const valid = name.trim().length > 0;

  async function handleSubmit() {
    if (!valid || loading) return;
    setLoading(true);
    await onCreate(name.trim(), description.trim(), accent);
    setLoading(false);
    setName("");
    setDesc("");
    setAccent("#4F46E5");
  }

  function handleClose() {
    if (loading) return;
    setName("");
    setDesc("");
    setAccent("#4F46E5");
    onClose();
  }

  /* Refined, modern SaaS accent colours */
  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const [accent, setAccent] = useState("#4F46E5");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#09090B]/40 z-[200] backdrop-blur-[4px]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none p-4"
          >
            <div
              className="w-full max-w-[480px] bg-white rounded-[24px] overflow-hidden pointer-events-auto border border-white/20"
              style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)" }}
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-6 relative">
                <motion.button
                  whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.04)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </motion.button>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/50 flex items-center justify-center mb-5 border border-indigo-100/50">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21V9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Start a new project
                </h2>
                <p className="text-[14px] text-gray-500 mt-1.5 font-medium">
                  Organize your tasks, teammates, and timelines.
                </p>
              </div>

              {/* Body */}
              <div className="px-8 space-y-6 pb-8">

                {/* Project name */}
                <div>
                  <label className="text-[12px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">
                    Project name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="e.g. Q3 Marketing Launch"
                    maxLength={60}
                    autoFocus
                    className="w-full px-4 py-3.5 text-[14px] font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[12px] font-bold text-gray-700 mb-2 flex items-center justify-between uppercase tracking-wider">
                    Description
                    <span className="text-gray-400 font-semibold text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">OPTIONAL</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="What's the goal of this project?"
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 text-[14px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl outline-none transition-all resize-none placeholder:text-gray-400"
                  />
                </div>

                {/* Accent colour */}
                <div>
                  <label className="text-[12px] font-bold text-gray-700 mb-3 block uppercase tracking-wider">
                    Theme Color
                  </label>
                  <div className="flex gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAccent(c)}
                        className="relative w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        style={{ background: c }}
                      >
                        {accent === c && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.3, opacity: 1 }}
                            className="absolute inset-0 rounded-full"
                            style={{ border: `2px solid ${c}` }}
                          />
                        )}
                        {accent === c && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="z-10 relative">
                            <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-8 py-5 bg-gray-50/80 border-t border-gray-100">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-[14px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-xl border-0 bg-transparent cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!valid || loading}
                  className="relative px-6 py-2.5 rounded-xl text-[14px] font-bold text-white border-0 overflow-hidden group disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                  style={{ background: valid ? accent : "#9CA3AF" }}
                >
                  <div className="flex items-center gap-2 relative z-10">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Project
                      </>
                    )}
                  </div>
                  {/* Hover effect overlay */}
                  {valid && (
                    <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}