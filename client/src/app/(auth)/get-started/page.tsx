"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { getInvitationByToken } from "@/lib/project-members";
import { Building2, ChevronRight } from "lucide-react";

type InviteData = {
  id: string;
  role: string;
  invitee_email: string;
  workspaces: { id: string; name: string; slug: string } | null;
  projects: { id: string; name: string; color: string } | null;
  profiles: { id: string; full_name: string | null; email: string } | null;
};

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
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(79,70,229,0.06) 0%,transparent 70%)",
        x: sx, y: sy, translateX: "-50%", translateY: "-50%",
      }} />
    </motion.div>
  );
}

function Field({ label, type = "text", placeholder, value, onChange, error, hint, readOnly }: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string; hint?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">{label}</label>
        {hint && <span className="text-[11px] text-gray-400 font-medium">{hint}</span>}
      </div>
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
          readOnly={readOnly}
          className="w-full px-4 py-2.5 bg-transparent border-none outline-none text-[13px] font-medium text-gray-900 placeholder-gray-400"
          style={{ cursor: readOnly ? "default" : "text", opacity: readOnly ? 0.7 : 1 }}
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-medium text-red-500">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const s = password.length === 0 ? 0
    : password.length < 6 ? 1
      : password.length < 10 ? 2
        : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
          : 3;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#EF4444", "#F59E0B", "#10B981", "#10B981"];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{ background: i <= s ? colors[s] : "#E5E7EB" }}
            transition={{ duration: 0.3 }}
            className="flex-1 h-[3px] rounded-sm"
          />
        ))}
      </div>
      {password.length > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[11px] font-semibold" style={{ color: colors[s] }}>
          {labels[s]}
        </motion.p>
      )}
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 28 : 8,
            background: i === current ? "#4F46E5" : i < current ? "#4F46E5" : "#E5E7EB",
            opacity: i < current ? 0.5 : 1,
          }}
          className="h-1 rounded-sm"
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

function InviteBanner({ invite }: { invite: InviteData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 rounded-lg overflow-hidden bg-indigo-50 border border-indigo-100"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-indigo-100 text-indigo-600"
        >
          <span style={{ fontSize: 14 }}>✉</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 mb-1">
            {invite.profiles?.full_name ?? "Someone"} invited you to join
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {invite.workspaces && (
              <div className="flex items-center gap-1">
                <Building2 size={10} className="text-gray-400" />
                <span className="text-[11px] font-medium text-gray-600">{invite.workspaces.name}</span>
              </div>
            )}
            {invite.projects && (
              <>
                <ChevronRight size={9} className="text-gray-300" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: invite.projects.color ?? "#4F46E5" }} />
                  <span className="text-[11px] font-medium text-gray-600">{invite.projects.name}</span>
                </div>
              </>
            )}
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"
            >
              {invite.role}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const perks = [
  { icon: "⚡", text: "Up and running in 3 minutes" },
  { icon: "🧠", text: "AI that nudges stuck tasks forward" },
  { icon: "🎯", text: "One signal, not a wall of notifications" },
  { icon: "🔗", text: "Connects to Slack, GitHub, Figma" },
];

