"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";

function NudgeLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-0">
      <svg style={{ height: "24px", width: "auto", marginRight: "2px" }} viewBox="21 21 58 58" fill="none">
        <path d="M28 72V28" stroke={dark ? "#FFFFFF" : "#111827"} strokeWidth="14" strokeLinecap="round" />
        <path d="M72 72V28" stroke={dark ? "#FFFFFF" : "#111827"} strokeWidth="14" strokeLinecap="round" />
        <path d="M28 28L72 72" stroke="#4F46E5" strokeWidth="14" strokeLinecap="round" />
      </svg>
      <span
        className="text-[32px] font-[800] tracking-tight leading-none"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: dark ? "#FFFFFF" : "#111827" }}
      >
        udge
      </span>
    </div>
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
        background: "radial-gradient(circle,rgba(79,70,229,0.06) 0%,transparent 70%)",
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
      <label className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">{label}</label>
      <motion.div
        animate={{
          boxShadow: error
            ? "0 0 0 2px rgba(239, 68, 68, 0.4)"
            : focused
              ? "0 0 0 2px rgba(79, 70, 229, 0.5)"
              : "0 0 0 1px #E5E7EB",
        }}
        className="rounded-lg overflow-hidden bg-white"
        transition={{ duration: 0.2 }}
      >
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full px-4 py-2.5 bg-transparent border-none outline-none text-[13px] font-medium text-gray-900 placeholder-gray-400"
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-medium text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6+ characters", ok: password.length >= 6 },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  const colors = ["#EF4444", "#F59E0B", "#F59E0B", "#10B981", "#10B981"];
  const score = checks.filter(c => c.ok).length;

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
      <div className="flex gap-1.5 mb-2.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-[3px] flex-1 rounded-full"
            animate={{ background: i < score ? colors[score] : "#E5E7EB" }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((c, i) => (
          <motion.span
            key={i}
            className="text-[10px] font-semibold flex items-center gap-1"
            animate={{ color: c.ok ? "#10B981" : "#9CA3AF" }}
          >
            <motion.span
              animate={{ scale: c.ok ? 1 : 0.8 }}
              className="inline-block w-3 h-3 rounded-full text-[8px] flex items-center justify-center"
              style={{ background: c.ok ? "#10B981" : "#E5E7EB", color: c.ok ? "#ffffff" : "#9CA3AF", lineHeight: "12px", textAlign: "center" }}
            >
              {c.ok ? "✓" : ""}
            </motion.span>
            {c.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

const tips = [
  { icon: "🔐", text: "Use a unique password you haven't used before" },
  { icon: "📏", text: "Make it at least 6 characters long" },
  { icon: "🔀", text: "Mix uppercase, lowercase, and numbers" },
  { icon: "🔒", text: "Avoid personal information in your password" },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) { setError("Password must be 6+ characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 2400);
    }
  };

  return (
    <>
      <CursorGlow />
      <div className="min-h-screen relative z-10 flex flex-col lg:grid lg:grid-cols-2">

        {/* ── Left panel (dark) ──────────────────────────────────────── */}
        <motion.div
          initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden flex flex-col justify-between bg-gray-950"
          style={{
            padding: "clamp(28px,5vw,52px) clamp(24px,5vw,56px)",
            minHeight: "clamp(200px,40vh,360px)",
            backgroundImage: "url('/auth-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-[2px] z-0" />
          {/* Animated orbs */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
              top: "-8%", right: "-12%", width: 380, height: 380,
              background: "radial-gradient(ellipse,rgba(236,178,46,0.1) 0%,transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute rounded-full pointer-events-none"
            style={{
              bottom: "5%", left: "-5%", width: 360, height: 300,
              background: "radial-gradient(ellipse,rgba(46,182,125,0.08) 0%,transparent 70%)",
              filter: "blur(50px)",
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10">
            <NudgeLogo dark />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mt-8 lg:mt-0"
          >
            <span
              className="block mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-500"
            >
              Password reset
            </span>
            <h2 className="text-[clamp(24px,3.5vw,36px)] font-bold text-white tracking-tight leading-[1.1] mb-3">
              Almost there.<br className="hidden sm:block" /> Pick a new one.
            </h2>
            <p
              className="text-[14px] leading-[1.65] hidden lg:block mb-8"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Choose a strong password you haven't<br />used before to secure your account.
            </p>
            <div className="flex-col gap-3 hidden lg:flex">
              {tips.map((p, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    {p.icon}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {p.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="relative z-10 hidden lg:block mt-8">
            <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
              Your password is hashed and never stored in plain text.
            </p>
          </div>
        </motion.div>

        {/* ── Right panel (form) ─────────────────────────────────────── */}
        <motion.div
          initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center items-center overflow-y-auto bg-gray-50"
          style={{ padding: "clamp(32px,5vw,52px) clamp(20px,6vw,64px)" }}
        >
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 180, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 bg-emerald-500"
                  >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <path d="M9 18l6 6 12-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <h2 className="text-[clamp(22px,4vw,28px)] font-bold text-gray-900 tracking-tight mb-2">
                    Password updated!
                  </h2>
                  <p className="text-[14px] text-gray-400 leading-[1.65]">
                    Your password has been reset.<br />Redirecting you to sign in…
                  </p>
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 2.2, ease: "linear" }}
                    className="h-[3px] rounded-full mt-8 origin-left bg-emerald-500"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-6">
                    <h1 className="text-[clamp(22px,4vw,30px)] font-bold text-gray-900 tracking-tight mb-1.5">
                      Set new password
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      Make it something secure you'll remember.
                    </p>
                  </div>

                  {error && !error.includes("Password") && !error.includes("match") && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-5 px-4 py-3 rounded-lg text-[13px] font-semibold bg-red-50 border border-red-200 text-red-600"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-4 mb-4">
                    <Field
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={setPassword}
                      error={error && error.includes("Password") ? error : ""}
                    />
                    <PasswordStrength password={password} />
                    <Field
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      error={error && error.includes("match") ? error : ""}
                    />
                  </div>

                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    className="w-full py-3 mt-2 bg-indigo-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm transition-all hover:bg-indigo-700"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-[18px] h-[18px] rounded-full border-[2.5px] border-indigo-200 border-t-white"
                      />
                    ) : (
                      <>Reset password <span className="opacity-40">→</span></>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-8 text-[11px] text-gray-300 text-center leading-relaxed font-medium">
              Need help?{" "}
              <a href="#" className="text-gray-400 font-bold no-underline">Contact support</a>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
