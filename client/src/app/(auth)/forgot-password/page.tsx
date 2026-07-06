"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { resetPasswordForEmail } from "@/lib/auth";

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

const tips = [
  { icon: "🔒", text: "End-to-end encryption on all data" },
  { icon: "🛡️", text: "SOC 2 Type II compliant" },
  { icon: "⚡", text: "Reset link arrives in under 30 seconds" },
  { icon: "🔑", text: "Supports SSO & passwordless login" },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setError("");
    setLoading(true);
    const result = await resetPasswordForEmail(email);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <>
      <CursorGlow />
      <div className="min-h-screen relative z-10 flex flex-col lg:grid lg:grid-cols-2">

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
          <motion.div
            animate={{ scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
              top: "-10%", right: "-10%", width: 400, height: 400,
              background: "radial-gradient(ellipse,rgba(54,197,240,0.1) 0%,transparent 70%)",
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
              className="block mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-amber-500"
            >
              Account recovery
            </span>
            <h2 className="text-[clamp(24px,3.5vw,36px)] font-bold text-white tracking-tight leading-[1.1] mb-3">
              We've got<br className="hidden sm:block" /> your back.
            </h2>
            <p
              className="text-[14px] leading-[1.65] hidden lg:block mb-8"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Enter your email and we'll send you<br />a secure link to reset your password.
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
              Your data is encrypted at rest and in transit.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center items-center overflow-y-auto bg-gray-50"
          style={{ padding: "clamp(32px,5vw,52px) clamp(20px,6vw,64px)" }}
        >
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {submitted ? (
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
                    Check your email
                  </h2>
                  <p className="text-[14px] text-gray-400 leading-[1.65] mb-10">
                    We've sent a password reset link to<br />
                    <span className="font-bold text-gray-700">{email}</span>
                  </p>
                  {[
                    "Reset link sent",
                    "Valid for 24 hours",
                    "Check spam if it doesn't arrive",
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.18 }}
                      className="flex items-center gap-3 mb-3 text-left"
                    >
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.18, type: "spring", stiffness: 200 }}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                      <span className="text-[13px] font-semibold text-gray-700">{item}</span>
                    </motion.div>
                  ))}
                  <Link
                    href="/sign-in"
                    className="mt-8 inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-semibold no-underline shadow-sm transition-all"
                  >
                    Back to sign in <span className="opacity-40">→</span>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-6">
                    <h1 className="text-[clamp(22px,4vw,30px)] font-bold text-gray-900 tracking-tight mb-1.5">
                      Forgot password?
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      No worries. Enter your email and we'll send you a reset link.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 mb-5">
                    <Field
                      label="Email address"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={setEmail}
                      error={error}
                    />
                  </div>

                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm transition-all hover:bg-indigo-700"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-[18px] h-[18px] rounded-full border-[2.5px] border-indigo-200 border-t-white"
                      />
                    ) : (
                      <>Send reset link <span className="opacity-40">→</span></>
                    )}
                  </motion.button>

                  <div className="mt-8 pt-5 border-t border-gray-200 text-center">
                    <Link href="/sign-in" className="text-[13px] font-semibold text-gray-400 no-underline hover:text-gray-700 transition-colors flex items-center justify-center gap-2">
                      <span className="opacity-40">←</span> Back to sign in
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-8 text-[11px] text-gray-300 text-center leading-relaxed font-medium">
              Need help?{" "}
              <Link href="#" className="text-gray-400 font-bold no-underline">Contact support</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
