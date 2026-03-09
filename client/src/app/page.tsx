"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  useMotionValue,
  useAnimationFrame,
} from "framer-motion";
import Link from "next/link";

function NudgeLogo({ scale = 1, dark = false }: { scale?: number; dark?: boolean }) {
  const uid = useRef(`logo-${Math.random().toString(36).slice(2, 7)}`).current;
  return (
    <svg width={200 * scale} height={52 * scale} viewBox="0 0 200 52" fill="none" style={{ display: "block" }}>
      <g id={uid}>
        <rect x="6" y="6" width="15" height="15" rx="7.5" fill="#36C5F0" />
        <rect x="6" y="23" width="15" height="15" rx="4" fill="#36C5F0" opacity="0.4" />
        <rect x="23" y="6" width="15" height="15" rx="4" fill="#2EB67D" opacity="0.4" />
        <rect x="23" y="23" width="15" height="15" rx="7.5" fill="#2EB67D" />
        <animateTransform href={`#${uid}`} attributeName="transform" type="rotate"
          values="0 22 22;-360 22 22" dur="8s" repeatCount="indefinite" />
      </g>
      <text x="50" y="35" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="26"
        fill={dark ? "#ffffff" : "#0D0D0D"} letterSpacing="-0.8">nudge</text>
    </svg>
  );
}

function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999,
      background: "linear-gradient(90deg,#36C5F0,#2EB67D,#ECB22E)",
      scaleX, transformOrigin: "0%",
    }} />
  );
}

