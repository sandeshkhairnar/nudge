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

function Field({ label, type = "text", placeholder, value, onChange, error, readOnly }: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; error?: string; readOnly?: boolean;
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
          readOnly={readOnly}
          className="w-full px-4 py-2.5 bg-transparent border-none outline-none text-[13px] font-medium text-gray-900 placeholder-gray-400"
          style={{ cursor: readOnly ? "default" : "text", opacity: readOnly ? 0.7 : 1 }}
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
        <p className="text-[clamp(14px,1.5vw,18px)] font-semibold text-white leading-relaxed mb-5">
          "{q.text}"
        </p>
        <div className="flex items-center gap-2.5">
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 bg-indigo-500"
          >
            {q.author[0]}
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white">{q.author}</p>
            <p className="text-[11px] text-white/50">{q.role}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-[2.5px] border-gray-200 border-t-indigo-600"
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
              background: "radial-gradient(ellipse,rgba(79,70,229,0.1) 0%,transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute rounded-full pointer-events-none"
            style={{
              bottom: "5%", left: "-5%", width: 360, height: 300,
              background: "radial-gradient(ellipse,rgba(16,185,129,0.08) 0%,transparent 70%)",
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
                className="block mb-3 text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400"
              >
                {invite ? `Invited by ${invite.profiles?.full_name ?? "a teammate"}` : "14,000+ teams"}
              </span>
              <h2 className="text-[clamp(24px,3.5vw,36px)] font-bold text-white tracking-tight leading-[1.1] mb-3">
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
          className="flex flex-col justify-center items-center overflow-y-auto bg-gray-50"
          style={{ padding: "clamp(32px,5vw,52px) clamp(20px,6vw,64px)" }}
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
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-7 bg-emerald-500"
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M7 16l6 6 12-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <h3 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">You're in</h3>
                  <p className="text-[13px] text-gray-400">Redirecting to your workspace…</p>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div className="mb-6">
                    <h1 className="text-[clamp(24px,4vw,32px)] font-bold text-gray-900 tracking-tight mb-2">
                      {invite ? "Sign in" : "Sign in"}
                    </h1>
                    <p className="text-[13px] font-medium text-gray-500">
                      No account?{" "}
                      <Link href={signUpHref} className="font-semibold text-indigo-600 no-underline hover:text-indigo-700 transition-colors">
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
                            whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-2.5 px-5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 flex items-center gap-3 cursor-pointer shadow-sm transition-all"
                          >
                            <span className="w-[20px] h-[20px] rounded-md bg-gray-50 flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-gray-600">
                              {btn.icon}
                            </span>
                            {btn.label}
                          </motion.button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">or</span>
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
                    whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-sm transition-all hover:bg-indigo-700"
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