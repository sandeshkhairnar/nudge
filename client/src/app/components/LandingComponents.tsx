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

const PX = "clamp(24px, 5vw, 80px)";

export function NudgeLogo({ scale = 1 }: { scale?: number }) {
  const uid = useRef(`logo-${Math.random().toString(36).slice(2, 7)}`).current;
  return (
    <svg width={200 * scale} height={52 * scale} viewBox="0 0 200 52" fill="none" style={{ display: "block" }}>
      <g id={uid}>
        <rect x="6" y="6" width="15" height="15" rx="7.5" fill="#36C5F0" />
        <rect x="6" y="23" width="15" height="15" rx="4" fill="#36C5F0" opacity="0.4" />
        <rect x="23" y="6" width="15" height="15" rx="4" fill="#2EB67D" opacity="0.4" />
        <rect x="23" y="23" width="15" height="15" rx="7.5" fill="#2EB67D" />
        <animateTransform href={`#${uid}`} attributeName="transform" type="rotate" values="0 22 22;-360 22 22" dur="8s" repeatCount="indefinite" />
      </g>
      <text x="50" y="35" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="26" fill="#ffffff" letterSpacing="-0.8">nudge</text>
    </svg>
  );
}

export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, background: "linear-gradient(90deg,#36C5F0,#2EB67D,#ECB22E)", scaleX, transformOrigin: "0%" }} />;
}

const TICKS = ["Move tasks forward", "Ship without chaos", "Real-time clarity", "No stuck tickets", "AI that nudges", "Built for teams"];

export function Ticker({ reverse = false }: { reverse?: boolean }) {
  const x = useMotionValue(0);
  const trackW = useRef(0);
  const cRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (cRef.current) trackW.current = cRef.current.scrollWidth / 2; }, []);
  useAnimationFrame((_, delta) => {
    const d = reverse ? 1 : -1;
    const n = x.get() + d * delta * 0.045;
    if (!reverse && n <= -trackW.current) x.set(0);
    else if (reverse && n >= 0) x.set(-trackW.current);
    else x.set(n);
  });
  const items = [...TICKS, ...TICKS, ...TICKS, ...TICKS];
  return (
    <div style={{ overflow: "hidden", padding: "10px 0" }}>
      <motion.div ref={cRef} style={{ x, display: "flex", whiteSpace: "nowrap" }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "0 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: reverse ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.2)" }}>
            {t}<span style={{ color: reverse ? "#2EB67D" : "#36C5F0", fontSize: 8 }}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function Reveal({ children, delay = 0, y = 40 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}

export function Reveal3D({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 60, rotateX: 15, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
    >{children}</motion.div>
  );
}

export function CountUp({ to, suffix = "", duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => { const p = Math.min((now - start) / (duration * 1000), 1); setVal(Math.round((1 - Math.pow(1 - p, 4)) * to)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ──── Feature visuals ──── */
export function FeatureVisual({ index, accent }: { index: number; accent: string }) {
  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "11px 14px", display: "flex" as const, alignItems: "center" as const, gap: 10 };
  if (index === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "min(260px, 80%)" }}>
      {[{ l: "Design tokens audit", d: true }, { l: "API rate limiting", d: false }, { l: "Onboarding flow v2", d: false }, { l: "Auth refactor", d: true }].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20, rotateY: -8 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ delay: i * 0.1 }}
          style={{ ...card, background: item.d ? "rgba(46,182,125,0.06)" : card.background, border: `1px solid ${item.d ? "rgba(46,182,125,0.18)" : "rgba(255,255,255,0.06)"}` }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: item.d ? "#2EB67D" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {item.d && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: item.d ? "#2EB67D" : "rgba(255,255,255,0.65)" }}>{item.l}</span>
        </motion.div>
      ))}
    </div>
  );
  if (index === 1) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "min(280px, 85%)" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180 }}
        style={{ background: "rgba(255,255,255,0.03)", border: `2px solid ${accent}`, borderRadius: 14, padding: "14px 18px", boxShadow: `0 8px 24px ${accent}18` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Nudge AI</div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Hey @marcus — &quot;API rate limiting&quot; stalled for 6 days. Blockers? 👋</p>
        <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>just now · 1 nudge sent</div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ alignSelf: "flex-end", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
        on it — deploying fix now ✅
      </motion.div>
    </div>
  );
  if (index === 2) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "min(260px, 80%)" }}>
      {[{ l: "Shipped", v: 24, c: "#2EB67D", w: "75%" }, { l: "Stuck", v: 3, c: "#E01E5A", w: "12%" }, { l: "At risk", v: 6, c: "#ECB22E", w: "25%" }].map((s, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{s.l}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: s.c }}>{s.v}</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: s.w }} transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ height: "100%", background: s.c, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "min(270px, 85%)" }}>
      {[{ i: "🔀", l: "PR #482 merged", t: "2m ago", c: "#2EB67D" }, { i: "🎨", l: "Figma frame linked", t: "18m ago", c: "#A259FF" }, { i: "💬", l: "Slack thread attached", t: "1h ago", c: "#36C5F0" }].map((item, j) => (
        <motion.div key={j} initial={{ opacity: 0, x: 20, rotateY: 6 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ delay: j * 0.1 }}
          style={{ ...card }}>
          <span style={{ fontSize: 16 }}>{item.i}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.l}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{item.t}</p>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.c, flexShrink: 0 }} />
        </motion.div>
      ))}
    </div>
  );
}

