"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { getInvitationByToken, acceptInvitation } from "@/lib/project-members";
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
  const id = `login-pills-${dark ? "d" : "l"}`;
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

function Field({ label, type = "text", placeholder, value, onChange, error, readOnly }: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string; readOnly?: boolean;
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
          readOnly={readOnly}
          className="w-full px-4 py-3 bg-transparent border-none outline-none text-[14px] font-medium text-gray-900 placeholder-gray-300"
          style={{ fontFamily: "Sora,sans-serif", cursor: readOnly ? "default" : "text", opacity: readOnly ? 0.7 : 1 }}
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

function InviteBanner({ invite }: { invite: InviteData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(54,197,240,0.25)", background: "rgba(54,197,240,0.04)" }}
    >
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(54,197,240,0.12)" }}
        >
          <span style={{ color: "#36C5F0", fontSize: 14 }}>✉</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-black text-gray-900 mb-1">
            {invite.profiles?.full_name ?? "Someone"} invited you to join
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {invite.workspaces && (
              <div className="flex items-center gap-1">
                <Building2 size={10} className="text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-600">{invite.workspaces.name}</span>
              </div>
            )}
            {invite.projects && (
              <>
                <ChevronRight size={9} className="text-gray-300" />
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: invite.projects.color ?? "#36C5F0" }} />
                  <span className="text-[11px] font-semibold text-gray-600">{invite.projects.name}</span>
                </div>
              </>
            )}
            <span
              className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "rgba(54,197,240,0.12)", color: "#36C5F0" }}
            >
              {invite.role}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const quotes = [
  { text: "From messy threads to shipped features. Nudge changed how we work.", author: "Ava M.", role: "Head of Product" },
  { text: "The AI nudges feel like having a brilliant PM who never sleeps.", author: "Tomas R.", role: "Eng Manager" },
  { text: "We stopped losing things. That sounds small — it changed everything.", author: "Kira J.", role: "CTO" },
];

