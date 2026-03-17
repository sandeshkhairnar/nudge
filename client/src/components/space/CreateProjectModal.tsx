"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export default function CreateProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [loading, setLoading]     = useState(false);
  const [nameFocused, setNF]      = useState(false);
  const [descFocused, setDF]      = useState(false);

  const valid = name.trim().length > 0;

  async function handleSubmit() {
    if (!valid || loading) return;
    setLoading(true);
    await onCreate(name.trim(), description.trim());
    setLoading(false);
    setName("");
    setDesc("");
  }

  function handleClose() {
    if (loading) return;
    setName("");
    setDesc("");
    onClose();
  }

  /* Accent colours to pick from */
  const COLORS = ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#FF6B6B"];
  const [accent, setAccent] = useState("#36C5F0");

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
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 z-[200] backdrop-blur-[2px]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none"
          >
            <div
              className="w-[460px] bg-white rounded-2xl overflow-hidden pointer-events-auto"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F0EC]">
                <div>
                  <h2 className="text-[16px] font-black text-[#0D0D0D] tracking-[-0.02em]">
                    New project
                  </h2>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                    Set up a workspace for your team
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, background: "#F5F5F2" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] border-0 bg-transparent cursor-pointer transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">

                {/* Project name */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF] block mb-2">
                    Project name <span className="text-[#E01E5A]">*</span>
                  </label>
                  <motion.div
                    animate={{
                      boxShadow: nameFocused
                        ? "0 0 0 2px rgba(54,197,240,0.25)"
                        : "0 0 0 1px #E8E8E2",
                    }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl overflow-hidden"
                  >
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setNF(true)}
                      onBlur={() => setNF(false)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="e.g. Q3 Launch, API v2…"
                      maxLength={60}
                      autoFocus
                      className="w-full px-4 py-3 text-[14px] font-semibold text-[#0D0D0D] bg-white border-0 outline-none placeholder-[#C4C4BC]"
                    />
                  </motion.div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF] block mb-2">
                    Description <span className="text-[#C4C4BC] font-medium normal-case tracking-normal">optional</span>
                  </label>
                  <motion.div
                    animate={{
                      boxShadow: descFocused
                        ? "0 0 0 2px rgba(54,197,240,0.25)"
                        : "0 0 0 1px #E8E8E2",
                    }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl overflow-hidden"
                  >
                    <textarea
                      value={description}
                      onChange={(e) => setDesc(e.target.value)}
                      onFocus={() => setDF(true)}
                      onBlur={() => setDF(false)}
                      placeholder="What is this project about?"
                      rows={3}
                      maxLength={200}
                      className="w-full px-4 py-3 text-[13px] font-medium text-[#374151] bg-white border-0 outline-none resize-none placeholder-[#C4C4BC]"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    />
                  </motion.div>
                  <p className="text-[11px] text-[#C4C4BC] text-right mt-1">
                    {description.length}/200
                  </p>
                </div>

                {/* Accent colour */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.1em] text-[#9CA3AF] block mb-2">
                    Colour
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <motion.button
                        key={c}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAccent(c)}
                        className="w-7 h-7 rounded-full border-0 cursor-pointer flex items-center justify-center"
                        style={{ background: c }}
                      >
                        <AnimatePresence>
                          {accent === c && (
                            <motion.svg
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              width="12" height="12" viewBox="0 0 24 24" fill="none"
                            >
                              <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0F0EC] bg-[#FAFAF8]">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="text-[13px] font-semibold text-[#9CA3AF] hover:text-[#6B7280] border-0 bg-transparent cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <motion.button
                  whileHover={valid ? { y: -1, boxShadow: "0 6px 20px rgba(0,0,0,0.18)" } : {}}
                  whileTap={valid ? { scale: 0.97 } : {}}
                  onClick={handleSubmit}
                  disabled={!valid || loading}
                  className="h-9 px-5 rounded-xl text-[13px] font-black text-white border-0 flex items-center gap-2 transition-all"
                  style={{
                    background: valid ? "#0D0D0D" : "#E5E7EB",
                    color: valid ? "#fff" : "#9CA3AF",
                    cursor: valid ? "pointer" : "not-allowed",
                    boxShadow: valid ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create project
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}