/* ──── Sticky features ──── */
const stickyFeatures = [
  { accent: "#36C5F0", tag: "01 · Organisation", title: "Boards that\nbreathe with you", body: "Your board reorganises around urgency, blockers, and what's gone quiet. No manual grooming." },
  { accent: "#2EB67D", tag: "02 · Intelligence", title: "The nudge\nengine", body: "One precise prompt when a task stalls. The AI watches context, not just time. No noise." },
  { accent: "#ECB22E", tag: "03 · Insight", title: "Velocity, not\nvanity metrics", body: "Three numbers: shipped, stuck, at risk. That's the whole picture." },
  { accent: "#E01E5A", tag: "04 · Integration", title: "Context\ntravels", body: "PRs, designs, messages — every artefact lives on the task, not buried in a thread." },
];

export function StickyFeatures() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const activeRaw = useTransform(scrollYProgress, [0, 1], [0, stickyFeatures.length - 0.001]);
  const [active, setActive] = useState(0);
  useEffect(() => { const u = activeRaw.on("change", (v) => setActive(Math.floor(v))); return u; }, [activeRaw]);
  const f = stickyFeatures[active];
  return (
    <div ref={trackRef} style={{ height: `${stickyFeatures.length * 100}vh`, position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${PX}`, width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "clamp(32px,5vw,80px)", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <span style={{ width: 28, height: 2, background: "rgba(255,255,255,0.15)", display: "block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>How it works</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 48, flexWrap: "wrap" }}>
              {stickyFeatures.map((_, i) => (
                <motion.div key={i} animate={{ background: i === active ? f.accent : "rgba(255,255,255,0.08)", width: i === active ? 28 : 10 }} transition={{ duration: 0.28 }} style={{ height: 4, borderRadius: 2 }} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 30, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -20, rotateX: -5 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ perspective: 800 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: f.accent, display: "block", marginBottom: 14 }}>{f.tag}</span>
                <h2 style={{ fontSize: "clamp(30px,4vw,56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.06, color: "#fff", marginBottom: 20, whiteSpace: "pre-line" }}>{f.title}</h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", lineHeight: 1.72, maxWidth: 400 }}>{f.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, scale: 0.9, rotateY: 10 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 1.04, rotateY: -6 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: "min(360px,45vw,400px)", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: `0 20px 72px ${f.accent}10`, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", perspective: 800, transformStyle: "preserve-3d" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 30%, ${f.accent}0a 0%, transparent 70%)` }} />
              <FeatureVisual index={active} accent={f.accent} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.04)" }}>
                <motion.div key={active} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 3, ease: "linear" }} style={{ height: "100%", background: f.accent, transformOrigin: "left" }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ──── Horizontal cards (carousel) ──── */
const hCards = [
  { accent: "#36C5F0", accentRgb: "54,197,240", icon: "⚡", title: "Zero-config setup", body: "Connect your team in 3 minutes. No CSV uploads, no onboarding calls, no IT tickets.", stat: "3 min", statLabel: "avg setup" },
  { accent: "#2EB67D", accentRgb: "46,182,125", icon: "🧠", title: "AI that listens", body: "Nudge reads task history, comments, team patterns — before it ever sends a reminder.", stat: "97%", statLabel: "accuracy" },
  { accent: "#ECB22E", accentRgb: "236,178,46", icon: "🎯", title: "One signal, not noise", body: "One nudge per stalled task. Not a digest. Not a badge. The exact message to the exact person.", stat: "1:1", statLabel: "signal ratio" },
  { accent: "#E01E5A", accentRgb: "224,30,90", icon: "📊", title: "Live pulse board", body: "Your team's velocity as a heartbeat. Instantly see what's moving and what's flatlining.", stat: "Live", statLabel: "real-time" },
  { accent: "#A259FF", accentRgb: "162,89,255", icon: "🔗", title: "Every tool, one thread", body: "GitHub, Figma, Slack, Linear — every artefact linked on the task, not buried in a thread.", stat: "12+", statLabel: "integrations" },
];

function CardTilt({ children, accent }: { children: React.ReactNode; accent: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 180, damping: 18 });
  const sRotY = useSpring(rotY, { stiffness: 180, damping: 18 });
  const glow = useMotionValue("transparent");
  const shine = useMotionValue("transparent");

  const handleMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotY.set(px * 16);
    rotX.set(-py * 12);
    glow.set(`radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, ${accent}22 0%, transparent 55%)`);
    shine.set(`radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.06) 0%, transparent 40%)`);
  };
  const handleLeave = () => { rotX.set(0); rotY.set(0); glow.set("transparent"); shine.set("transparent"); };

  return (
    <motion.div ref={cardRef}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: "preserve-3d", perspective: 1000, position: "relative" }}>
      <motion.div style={{ position: "absolute", inset: -1, borderRadius: 28, background: glow, pointerEvents: "none", zIndex: 0 }} />
      <motion.div style={{ position: "absolute", inset: 0, borderRadius: 28, background: shine, pointerEvents: "none", zIndex: 2 }} />
      {children}
    </motion.div>
  );
}