function Cursor() {
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const gx = useSpring(mx, { stiffness: 80, damping: 18 });
  const gy = useSpring(my, { stiffness: 80, damping: 18 });

  useEffect(() => {
    const fn = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return null;

  return (
    <>
      <motion.div style={{
        position: "fixed", top: 0, left: 0, width: 8, height: 8, borderRadius: "50%",
        background: "#0D0D0D", pointerEvents: "none", zIndex: 9998,
        x: mx, y: my, translateX: "-50%", translateY: "-50%",
      }} />
      <motion.div style={{
        position: "fixed", top: 0, left: 0, width: 400, height: 400, borderRadius: "50%",
        pointerEvents: "none", zIndex: 9997,
        x: gx, y: gy, translateX: "-50%", translateY: "-50%",
        background: "radial-gradient(circle, rgba(54,197,240,0.06) 0%, transparent 70%)",
      }} />
    </>
  );
}

const TICKS = ["Move tasks forward", "Ship without chaos", "Real-time clarity", "No stuck tickets", "AI that nudges", "Built for teams"];

function Ticker({ reverse = false }: { reverse?: boolean }) {
  const x = useMotionValue(0);
  const trackWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      trackWidth.current = containerRef.current.scrollWidth / 2;
    }
  }, []);

  useAnimationFrame((_, delta) => {
    const speed = 0.045;
    const dir = reverse ? 1 : -1;
    const next = x.get() + dir * delta * speed;
    if (!reverse && next <= -trackWidth.current) x.set(0);
    else if (reverse && next >= 0) x.set(-trackWidth.current);
    else x.set(next);
  });

  const doubled = [...TICKS, ...TICKS, ...TICKS, ...TICKS];

  return (
    <div style={{ overflow: "hidden", padding: "10px 0" }}>
      <motion.div ref={containerRef} style={{ x, display: "flex", whiteSpace: "nowrap" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 16, padding: "0 20px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
            color: reverse ? "rgba(255,255,255,0.18)" : "#9CA3AF",
          }}>
            {t}
            <span style={{ color: reverse ? "#2EB67D" : "#36C5F0", fontSize: 8 }}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Reveal({ children, delay = 0, y = 32 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

function CountUp({ to, suffix = "", duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const hCards = [
  { accent: "#36C5F0", icon: "⚡", title: "Zero-config setup", body: "Connect your team in 3 minutes. No CSV uploads, no onboarding calls, no IT tickets." },
  { accent: "#2EB67D", icon: "🧠", title: "AI that listens", body: "Nudge reads the room — task history, comments, team patterns — before it ever sends a reminder." },
  { accent: "#ECB22E", icon: "🎯", title: "One signal, not noise", body: "One nudge per stalled task. Not a digest. Not a badge. The exact message to the exact person." },
  { accent: "#E01E5A", icon: "📊", title: "Live pulse board", body: "Your team's velocity as a heartbeat. Instantly see what's moving and what's flatlining." },
  { accent: "#A259FF", icon: "🔗", title: "Every tool, one thread", body: "GitHub, Figma, Slack, Linear — every artefact linked on the task, not buried in a thread." },
];

function HorizontalCards() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const xPct = useTransform(scrollYProgress, [0, 1], ["0%", "-70%"]);
  const smoothX = useSpring(xPct, { stiffness: 55, damping: 20 });

  return (
    <div ref={trackRef} style={{ height: `${hCards.length * 80}vh`, position: "relative" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ position: "absolute", top: 32, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 28, height: 2, background: "#0D0D0D", display: "block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#0D0D0D" }}>Why teams switch</span>
          </div>
          <motion.div animate={{ x: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            scroll →
          </motion.div>
        </div>

        <motion.div style={{
          x: smoothX,
          display: "flex", gap: 20,
          paddingLeft: "max(24px, 4vw)",
          paddingRight: 240,
          alignItems: "center",
          willChange: "transform",
        }}>
          <div style={{ flexShrink: 0, width: "min(440px, 80vw)" }}>
            <h2 style={{
              fontSize: "clamp(36px,5.5vw,72px)", fontWeight: 800,
              lineHeight: 1.04, letterSpacing: "-0.03em", color: "#0D0D0D",
            }}>
              Everything<br />you need.<br />
              <span style={{ color: "#36C5F0" }}>Nothing</span><br />you don't.
            </h2>
          </div>

          {hCards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, boxShadow: `0 24px 60px ${c.accent}25` }}
              style={{
                flexShrink: 0, width: "min(320px, 78vw)", height: "min(400px, 60vh)",
                background: "#fff", borderRadius: 20,
                border: "1px solid #EBEBEB",
                padding: "36px 32px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                cursor: "default",
              }}
            >
              <div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${c.accent}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, marginBottom: 24,
                }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#0D0D0D", marginBottom: 12, lineHeight: 1.2 }}>
                  {c.title}
                </h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, fontWeight: 400 }}>
                  {c.body}
                </p>
              </div>
              <div style={{ width: 28, height: 3, background: c.accent, borderRadius: 2 }} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const stickyFeatures = [
  { accent: "#36C5F0", tag: "01 · Organisation", title: "Boards that\nbreathe with you", body: "Your board reorganises around urgency, blockers, and what's gone quiet. No manual grooming. It just works." },
  { accent: "#2EB67D", tag: "02 · Intelligence", title: "The nudge\nengine", body: "One precise prompt when a task stalls. The AI watches context, not just time. No noise. No badge anxiety." },
  { accent: "#ECB22E", tag: "03 · Insight", title: "Velocity, not\nvanity metrics", body: "Three numbers: shipped, stuck, at risk. That's the whole picture. Burn-down charts gather dust." },
  { accent: "#E01E5A", tag: "04 · Integration", title: "Context\ntravels", body: "PRs, designs, messages — every artefact lives on the task. No more digging through Slack threads." },
];

function FeatureVisual({ index, accent }: { index: number; accent: string }) {
  if (index === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "min(260px, 80%)" }}>
      {[
        { label: "Design tokens audit", done: true },
        { label: "API rate limiting", done: false },
        { label: "Onboarding flow v2", done: false },
        { label: "Auth refactor", done: true },
      ].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            background: item.done ? "#F0F9F4" : "#fff",
            border: `1px solid ${item.done ? "#C7EDD9" : "#EBEBEB"}`,
            borderRadius: 10, padding: "11px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            background: item.done ? "#2EB67D" : "#E8E8E2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {item.done && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: item.done ? "#059669" : "#374151" }}>{item.label}</span>
        </motion.div>
      ))}
    </div>
  );

  if (index === 1) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "min(280px, 85%)" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180 }}
        style={{
          background: "#fff", border: `2px solid ${accent}`,
          borderRadius: 14, padding: "14px 18px",
          boxShadow: `0 8px 24px ${accent}20`,
        }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Nudge AI</div>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>Hey @marcus — "API rate limiting" has been in progress for 6 days. Any blockers I can flag? 👋</p>
        <div style={{ marginTop: 10, fontSize: 11, color: "#9CA3AF" }}>just now · 1 nudge sent</div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ alignSelf: "flex-end", background: "#F9F9F7", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#6B7280" }}>
        on it — deploying a fix now ✅
      </motion.div>
    </div>
  );

  if (index === 2) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "min(260px, 80%)" }}>
      {[
        { label: "Shipped", val: 24, color: "#2EB67D", w: "75%" },
        { label: "Stuck", val: 3, color: "#E01E5A", w: "12%" },
        { label: "At risk", val: 6, color: "#ECB22E", w: "25%" },
      ].map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</span>
          </div>
          <div style={{ height: 8, background: "#F0F0EB", borderRadius: 4, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: s.w }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: "100%", background: s.color, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "min(270px, 85%)" }}>
      {[
        { icon: "🔀", label: "PR #482 merged", time: "2m ago", color: "#2EB67D" },
        { icon: "🎨", label: "Figma frame linked", time: "18m ago", color: "#A259FF" },
        { icon: "💬", label: "Slack thread attached", time: "1h ago", color: "#36C5F0" },
      ].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{
            background: "#fff", border: "1px solid #EBEBEB",
            borderRadius: 10, padding: "11px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.time}</p>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
        </motion.div>
      ))}
    </div>
  );
}

