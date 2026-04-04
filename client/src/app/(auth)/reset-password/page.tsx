"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";

function NudgeLogo({ dark = false }: { dark?: boolean }) {
  const id = `reset-pills-${dark ? "d" : "l"}`;
  return (
    <svg width="130" height="34" viewBox="0 0 220 56" fill="none">
      <g id={id}>
        <rect x="8" y="8" width="16" height="16" rx="8" fill="#36C5F0" />
        <rect x="8" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4" />
        <rect x="26" y="8" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4" />
        <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D" />
        <animateTransform
          href={`#${id}`} attributeName="transform" type="rotate"
          values="0 24 24;-360 24 24" keyTimes="0;1"
          dur="6s" repeatCount="indefinite"
        />
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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6+ characters", ok: password.length >= 6 },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["#E01E5A", "#ECB22E", "#ECB22E", "#2EB67D", "#2EB67D"];

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
      <div className="flex gap-1.5 mb-2.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-[3px] flex-1 rounded-full"
            animate={{ background: i < score ? colors[score] : "#E8E8E2" }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((c, i) => (
          <motion.span
            key={i}
            className="text-[10px] font-bold flex items-center gap-1"
            animate={{ color: c.ok ? "#2EB67D" : "#C4C4BC" }}
          >
            <motion.span
              animate={{ scale: c.ok ? 1 : 0.8 }}
              className="inline-block w-3 h-3 rounded-full text-[8px] flex items-center justify-center"
              style={{ background: c.ok ? "#2EB67D" : "#E8E8E2", color: c.ok ? "#fff" : "#aaa", lineHeight: "12px", textAlign: "center" }}
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
          className="relative overflow-hidden flex flex-col justify-between"
          style={{
            background: "#0D0D0D",
            padding: "clamp(28px,5vw,52px) clamp(24px,5vw,56px)",
            minHeight: "clamp(200px,40vh,360px)",
          }}
        >
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
              className="block mb-3 text-[10px] font-black tracking-[0.2em] uppercase"
              style={{ color: "#2EB67D" }}
            >
              Password reset
            </span>
            <h2 className="text-[clamp(24px,3.5vw,36px)] font-black text-white tracking-tight leading-[1.1] mb-3">
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
          className="flex flex-col justify-center items-center overflow-y-auto"
          style={{ background: "#F9F9F7", padding: "clamp(32px,5vw,52px) clamp(20px,6vw,64px)" }}
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
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
                    style={{ background: "#2EB67D" }}
                  >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <path d="M9 18l6 6 12-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <h2 className="text-[clamp(22px,4vw,28px)] font-black text-gray-900 tracking-tight mb-2">
                    Password updated!
                  </h2>
                  <p className="text-[14px] text-gray-400 leading-[1.65]">
                    Your password has been reset.<br />Redirecting you to sign in…
                  </p>
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 2.2, ease: "linear" }}
                    className="h-[3px] rounded-full mt-8 origin-left"
                    style={{ background: "#2EB67D" }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-6">
                    <h1 className="text-[clamp(22px,4vw,30px)] font-black text-gray-900 tracking-tight mb-1.5">
                      Set new password
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      Make it something secure you'll remember.
                    </p>
                  </div>

                  {error && !error.includes("Password") && !error.includes("match") && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-5 px-4 py-3 rounded-xl text-[13px] font-semibold"
                      style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", color: "#E01E5A" }}
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
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    className="w-full py-3.5 mt-2 bg-gray-900 text-white border-none rounded-xl text-[14px] font-black cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Sora,sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.14)" }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-[18px] h-[18px] rounded-full border-[2.5px]"
                        style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
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
