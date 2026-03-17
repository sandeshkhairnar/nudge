"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";
import { useEffect } from "react";

function NudgeLogo({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="130" height="34" viewBox="0 0 220 56" fill="none">
      <g id="reset-logo">
        <rect x="8" y="8" width="16" height="16" rx="8" fill="#36C5F0" />
        <rect x="8" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
        <rect x="26" y="8" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
        <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
      </g>
      <text x="56" y="37" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="28"
        fill={dark ? "#fff" : "#0D0D0D"} letterSpacing="-1">nudge</text>
    </svg>
  );
}

function CursorGlow() {
  const mx = useMotionValue(-300);
  const my = useMotionValue(-300);
  const sx = useSpring(mx, { stiffness: 70, damping: 18 });
  const sy = useSpring(my, { stiffness: 70, damping: 18 });
  useEffect(() => {
    const fn = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);
  return (
    <motion.div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <motion.div style={{
        position: "absolute", width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(54,197,240,0.06) 0%,transparent 70%)",
        x: sx, y: sy, translateX: "-50%", translateY: "-50%",
      }} />
    </motion.div>
  );
}

function Field({ label, type = "text", placeholder, value, onChange, error }: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black text-gray-400 tracking-widest uppercase">{label}</label>
      <motion.div
        animate={{
          boxShadow: error
            ? "0 0 0 2px #E01E5A40"
            : focused
            ? "0 0 0 2px #36C5F050"
            : "0 0 0 1px #E8E8E2",
        }}
        className="rounded-xl overflow-hidden bg-white"
        transition={{ duration: 0.2 }}
      >
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full px-4 py-3 bg-transparent border-none outline-none text-[14px] font-medium text-gray-900 placeholder-gray-300"
          style={{ fontFamily: "Sora,sans-serif" }}
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-semibold" style={{ color: "#E01E5A" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError("Password must be 6+ characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);

    const result = await updatePassword(password);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] relative overflow-hidden flex flex-col items-center justify-center p-6">
      <CursorGlow />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="flex justify-center mb-10">
          <NudgeLogo />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E8E2]">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-[#2EB67D] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Password reset!</h2>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Your password has been updated. <br />Redirecting you to sign in…
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-8">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Set new password</h1>
                  <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
                    Make sure it's something secure that you'll remember.
                  </p>
                </div>

                <div className="space-y-6">
                  <Field
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    error={error && error.includes("Password") ? error : ""}
                  />

                  <Field
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={error && error.includes("match") ? error : ""}
                  />

                  {error && !error.includes("Password") && !error.includes("match") && (
                    <p className="text-[11px] font-semibold" style={{ color: "#E01E5A" }}>
                      {error}
                    </p>
                  )}

                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full py-3.5 bg-gray-900 text-white border-none rounded-xl text-[14px] font-black cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-lg shadow-black/10"
                    style={{ fontFamily: "Sora,sans-serif" }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-[18px] h-[18px] rounded-full border-[2.5px]"
                        style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                      />
                    ) : (
                      "Reset password"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