const roles = ["Ship faster", "Reduce blockers", "Stay aligned", "Cut meetings", "Focus deep work", "Other"];
const teamSizes = ["Just me", "2–5", "6–20", "20+"];

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();

  const inviteId = params.get("invite");
  const prefillEmail = params.get("email") ?? "";

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteId);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: prefillEmail, password: "", workspace: "", role: "", teamSize: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!inviteId) return;
    (async () => {
      const result = await getInvitationByToken(inviteId);
      if (result.error) {
        setInviteError(result.error);
      } else {
        const inv = result.invitation as unknown as InviteData;
        setInvite(inv);
        if (inv.invitee_email) {
          setForm((f) => ({ ...f, email: inv.invitee_email }));
        }
      }
      setInviteLoading(false);
    })();
  }, [inviteId]);

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Must be at least 6 characters";
    return e;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!invite && !form.workspace.trim()) e.workspace = "Workspace name is required";
    return e;
  };

  const next = async () => {
    if (step === 0) {
      const e = validateStep0();
      if (Object.keys(e).length) { setErrors(e); return; }
      setErrors({});
      if (invite) {
        setLoading(true);
        setServerError("");

        const result = await signUp({
          fullName: form.name, email: form.email,
          password: form.password, workspaceName: "",
          invitationId: inviteId!,
        });

        setLoading(false);

        if (result?.error) { setServerError(result.error); return; }

        setStep(2);
        setTimeout(() => router.replace("/sign-in"), 2400);
      } else {
        setStep(1);
      }
    } else if (step === 1) {
      const e = validateStep1();
      if (Object.keys(e).length) { setErrors(e); return; }
      setErrors({});
      setLoading(true);
      setServerError("");
      const result = await signUp({
        fullName: form.name, email: form.email,
        password: form.password, workspaceName: form.workspace,
        purpose: form.role, teamSize: form.teamSize,
      });
      setLoading(false);
      if (result?.error) { setServerError(result.error); return; }
      setStep(2);
      setTimeout(() => router.push("/sign-in"), 2400);
    }
  };

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-[2.5px] border-indigo-200 border-t-indigo-600"
        />
      </div>
    );
  }

  const totalSteps = invite ? 1 : 2;
  const signInHref = inviteId ? `/sign-in?invite=${inviteId}` : "/sign-in";

  return (
    <>
      <CursorGlow />
      <div className="min-h-screen relative z-10 flex flex-col lg:grid lg:grid-cols-2">

        <motion.div
          initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden flex flex-col justify-between bg-gray-950"
          style={{ 
            padding: "clamp(32px,5vw,52px) clamp(24px,5vw,56px)", 
            minHeight: "clamp(200px,40vh,340px)",
            backgroundImage: "url('/auth-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-[2px] z-0" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse,rgba(79,70,229,0.09) 0%,transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="relative z-10">
            <NudgeLogo dark />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative z-10 mt-8 lg:mt-0"
          >
            <span
              className="block mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400"
            >
              {invite ? `Invited by ${invite.profiles?.full_name ?? "a teammate"}` : "Free forever on Solo"}
            </span>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-white tracking-tight leading-[1.1] mb-3">
              {invite ? (
                <>You're invited<br className="hidden sm:block" /> to {invite.projects?.name ?? invite.workspaces?.name ?? "a workspace"}.</>
              ) : (
                <>Start moving<br className="hidden sm:block" /> faster today.</>
              )}
            </h2>
            <p
              className="text-[14px] leading-[1.65] mb-8 hidden lg:block"
              style={{ color: "rgba(255,255,255,0.36)" }}
            >
              {invite
                ? <>Create your account to join<br />{invite.workspaces?.name ?? "the workspace"} and get started.</>
                : <>No credit card. No onboarding call.<br />Just your team and less chaos.</>
              }
            </p>
            <div className="flex-col gap-3 hidden lg:flex">
              {perks.map((p, i) => (
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

          <div className="relative z-10 hidden lg:flex items-center gap-3 mt-8">
            <div className="flex">
              {["#4F46E5", "#10B981", "#F59E0B", "#EF4444"].map((c, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-gray-950 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: c, marginLeft: i === 0 ? 0 : -8 }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
              Joined by{" "}
              <strong style={{ color: "rgba(255,255,255,0.7)" }}>14,000+</strong>
              <br />teams this year
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

              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-6">
                    <StepDots current={0} total={totalSteps} />
                    <h1 className="text-[clamp(22px,4vw,30px)] font-bold text-gray-900 tracking-tight mt-5 mb-1.5">
                      {invite ? "Create your account" : "Create your account"}
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      Already have one?{" "}
                      <Link href={signInHref} className="font-semibold text-indigo-600 no-underline hover:text-indigo-700 transition-colors">
                        Sign in →
                      </Link>
                    </p>
                  </div>

                  {inviteError && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] font-semibold text-red-600">
                      {inviteError}
                    </div>
                  )}

                  {invite && <InviteBanner invite={invite} />}

                  {!invite && (
                    <>
                      <motion.button
                        onClick={() => signInWithGoogle(typeof window !== 'undefined' && 'electronAPI' in window)}
                        whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2.5 px-5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 flex items-center gap-3 cursor-pointer shadow-sm transition-all mb-5"
                      >
                        <span className="w-[20px] h-[20px] rounded-md bg-gray-50 flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-gray-600">
                          G
                        </span>
                        Continue with Google
                      </motion.button>

                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    </>
                  )}

                  {serverError && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] font-semibold text-red-600">
                      {serverError}
                    </div>
                  )}

                  <div className="flex flex-col gap-4 mb-5">
                    <Field
                      label="Full name" placeholder="Alex Johnson"
                      value={form.name} onChange={set("name")} error={errors.name}
                    />
                    <Field
                      label="Work email" type="email" placeholder="you@company.com"
                      value={form.email} onChange={set("email")} error={errors.email}
                      readOnly={!!invite}
                      hint={invite ? "Locked to invite" : undefined}
                    />
                    <div className="flex flex-col gap-2">
                      <Field
                        label="Password" type="password" placeholder="••••••••"
                        value={form.password} onChange={set("password")}
                        error={errors.password} hint="min. 6 chars"
                      />
                      <PasswordStrength password={form.password} />
                    </div>
                  </div>

                  <motion.button
                    onClick={next}
                    disabled={loading}
                    whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3 bg-indigo-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm transition-all hover:bg-indigo-700"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-[18px] h-[18px] rounded-full border-[2.5px] border-indigo-200 border-t-white"
                      />
                    ) : (
                      <>
                        {invite ? "Sign Up & Accept Invite" : "Continue"}
                        {" "}<span className="opacity-40">→</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {step === 1 && !invite && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-7">
                    <StepDots current={1} total={2} />
                    <h1 className="text-[clamp(22px,4vw,30px)] font-bold text-gray-900 tracking-tight mt-5 mb-1.5">
                      Set up your workspace
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      You can invite teammates next.
                    </p>
                  </div>

                  {serverError && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] font-semibold text-red-600">
                      {serverError}
                    </div>
                  )}

                  <div className="flex flex-col gap-5 mb-6">
                    <Field
                      label="Workspace name" placeholder="Acme Inc."
                      value={form.workspace} onChange={set("workspace")} error={errors.workspace}
                    />

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
                        Your purpose{" "}
                        <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((r) => (
                          <motion.button
                            key={r} onClick={() => set("role")(form.role === r ? "" : r)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            animate={{
                              background: form.role === r ? "#4F46E5" : "#fff",
                              color: form.role === r ? "#fff" : "#374151",
                              borderColor: form.role === r ? "#4F46E5" : "#E5E7EB",
                            }}
                            transition={{ duration: 0.15 }}
                            className="px-3.5 py-1.5 rounded-full text-[12px] font-medium border cursor-pointer"
                          >
                            {r}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
                        Team size
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {teamSizes.map((size) => (
                          <motion.button
                            key={size}
                            onClick={() => set("teamSize")(form.teamSize === size ? "" : size)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            animate={{
                              background: form.teamSize === size ? "#4F46E5" : "#fff",
                              color: form.teamSize === size ? "#fff" : "#374151",
                              borderColor: form.teamSize === size ? "#4F46E5" : "#E5E7EB",
                            }}
                            transition={{ duration: 0.15 }}
                            className="py-2.5 rounded-lg text-[12px] font-medium border cursor-pointer text-center"
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <motion.button
                      onClick={() => setStep(0)}
                      whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                      className="flex-none py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-[14px] font-semibold cursor-pointer text-gray-500 shadow-sm"
                    >
                      ←
                    </motion.button>
                    <motion.button
                      onClick={next}
                      whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.97 }}
                      disabled={loading}
                      className="flex-1 py-3 bg-indigo-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm transition-all hover:bg-indigo-700"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="w-[18px] h-[18px] rounded-full border-[2.5px] border-indigo-200 border-t-white"
                        />
                      ) : (
                        <>Create workspace <span className="opacity-40">→</span></>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
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
                    {invite
                      ? `Welcome to ${invite.workspaces?.name ?? "the workspace"}!`
                      : `Welcome to nudge${form.workspace ? `, ${form.workspace}` : ""}!`}
                  </h2>
                  <p className="text-[14px] text-gray-400 leading-[1.65] mb-10">
                    {invite
                      ? <>Your account is ready.<br />Taking you in…</>
                      : <>Your workspace is ready.<br />Setting things up just for you…</>
                    }
                  </p>
                  {(invite
                    ? ["Account created", "Invitation accepted", "Ready to collaborate"]
                    : ["Account created", "Workspace initialised", "AI nudge engine ready"]
                  ).map((item, i) => (
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
                </motion.div>
              )}

            </AnimatePresence>

            {step < 2 && (
              <p className="mt-8 text-[11px] text-gray-300 text-center leading-relaxed">
                By continuing you agree to our{" "}
                <Link href="#" className="text-gray-400 font-bold no-underline">Terms</Link>
                {" "}and{" "}
                <Link href="#" className="text-gray-400 font-bold no-underline">Privacy Policy</Link>.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupInner />
    </Suspense>
  );
}