function StickyFeatures() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const activeRaw = useTransform(scrollYProgress, [0, 1], [0, stickyFeatures.length - 0.001]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const unsub = activeRaw.on("change", (v) => setActive(Math.floor(v)));
    return unsub;
  }, [activeRaw]);

  const f = stickyFeatures[active];

  return (
    <div ref={trackRef} style={{ height: `${stickyFeatures.length * 100}vh`, position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 max(20px, 4vw)",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "clamp(32px, 5vw, 80px)",
          alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <span style={{ width: 28, height: 2, background: "#0D0D0D", display: "block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>How it works</span>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 48, flexWrap: "wrap" }}>
              {stickyFeatures.map((_, i) => (
                <motion.div key={i}
                  animate={{ background: i === active ? f.accent : "#E8E8E2", width: i === active ? 28 : 10 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: 4, borderRadius: 2 }} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={active}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: f.accent, display: "block", marginBottom: 14 }}>
                  {f.tag}
                </span>
                <h2 style={{
                  fontSize: "clamp(30px, 4vw, 56px)", fontWeight: 800,
                  letterSpacing: "-0.03em", lineHeight: 1.06,
                  color: "#0D0D0D", marginBottom: 20, whiteSpace: "pre-line",
                }}>
                  {f.title}
                </h2>
                <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.72, maxWidth: 400 }}>
                  {f.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.03, y: -14 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: "min(360px, 45vw, 400px)",
                borderRadius: 20, background: "#fff",
                border: "1px solid #EBEBEB",
                boxShadow: `0 20px 72px ${f.accent}18`,
                overflow: "hidden", position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 30%, ${f.accent}15 0%, transparent 70%)` }} />
              <FeatureVisual index={active} accent={f.accent} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#F0F0EB" }}>
                <motion.div
                  key={active}
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 3, ease: "linear" }}
                  style={{ height: "100%", background: f.accent, transformOrigin: "left" }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ScrollTextReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const words = ["Your", "team", "is", "one", "nudge", "away", "from", "shipping", "more."];

  return (
    <div ref={ref} style={{ padding: "clamp(64px,10vw,120px) max(20px,4vw)" }}>
      <h2 style={{
        fontSize: "clamp(32px, 5.5vw, 76px)", fontWeight: 800,
        letterSpacing: "-0.032em", lineHeight: 1.1,
        display: "flex", flexWrap: "wrap", gap: "0 0.22em",
      }}>
        {words.map((word, i) => {
          const start = Math.min(i / words.length, 0.99);
          const end = Math.min((i + 2) / words.length, 1.0);
          return (
            <motion.span key={i}
              style={{
                opacity: useTransform(scrollYProgress, [start, end], [0.12, 1]),
                display: "inline-block",
                color: word === "nudge" ? "#36C5F0" : word === "more." ? "#2EB67D" : "#0D0D0D",
              }}>
              {word}
            </motion.span>
          );
        })}
      </h2>
    </div>
  );
}

const testimonials = [
  { quote: "Our retrospectives used to start with 'where did that ticket go?' Now they start with 'look what we shipped.'", name: "Ava Mercer", role: "Head of Product · Dune Analytics", accent: "#36C5F0" },
  { quote: "Every other tool made us work for it. Nudge works alongside us. The difference is felt on day one.", name: "Tomás Ruiz", role: "Engineering Manager · Fern", accent: "#2EB67D" },
  { quote: "I noticed our team stopped using Slack threads to track work. That said everything.", name: "Kira Johansson", role: "CTO · Luminara", accent: "#ECB22E" },
];

const plans = [
  {
    tier: "Solo", price: "0", cadence: "forever free",
    pitch: "Freelancers and side projects. No expiry.",
    lines: ["5 active projects", "Unlimited tasks", "Core views", "30-day history"],
    cta: "Start now", featured: false,
  },
  {
    tier: "Team", price: "9", cadence: "per seat / month",
    pitch: "Every feature, no ceiling, no surprises.",
    lines: ["Unlimited everything", "Nudge AI engine", "All integrations", "Custom workflows", "Priority support"],
    cta: "Try free 14 days", featured: true,
  },
  {
    tier: "Scale", price: "—", cadence: "custom",
    pitch: "For organisations that need control.",
    lines: ["SSO + SAML", "Advanced permissions", "Audit log", "Dedicated CSM", "99.9% SLA"],
    cta: "Talk to us", featured: false,
  },
];

const faqs = [
  { q: "How is Nudge different?", a: "Most tools are passive — they store work and wait. Nudge is active: it watches what's stalling and prompts the right person at the right moment. One message, not thirty reminders." },
  { q: "How does the AI avoid being annoying?", a: "Each nudge is a single contextual message. The model learns your team's rhythm and only fires when a task has genuinely gone quiet beyond your normal cadence." },
  { q: "Can I migrate from another tool?", a: "Yes. One-click import from Jira, Asana, Linear, and Trello. All tasks, comments, attachments, and history come across in under 10 minutes." },
  { q: "Is there a free tier?", a: "Always. Solo covers freelancers and small projects indefinitely. No credit card, no trial clock." },
  { q: "How is pricing calculated?", a: "Per seat per month on Team. Add or remove seats anytime — you only pay for active users. Annual billing saves two months." },
];

export default function Page() {
  const [navSolid, setNavSolid] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.97]);

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Sora', sans-serif; overflow-x: hidden; background: #F9F9F7; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #C8C8C0; border-radius: 4px; }
        a { text-decoration: none; }
        @media (hover: fine) { * { cursor: none !important; } }
        @media (max-width: 768px) { .hide-mobile { display: none !important; } }
        @media (min-width: 769px) { .hide-desktop { display: none !important; } }
      `}</style>

      <ScrollBar />
      <Cursor />

      <main style={{ fontFamily: "'Sora', sans-serif" }}>

        {/* ─── NAV ─── */}
        <motion.header
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
            display: "flex", alignItems: "center",
            background: navSolid ? "rgba(249,249,247,0.9)" : "transparent",
            backdropFilter: navSolid ? "blur(20px)" : "none",
            borderBottom: navSolid ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
            transition: "background 0.35s, border-color 0.35s",
          }}
        >
          <div style={{
            maxWidth: 1200, margin: "0 auto",
            padding: "0 max(16px, 3vw)",
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <NudgeLogo scale={0.7} />

            <nav className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
              {["How it works", "Pricing", "FAQ"].map((l) => (
                <motion.a
                  key={l}
                  href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                  style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}
                  whileHover={{ color: "#0D0D0D", y: -1 }}
                  transition={{ duration: 0.15 }}
                >
                  {l}
                </motion.a>
              ))}
            </nav>

            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/sign-in">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{
                    padding: "8px 16px", fontSize: 13, fontWeight: 700,
                    color: "#6B7280", background: "transparent", border: "none",
                  }}
                >
                  Sign in
                </motion.button>
              </Link>
              <Link href="/get-started">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: "9px 20px", fontSize: 13, fontWeight: 800,
                    color: "#fff", background: "#0D0D0D",
                    border: "none", borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  Get started
                </motion.button>
              </Link>
            </div>

            <button
              className="hide-desktop"
              onClick={() => setMobileMenu(!mobileMenu)}
              style={{
                width: 36, height: 36, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 5,
                background: "transparent", border: "none", padding: 6,
              }}
            >
              <motion.span animate={{ rotate: mobileMenu ? 45 : 0, y: mobileMenu ? 8 : 0 }}
                style={{ width: 22, height: 2, background: "#0D0D0D", borderRadius: 2, display: "block" }} />
              <motion.span animate={{ opacity: mobileMenu ? 0 : 1 }}
                style={{ width: 22, height: 2, background: "#0D0D0D", borderRadius: 2, display: "block" }} />
              <motion.span animate={{ rotate: mobileMenu ? -45 : 0, y: mobileMenu ? -6 : 0 }}
                style={{ width: 22, height: 2, background: "#0D0D0D", borderRadius: 2, display: "block" }} />
            </button>
          </div>
        </motion.header>

        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
                background: "rgba(249,249,247,0.97)", backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                padding: "20px max(16px,4vw)",
                display: "flex", flexDirection: "column", gap: 4,
              }}
            >
              {["How it works", "Pricing", "FAQ"].map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => setMobileMenu(false)}
                  style={{ fontSize: 16, fontWeight: 700, color: "#0D0D0D", padding: "12px 0", borderBottom: "1px solid #F0F0EC" }}>
                  {l}
                </a>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <Link href="/sign-in" style={{ flex: 1 }}>
                  <button style={{
                    width: "100%", padding: "12px", fontSize: 14, fontWeight: 700,
                    color: "#374151", background: "#F5F5F2", border: "none", borderRadius: 10,
                  }}>Sign in</button>
                </Link>
                <Link href="/get-started" style={{ flex: 1 }}>
                  <button style={{
                    width: "100%", padding: "12px", fontSize: 14, fontWeight: 800,
                    color: "#fff", background: "#0D0D0D", border: "none", borderRadius: 10,
                  }}>Get started</button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── HERO ─── */}
        <section ref={heroRef} style={{
          position: "relative", minHeight: "100vh",
          display: "flex", alignItems: "center", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute", top: "5%", left: "55%",
                width: "clamp(300px,50vw,600px)", height: "clamp(250px,40vw,500px)",
                borderRadius: "50%",
                background: "radial-gradient(ellipse,rgba(54,197,240,0.12) 0%,transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, -4, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              style={{
                position: "absolute", top: "40%", left: "5%",
                width: "clamp(250px,40vw,500px)", height: "clamp(200px,32vw,400px)",
                borderRadius: "50%",
                background: "radial-gradient(ellipse,rgba(46,182,125,0.08) 0%,transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div style={{
              position: "absolute", inset: 0, opacity: 0.28,
              backgroundImage: "radial-gradient(#c8c8c0 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
          </div>

          <motion.div style={{
            opacity: heroOpacity, scale: heroScale,
            position: "relative", maxWidth: 1200, margin: "0 auto",
            padding: "clamp(90px,12vh,120px) max(20px,4vw) clamp(60px,8vh,100px)",
            width: "100%",
          }}>
  

            <h1 style={{
              fontSize: "clamp(40px, 7vw, 92px)", fontWeight: 800,
              lineHeight: 1.01, letterSpacing: "-0.035em", color: "#0D0D0D",
              maxWidth: 860, marginBottom: 28,
            }}>
              {["The", "tool", "that", "actually", "moves", "your", "team", "forward."].map((w, i) => (
                <motion.span key={i}
                  initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: "inline-block", marginRight: "0.22em",
                    color: w === "actually" ? "#36C5F0" : w === "forward." ? "#2EB67D" : "#0D0D0D",
                  }}>
                  {w}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: "clamp(15px,2vw,19px)", fontWeight: 400,
                color: "#6B7280", maxWidth: 500, lineHeight: 1.72, marginBottom: 44,
              }}
            >
              Nudge watches your work, finds what's stalling, and sends the one message that unsticks it. No noise. Just momentum.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 72 }}
            >
              <motion.button
                whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.22)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  fontSize: "clamp(13px,1.5vw,15px)", fontWeight: 800, color: "#fff",
                  background: "#0D0D0D", border: "none",
                  padding: "clamp(13px,1.5vw,17px) clamp(24px,3vw,40px)",
                  borderRadius: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.16)",
                  letterSpacing: "0.01em", whiteSpace: "nowrap",
                }}
              >
                Start free — no card needed
              </motion.button>
              <motion.a
                href="#how-it-works"
                style={{ fontSize: 14, fontWeight: 600, color: "#36C5F0", display: "flex", alignItems: "center", gap: 6 }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                See how it works
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>→</motion.span>
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.95 }}
              style={{
                display: "flex", gap: "clamp(24px,4vw,56px)", flexWrap: "wrap",
                paddingTop: 40, borderTop: "1px solid #E8E8E2",
              }}
            >
              {[
                { val: 14, suffix: "k+", label: "Teams active", accent: "#36C5F0", isK: true },
                { val: 98, suffix: "%", label: "6-month retention", accent: "#2EB67D" },
                { val: 34, suffix: "×", label: "Faster resolution", accent: "#ECB22E", display: "3.4×" },
                { val: 0, suffix: "", label: "Unwanted pings", accent: "#E01E5A" },
              ].map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + i * 0.07 }}>
                  <div style={{
                    fontSize: "clamp(32px,4vw,44px)", fontWeight: 800,
                    letterSpacing: "-0.04em", color: s.accent, lineHeight: 1,
                  }}>
                    {s.display ? s.display : <><CountUp to={s.val} />{s.suffix}</>}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "#9CA3AF",
                    textTransform: "uppercase", letterSpacing: "0.11em", marginTop: 6,
                  }}>{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ─── TICKER ─── */}
        <div style={{ background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Ticker />
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <Ticker reverse />
          </div>
        </div>

        {/* ─── STICKY FEATURES ─── */}
        <div id="how-it-works" style={{ background: "#F9F9F7" }}>
          <StickyFeatures />
        </div>

        {/* ─── HORIZONTAL CARDS ─── */}
        <div style={{ background: "#F9F9F7" }}>
          <HorizontalCards />
        </div>

        {/* ─── SCROLL TEXT REVEAL ─── */}
        <div style={{ background: "#F9F9F7", borderTop: "1px solid #EBEBEB", borderBottom: "1px solid #EBEBEB", maxWidth: 1200, margin: "0 auto" }}>
          <ScrollTextReveal />
        </div>

        {/* ─── TESTIMONIALS ─── */}
        <section style={{ background: "#0D0D0D", padding: "clamp(64px,10vh,120px) 0", position: "relative", overflow: "hidden" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: "min(1000px, 150vw)", height: "min(1000px, 150vw)",
              borderRadius: "50%", border: "1px solid rgba(255,255,255,0.025)",
              transform: "translate(-50%,-50%)", pointerEvents: "none",
            }}
          />
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 max(20px,4vw)" }}>
            <Reveal>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 64 }}>
                <span style={{ width: 28, height: 2, background: "rgba(255,255,255,0.2)", display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Real teams</span>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))", gap: 2 }}>
              {testimonials.map((t, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ background: "#161616", y: -4 }}
                  style={{
                    padding: "clamp(28px,4vw,52px) clamp(24px,4vw,44px)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    cursor: "default",
                  }}>
                  <div style={{ fontSize: 72, lineHeight: 0.8, color: t.accent, fontWeight: 800, opacity: 0.5, marginBottom: 24 }}>"</div>
                  <p style={{ fontSize: "clamp(14px,1.5vw,17px)", fontWeight: 500, color: "rgba(255,255,255,0.82)", lineHeight: 1.7, marginBottom: 36 }}>
                    {t.quote}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", background: t.accent, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: "#fff",
                    }}>
                      {t.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" style={{ padding: "clamp(64px,10vh,120px) 0", background: "#F9F9F7" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 max(20px,4vw)" }}>
            <Reveal>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ width: 28, height: 2, background: "#0D0D0D", display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Pricing</span>
              </div>
              <h2 style={{ fontSize: "clamp(34px,5vw,64px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 64, lineHeight: 1.06, maxWidth: 500 }}>
                Honest pricing.<br />No gotchas.
              </h2>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px,100%), 1fr))", gap: 16 }}>
              {plans.map((p, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, boxShadow: p.featured ? "0 24px 60px rgba(0,0,0,0.28)" : "0 16px 44px rgba(0,0,0,0.1)" }}
                  style={{
                    padding: "clamp(28px,4vw,48px) clamp(24px,4vw,44px)",
                    background: p.featured ? "#0D0D0D" : "#fff",
                    border: p.featured ? "none" : "1px solid #E8E8E2",
                    borderRadius: 20, position: "relative",
                    boxShadow: p.featured ? "0 12px 40px rgba(0,0,0,0.18)" : "0 2px 12px rgba(0,0,0,0.04)",
                    cursor: "default",
                  }}
                >
                  {p.featured && (
                    <div style={{
                      position: "absolute", top: 18, right: 18,
                      background: "#36C5F0", color: "#fff",
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                      padding: "4px 12px", borderRadius: 100,
                    }}>
                      Most popular
                    </div>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: p.featured ? "rgba(255,255,255,0.3)" : "#9CA3AF", marginBottom: 28 }}>
                    {p.tier}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                    {p.price !== "—" && <span style={{ fontSize: 14, fontWeight: 700, color: p.featured ? "rgba(255,255,255,0.35)" : "#9CA3AF" }}>$</span>}
                    <span style={{ fontSize: "clamp(48px,6vw,64px)", fontWeight: 800, letterSpacing: "-0.04em", color: p.featured ? "#fff" : "#0D0D0D", lineHeight: 1 }}>
                      {p.price}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: p.featured ? "rgba(255,255,255,0.28)" : "#9CA3AF", marginBottom: 20 }}>{p.cadence}</p>
                  <p style={{
                    fontSize: 14, color: p.featured ? "rgba(255,255,255,0.5)" : "#6B7280",
                    lineHeight: 1.6, marginBottom: 28, paddingBottom: 28,
                    borderBottom: `1px solid ${p.featured ? "rgba(255,255,255,0.07)" : "#F0F0EC"}`,
                  }}>{p.pitch}</p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                    {p.lines.map((line, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, color: p.featured ? "rgba(255,255,255,0.72)" : "#374151" }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: p.featured ? "rgba(54,197,240,0.12)" : "#F0FAF5",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5l2 2 4-4" stroke={p.featured ? "#36C5F0" : "#2EB67D"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 100,
                      fontWeight: 800, fontSize: 14, border: "none",
                      background: p.featured ? "#36C5F0" : "#0D0D0D", color: "#fff",
                      fontFamily: "'Sora',sans-serif",
                    }}
                  >
                    {p.cta}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" style={{ background: "#F0F0EB", padding: "clamp(64px,10vh,112px) 0" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 max(20px,4vw)" }}>
            <Reveal>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ width: 28, height: 2, background: "#0D0D0D", display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>FAQ</span>
              </div>
              <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 56 }}>Good questions.</h2>
            </Reveal>
            {faqs.map((item, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div style={{ borderBottom: "1px solid #D8D8D0" }}>
                  <motion.button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%", textAlign: "left", background: "none", border: "none",
                      padding: "22px 0", display: "flex", justifyContent: "space-between",
                      alignItems: "center", gap: 20, cursor: "default",
                    }}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span style={{ fontSize: "clamp(14px,1.5vw,16px)", fontWeight: 700, color: "#0D0D0D", lineHeight: 1.35, flex: 1 }}>
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 45 : 0, background: openFaq === i ? "#0D0D0D" : "transparent" }}
                      transition={{ duration: 0.2 }}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: "1.5px solid #C8C8C0",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M5.5 2v7M2 5.5h7" stroke={openFaq === i ? "#fff" : "#9CA3AF"} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </motion.span>
                  </motion.button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, paddingBottom: 24, overflow: "hidden" }}
                      >
                        {item.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section style={{ background: "#0D0D0D", padding: "clamp(80px,12vh,140px) 0", position: "relative", overflow: "hidden" }}>
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.06, 0.11, 0.06] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: "clamp(300px,60vw,700px)", height: "clamp(200px,45vw,500px)",
              borderRadius: "50%",
              background: "radial-gradient(ellipse,#36C5F0 0%,transparent 70%)",
              transform: "translate(-50%,-50%)", filter: "blur(60px)", pointerEvents: "none",
            }}
          />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 max(20px,4vw)", textAlign: "center", position: "relative" }}>
            <Reveal>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}>
                <NudgeLogo scale={1} dark />
              </div>
              <h2 style={{ fontSize: "clamp(36px,6vw,76px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.03, marginBottom: 24 }}>
                Your team is one<br />nudge away.
              </h2>
              <p style={{ fontSize: "clamp(14px,1.8vw,17px)", color: "rgba(255,255,255,0.38)", lineHeight: 1.7, marginBottom: 48, maxWidth: 440, margin: "0 auto 48px" }}>
                14,000 teams ship faster. Start free — 3 minutes to onboard your whole team.
              </p>
              <motion.button
                whileHover={{ y: -3, boxShadow: "0 8px 36px rgba(255,255,255,0.16)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  fontSize: "clamp(14px,1.6vw,16px)", fontWeight: 800, color: "#0D0D0D",
                  background: "#fff", border: "none",
                  padding: "clamp(15px,2vw,20px) clamp(32px,4vw,52px)",
                  borderRadius: 100, boxShadow: "0 4px 28px rgba(255,255,255,0.1)",
                  fontFamily: "'Sora',sans-serif",
                }}
              >
                Start for free — no card needed
              </motion.button>
              <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
                Free forever on Solo · Cancel Team anytime
              </p>
            </Reveal>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "28px max(20px,4vw)" }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto",
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between", gap: 20,
          }}>
            <NudgeLogo scale={0.58} dark />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
              {["Privacy", "Terms", "Changelog", "Status", "Blog"].map((l) => (
                <motion.a key={l} href="#"
                  style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.2)" }}
                  whileHover={{ color: "rgba(255,255,255,0.7)" }}
                  transition={{ duration: 0.15 }}>
                  {l}
                </motion.a>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.14)" }}>© 2026 Nudge Inc.</p>
          </div>
        </footer>

      </main>
    </>
  );
}