export function HorizontalCards() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const xPct = useTransform(scrollYProgress, [0, 1], ["2%", "-75%"]);
  const smoothX = useSpring(xPct, { stiffness: 40, damping: 24 });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const bgHue = useTransform(scrollYProgress, [0, 0.5, 1], [195, 160, 270]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={trackRef} style={{ height: `${hCards.length * 100}vh`, position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center" }}>

        {/* ── Animated background blob ── */}
        <motion.div style={{
          position: "absolute", top: "30%", left: "40%", width: "clamp(500px,70vw,1000px)", height: "clamp(400px,55vw,800px)",
          borderRadius: "40% 60% 55% 45% / 50% 40% 60% 50%",
          opacity: bgOpacity,
          filter: "blur(100px)", pointerEvents: "none",
          background: useTransform(bgHue, (h) => `radial-gradient(ellipse, hsla(${h},70%,50%,0.04) 0%, transparent 70%)`),
        }} />

        {/* ── Floating ambient dots ── */}
        {[...Array(6)].map((_, i) => (
          <motion.div key={`dot-${i}`}
            animate={{ y: [0, -30 - i * 8, 0], x: [0, (i % 2 === 0 ? 15 : -15), 0], opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
            style={{
              position: "absolute",
              top: `${15 + i * 14}%`, left: `${10 + i * 16}%`,
              width: 4 + i * 2, height: 4 + i * 2, borderRadius: "50%",
              background: ["#36C5F0", "#2EB67D", "#ECB22E", "#E01E5A", "#A259FF", "#36C5F0"][i],
              pointerEvents: "none",
            }} />
        ))}

        {/* ── Top header ── */}
        <div style={{ position: "absolute", top: 24, left: PX, right: PX, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.div
              animate={{ width: [28, 52, 28] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ height: 2, background: "linear-gradient(90deg, #36C5F0, #2EB67D, #A259FF)", display: "block", borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Why teams switch</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <motion.div animate={{ x: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span>scroll</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M11 5l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </motion.div>
          </div>
        </div>

        {/* ── Bottom progress bar ── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.03)", zIndex: 3 }}>
          <motion.div style={{ height: "100%", width: progressWidth, background: "linear-gradient(90deg, #36C5F0, #2EB67D, #ECB22E, #A259FF)", borderRadius: "0 2px 2px 0" }} />
        </div>

        {/* ── Cards track ── */}
        <motion.div style={{ x: smoothX, display: "flex", gap: 28, paddingLeft: PX, paddingRight: 400, alignItems: "center", willChange: "transform" }}>

          {/* Hero text block */}
          <div style={{ flexShrink: 0, width: "min(520px, 88vw)", paddingRight: 32 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(54,197,240,0.06)", border: "1px solid rgba(54,197,240,0.12)", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#36C5F0" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#36C5F0" }}>Features</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{ fontSize: "clamp(40px,6vw,80px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.035em", color: "#fff", marginBottom: 28 }}>
              Everything<br />you need.<br />
              <span style={{ position: "relative", display: "inline-block" }}>
                <span style={{ background: "linear-gradient(135deg, #36C5F0, #2EB67D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nothing</span>
                <motion.span
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: "absolute", bottom: 2, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #36C5F0, #2EB67D)", borderRadius: 2, transformOrigin: "left", opacity: 0.3 }} />
              </span><br />
              you don&apos;t.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.25 }}
              style={{ fontSize: 16, color: "rgba(255,255,255,0.28)", lineHeight: 1.75, maxWidth: 380 }}>
              Every feature is designed to reduce noise and increase your team&apos;s shipping momentum.
            </motion.p>
          </div>

          {/* Cards */}
          {hCards.map((c, i) => (
            <CardTilt key={i} accent={c.accent}>
              <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.88, rotateY: 8, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateY: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ delay: i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  flexShrink: 0, width: "min(380px, 82vw)", height: "min(560px, 80vh)",
                  background: "rgba(255,255,255,0.018)", borderRadius: 28,
                  border: `1px solid rgba(${c.accentRgb},0.08)`,
                  padding: "44px 38px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  boxShadow: `0 12px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(${c.accentRgb},0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  cursor: "default", position: "relative", overflow: "hidden",
                }}>

                {/* Animated corner glow */}
                <motion.div
                  animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                  style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${c.accent} 0%, transparent 70%)`, pointerEvents: "none" }} />

                {/* Bottom glow */}
                <motion.div
                  animate={{ opacity: [0.02, 0.05, 0.02] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                  style={{ position: "absolute", bottom: -40, left: "20%", width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${c.accent} 0%, transparent 70%)`, pointerEvents: "none" }} />

                {/* Card number watermark */}
                <div style={{ position: "absolute", top: 16, right: 24, fontSize: 80, fontWeight: 800, color: "rgba(255,255,255,0.015)", lineHeight: 1, pointerEvents: "none", letterSpacing: "-0.04em" }}>
                  0{i + 1}
                </div>

                {/* Content */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Icon with glow ring */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                    style={{ position: "relative", width: 64, height: 64, marginBottom: 36 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: `linear-gradient(145deg, rgba(${c.accentRgb},0.15), rgba(${c.accentRgb},0.04))`,
                      border: `1px solid rgba(${c.accentRgb},0.15)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, position: "relative", zIndex: 1,
                    }}>{c.icon}</div>
                    <div style={{ position: "absolute", inset: -4, borderRadius: 22, border: `1px solid rgba(${c.accentRgb},0.06)`, pointerEvents: "none" }} />
                  </motion.div>

                  {/* Title */}
                  <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", color: "#fff", marginBottom: 18, lineHeight: 1.2 }}>{c.title}</h3>

                  {/* Body */}
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", lineHeight: 1.8, fontWeight: 400, letterSpacing: "0.005em" }}>{c.body}</p>
                </div>

                {/* Bottom section */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Stat highlight */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: c.accent, letterSpacing: "-0.03em" }}>{c.stat}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{c.statLabel}</span>
                  </div>

                  {/* Divider with animated accent */}
                  <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.04)", borderRadius: 1, marginBottom: 6, position: "relative", overflow: "hidden" }}>
                    <motion.div
                      initial={{ x: "-100%" }}
                      whileInView={{ x: "100%" }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }} />
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "35%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: 3, background: `linear-gradient(90deg, ${c.accent}, rgba(${c.accentRgb},0.2))`, borderRadius: 2, marginBottom: 16 }} />

                  {/* CTA row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.18)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Learn more</span>
                    <motion.div
                      whileHover={{ x: 4, scale: 1.15, background: `rgba(${c.accentRgb},0.1)` }}
                      transition={{ duration: 0.2 }}
                      style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid rgba(${c.accentRgb},0.12)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                        <path d="M2 8L8 2M8 2H3M8 2V7" stroke={c.accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </CardTilt>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function ScrollTextReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const words = ["Your", "team", "is", "one", "nudge", "away", "from", "shipping", "more."];
  return (
    <div ref={ref} style={{ padding: `clamp(64px,10vw,120px) ${PX}` }}>
      <h2 style={{ fontSize: "clamp(32px,5.5vw,76px)", fontWeight: 800, letterSpacing: "-0.032em", lineHeight: 1.1, display: "flex", flexWrap: "wrap", gap: "0 0.22em" }}>
        {words.map((word, i) => {
          const s = Math.min(i / words.length, 0.99);
          const e = Math.min((i + 2) / words.length, 1.0);
          return <motion.span key={i} style={{ opacity: useTransform(scrollYProgress, [s, e], [0.1, 1]), display: "inline-block", color: word === "nudge" ? "#36C5F0" : word === "more." ? "#2EB67D" : "#fff" }}>{word}</motion.span>;
        })}
      </h2>
    </div>
  );
}