function RotatingQuote() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % quotes.length), 4000);
    return () => clearInterval(t);
  }, []);
  const q = quotes[idx];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[360px]"
      >
        <p className="text-[clamp(15px,2vw,20px)] font-bold text-white leading-[1.55] mb-5 tracking-[-0.01em]">
          "{q.text}"
        </p>
        <div className="flex items-center gap-2.5">
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: "#36C5F0" }}
          >
            {q.author[0]}
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">{q.author}</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{q.role}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();

  const inviteId = params.get("invite");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteId);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!inviteId) return;
    (async () => {
      const result = await getInvitationByToken(inviteId);
      if (!result.error) {
        const inv = result.invitation as InviteData;
        setInvite(inv);
        setEmail(inv.invitee_email);
      }
      setInviteLoading(false);
    })();
  }, [inviteId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "Password must be 6+ characters";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setServerError("");

    if (inviteId) {
      const result = await signIn({ email, password, skipRedirect: true });
      if (result?.error) { setServerError(result.error); setLoading(false); return; }

      const accepted = await acceptInvitation(inviteId).catch((err: any) => ({
        error: err?.message ?? "Failed to accept invitation. Please try again.",
        success: false as const,
        projectId: null as string | null,
      }));

      setLoading(false);

      if ("error" in accepted && accepted.error) {
        setServerError(accepted.error);
        return;
      }

      setDone(true);
      if (accepted.projectId) {
        setTimeout(() => router.replace(`/space/${accepted.projectId}`), 1600);
      } else {
        setTimeout(() => router.replace("/space"), 1600);
      }
      return;
    }

    const result = await signIn({ email, password });
    if (result?.error) { setServerError(result.error); setLoading(false); return; }

    setLoading(false);
    setDone(true);
  };

  const signUpHref = inviteId
    ? `/get-started?invite=${inviteId}&email=${encodeURIComponent(email)}`
    : "/get-started";

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9F9F7" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-[2.5px]"
          style={{ borderColor: "rgba(0,0,0,0.1)", borderTopColor: "#36C5F0" }}
        />
      </div>
    );
  }

  return (
    <>
      <CursorGlow />
      <div className="min-h-screen relative z-10 flex flex-col lg:grid lg:grid-cols-2">

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

          <div className="relative z-10 mt-8 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 lg:mb-10"
            >
              <span
                className="block mb-3 text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ color: invite ? "#36C5F0" : "#36C5F0" }}
              >
                {invite ? `Invited by ${invite.profiles?.full_name ?? "a teammate"}` : "14,000+ teams"}
              </span>
              <h2 className="text-[clamp(24px,3.5vw,36px)] font-black text-white tracking-tight leading-[1.1] mb-3">
                {invite ? (
                  <>Sign in to<br className="hidden sm:block" /> accept your invite.</>
                ) : (
                  <>Good to have<br className="hidden sm:block" /> you back.</>
                )}
              </h2>
              <p
                className="text-[14px] leading-[1.65] hidden lg:block"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                {invite
                  ? <>You've been invited to join<br />{invite.workspaces?.name ?? "the workspace"}.</>
                  : <>Your team has been busy.<br />Sign in to see what moved.</>
                }
              </p>
            </motion.div>

            <div className="hidden lg:block">
              <RotatingQuote />
            </div>
          </div>

          <div className="hidden lg:flex gap-1.5 relative z-10">
            {quotes.map((_, i) => (
              <div
                key={i}
                className="h-[3px] rounded-sm transition-all duration-300"
                style={{ width: i === 0 ? 24 : 8, background: "#fff", opacity: i === 0 ? 1 : 0.2 }}
              />
            ))}
          </div>
        </motion.div>

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
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-7"
                    style={{ background: "#2EB67D" }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M7 16l6 6 12-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <h3 className="text-[24px] font-black text-gray-900 mb-2 tracking-tight">You're in</h3>
                  <p className="text-[13px] text-gray-400">Redirecting to your workspace…</p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div className="mb-6">
                    <h1 className="text-[clamp(24px,4vw,32px)] font-black text-gray-900 tracking-tight mb-2">
                      {invite ? "Sign in" : "Sign in"}
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      No account?{" "}
                      <Link href={signUpHref} className="font-bold no-underline" style={{ color: "#36C5F0" }}>
                        Create one free →
                      </Link>
                    </p>
                  </div>

                  {invite && <InviteBanner invite={invite} />}

                  {serverError && (
                    <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] font-semibold text-red-600">
                      {serverError}
                    </div>
                  )}

                  {!invite && (
                    <>
                      <div className="flex flex-col gap-2.5 mb-6">
                        {[
                          { icon: "G", label: "Continue with Google", action: () => signInWithGoogle(typeof window !== 'undefined' && 'electronAPI' in window) },
                          { icon: "⌘", label: "Continue with SSO", action: () => { } },
                        ].map((btn, i) => (
                          <motion.button
                            key={i} onClick={btn.action}
                            whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-800 flex items-center gap-3 cursor-pointer"
                            style={{ fontFamily: "Sora,sans-serif", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                          >
                            <span className="w-[20px] h-[20px] rounded-md bg-gray-100 flex items-center justify-center text-[11px] font-black flex-shrink-0">
                              {btn.icon}
                            </span>
                            {btn.label}
                          </motion.button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-4 mb-5">
                    <Field
                      label="Email" type="email" placeholder="you@company.com"
                      value={email} onChange={setEmail} error={errors.email}
                      readOnly={!!invite}
                    />
                    <Field
                      label="Password" type="password" placeholder="••••••••"
                      value={password} onChange={setPassword} error={errors.password}
                    />
                  </div>

                  {!invite && (
                    <div className="flex justify-end mb-6">
                      <Link href="/forgot-password" title="Forgot password?" className="text-[12px] font-bold text-gray-400 no-underline hover:text-gray-600 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {invite && <div className="mb-5" />}

                  <motion.button
                    onClick={submit}
                    whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.22)" }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    className="w-full py-3.5 bg-gray-900 text-white border-none rounded-xl text-[14px] font-black cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
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
                      <>
                        {invite ? "Sign In & Accept Invite" : "Sign in"}
                        {" "}<span className="opacity-40">→</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-8 text-[11px] text-gray-300 text-center leading-relaxed font-medium">
              By continuing you agree to our{" "}
              <Link href="#" className="text-gray-400 font-bold no-underline">Terms</Link>
              {" "}and{" "}
              <Link href="#" className="text-gray-400 font-bold no-underline">Privacy Policy</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}