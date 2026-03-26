"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { HiRocketLaunch, HiUsers, HiArrowTrendingUp, HiBolt, HiBellSlash } from "react-icons/hi2";
import LiquidDrop from "./components/LiquidDrop";
import {
  NudgeLogo, ScrollBar, Ticker, Reveal, Reveal3D, CountUp,
  StickyFeatures, HorizontalCards, ScrollTextReveal,
} from "./components/LandingComponents";

const PX = "clamp(24px, 5vw, 80px)";

const testimonials = [
  { quote: "Our retrospectives used to start with 'where did that ticket go?' Now they start with 'look what we shipped.'", name: "Ava Mercer", role: "Head of Product · Dune Analytics", accent: "#36C5F0" },
  { quote: "Every other tool made us work for it. Nudge works alongside us. The difference is felt on day one.", name: "Tomás Ruiz", role: "Engineering Manager · Fern", accent: "#2EB67D" },
  { quote: "I noticed our team stopped using Slack threads to track work. That said everything.", name: "Kira Johansson", role: "CTO · Luminara", accent: "#ECB22E" },
];

const plans = [
  { tier: "Solo", price: "0", cadence: "forever free", pitch: "Freelancers and side projects. No expiry.", lines: ["5 active projects", "Unlimited tasks", "Core views", "30-day history"], cta: "Start now", featured: false },
  { tier: "Team", price: "9", cadence: "per seat / month", pitch: "Every feature, no ceiling, no surprises.", lines: ["Unlimited everything", "Nudge AI engine", "All integrations", "Custom workflows", "Priority support"], cta: "Try free 14 days", featured: true },
  { tier: "Scale", price: "—", cadence: "custom", pitch: "For organisations that need control.", lines: ["SSO + SAML", "Advanced permissions", "Audit log", "Dedicated CSM", "99.9% SLA"], cta: "Talk to us", featured: false },
];

const faqs = [
  { q: "How is Nudge different?", a: "Most tools are passive — they store work and wait. Nudge is active: it watches what's stalling and prompts the right person." },
  { q: "How does the AI avoid being annoying?", a: "Each nudge is a single contextual message. The model learns your team's rhythm and only fires when a task has gone quiet." },
  { q: "Can I migrate from another tool?", a: "Yes. One-click import from Jira, Asana, Linear, and Trello. Everything comes across in under 10 minutes." },
  { q: "Is there a free tier?", a: "Always. Solo covers freelancers and small projects indefinitely. No credit card, no trial clock." },
  { q: "How is pricing calculated?", a: "Per seat per month on Team. Add or remove seats anytime — you only pay for active users." },
];

export default function Page() {
  const [navSolid, setNavSolid] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.96]);
  const heroRotX = useTransform(heroScroll, [0, 1], [0, 4]);

  /* Locomotive Scroll (smooth scrolling) */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let locoScroll: any;
    (async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      locoScroll = new LocomotiveScroll({
        lenisOptions: { lerp: 0.07, duration: 1.2, smoothWheel: true },
      });
    })();
    return () => { if (locoScroll) locoScroll.destroy(); };
  }, []);

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div ref={containerRef}>
      <main style={{ fontFamily: "var(--font-sora), 'Sora', sans-serif", background: "#050510", color: "#ededed" }}>
        <ScrollBar />

        {/* ─── NAV ─── */}
        <motion.header initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
            display: "flex", alignItems: "center",
            background: navSolid ? "rgba(5,5,16,0.85)" : "transparent",
            backdropFilter: navSolid ? "blur(24px)" : "none",
            borderBottom: navSolid ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
            transition: "background 0.35s, border-color 0.35s, backdrop-filter 0.35s",
          }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${PX}`, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <NudgeLogo scale={0.7} />
            <nav className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
              {["How it works", "Pricing", "FAQ"].map((l) => (
                <motion.a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                  style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}
                  whileHover={{ color: "#fff", y: -1 }} transition={{ duration: 0.15 }}>{l}</motion.a>
              ))}
            </nav>
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/sign-in">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer" }}>Login</motion.button>
              </Link>
              <Link href="/get-started">
                <motion.button whileHover={{ scale: 1.04, boxShadow: "0 4px 20px rgba(54,197,240,0.3)" }} whileTap={{ scale: 0.96 }}
                  style={{ padding: "9px 20px", fontSize: 13, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#36C5F0,#2EB67D)", border: "none", borderRadius: 8, cursor: "pointer", boxShadow: "0 2px 12px rgba(54,197,240,0.2)" }}>Sign up</motion.button>
              </Link>
            </div>
            <button className="hide-desktop" onClick={() => setMobileMenu(!mobileMenu)}
              style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, background: "transparent", border: "none", padding: 6, cursor: "pointer" }}>
              <motion.span animate={{ rotate: mobileMenu ? 45 : 0, y: mobileMenu ? 8 : 0 }} style={{ width: 22, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
              <motion.span animate={{ opacity: mobileMenu ? 0 : 1 }} style={{ width: 22, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
              <motion.span animate={{ rotate: mobileMenu ? -45 : 0, y: mobileMenu ? -6 : 0 }} style={{ width: 22, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
            </button>
          </div>
        </motion.header>

        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 99, background: "rgba(5,5,16,0.95)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: `20px ${PX}`, display: "flex", flexDirection: "column", gap: 4 }}>
              {["How it works", "Pricing", "FAQ"].map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMobileMenu(false)}
                  style={{ fontSize: 16, fontWeight: 700, color: "#fff", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{l}</a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── HERO ─── */}
        <section ref={heroRef} data-scroll-section style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 40%, rgba(54,197,240,0.04) 0%, transparent 60%)" }} />
          <motion.div style={{ opacity: heroOpacity, scale: heroScale, rotateX: heroRotX, position: "relative", width: "100%", minHeight: "100vh", perspective: 1200, transformStyle: "preserve-3d" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 2, padding: `120px ${PX} 60px` }}>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6 }}
                style={{ marginBottom: 28 }}>
                <motion.div
                  animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, rgba(54,197,240,0.15), rgba(46,182,125,0.1))", border: "1px solid rgba(54,197,240,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(54,197,240,0.1)" }}>
                  <HiRocketLaunch size={24} color="#36C5F0" />
                </motion.div>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 50, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontSize: "clamp(36px,6.5vw,82px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.035em", color: "#fff", maxWidth: 800, marginBottom: 24 }}>
                Elevate Your{" "}
                <span style={{ background: "linear-gradient(135deg,#36C5F0,#2EB67D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Team&apos;s</span><br />Experience
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                style={{ fontSize: "clamp(14px,1.8vw,18px)", fontWeight: 400, color: "rgba(255,255,255,0.42)", maxWidth: 520, lineHeight: 1.72, marginBottom: 40 }}>
                Unlock your team&apos;s potential in a fully intelligent environment, powered by Nudge AI.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <motion.button whileHover={{ y: -3, boxShadow: "0 10px 40px rgba(255,255,255,0.12)" }} whileTap={{ scale: 0.97 }}
                  style={{ fontSize: "clamp(13px,1.5vw,15px)", fontWeight: 800, color: "#050510", background: "#fff", border: "1px solid rgba(255,255,255,0.15)", padding: "clamp(14px,1.5vw,18px) clamp(28px,3vw,48px)", borderRadius: 100, boxShadow: "0 4px 20px rgba(255,255,255,0.06)", cursor: "pointer" }}>
                  Sign Up &amp; Start Free
                </motion.button>
              </motion.div>
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, paddingTop: "5vh" }}>
              <LiquidDrop />
            </div>
          </motion.div>
        </section>

        {/* ─── STATS ─── */}
        <section data-scroll-section style={{ position: "relative", padding: "clamp(56px,8vw,100px) 0", overflow: "hidden" }}>
          {/* Background gradient */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(54,197,240,0.02) 0%, rgba(5,5,16,0) 50%, rgba(46,182,125,0.02) 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "clamp(400px,60vw,800px)", height: "clamp(200px,30vw,400px)", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(54,197,240,0.03) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${PX}`, position: "relative" }}>
            {/* Section header */}
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: "clamp(40px,6vw,72px)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(54,197,240,0.05)", border: "1px solid rgba(54,197,240,0.1)", borderRadius: 100, padding: "5px 16px", marginBottom: 20 }}>
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: "#36C5F0" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#36C5F0" }}>Traction</span>
                </div>
                <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  Numbers that <span style={{ background: "linear-gradient(135deg, #36C5F0, #2EB67D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>speak</span>
                </h2>
              </div>
            </Reveal>

            {/* Stat cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px,100%), 1fr))", gap: 16 }}>
              {[
                { val: 14, suffix: "k+", label: "Teams active", accent: "#36C5F0", accentRgb: "54,197,240", icon: <HiUsers size={22} color="#36C5F0" /> },
                { val: 98, suffix: "%", label: "6-month retention", accent: "#2EB67D", accentRgb: "46,182,125", icon: <HiArrowTrendingUp size={22} color="#2EB67D" /> },
                { val: 34, suffix: "×", label: "Faster resolution", accent: "#ECB22E", accentRgb: "236,178,46", icon: <HiBolt size={22} color="#ECB22E" />, display: "3.4×" },
                { val: 0, suffix: "", label: "Unwanted pings", accent: "#E01E5A", accentRgb: "224,30,90", icon: <HiBellSlash size={22} color="#E01E5A" /> },
              ].map((s, i) => (
                <Reveal3D key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: `0 20px 50px rgba(${s.accentRgb},0.08)` }}
                    transition={{ duration: 0.25 }}
                    style={{
                      position: "relative", padding: "clamp(28px,4vw,40px) clamp(20px,3vw,32px)",
                      background: "rgba(255,255,255,0.015)",
                      border: `1px solid rgba(${s.accentRgb},0.08)`,
                      borderRadius: 20, overflow: "hidden", cursor: "default",
                      boxShadow: `0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)`,
                    }}>
                    {/* Corner glow */}
                    <motion.div
                      animate={{ opacity: [0.03, 0.08, 0.03] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                      style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${s.accent} 0%, transparent 70%)`, pointerEvents: "none" }} />

                    {/* Top row: icon + accent dot */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center" }}>{s.icon}</div>
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                        style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, boxShadow: `0 0 12px ${s.accent}` }} />
                    </div>

                    {/* Big number */}
                    <div style={{ fontSize: "clamp(36px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.04em", color: s.accent, lineHeight: 1, marginBottom: 8 }}>
                      {s.display ? s.display : <><CountUp to={s.val} />{s.suffix}</>}
                    </div>

                    {/* Label */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.label}</div>

                    {/* Bottom accent line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      style={{ marginTop: 20, height: 2, background: `linear-gradient(90deg, ${s.accent}, rgba(${s.accentRgb},0.1))`, borderRadius: 2, transformOrigin: "left" }} />
                  </motion.div>
                </Reveal3D>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TICKER ─── */}
        <div data-scroll-section style={{ position: "relative", padding: "clamp(16px,3vw,32px) 0" }}>
          {/* Top separator line with gradient */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(54,197,240,0.12) 25%, rgba(46,182,125,0.12) 50%, rgba(162,89,255,0.12) 75%, transparent 100%)" }} />
          <div style={{ padding: "clamp(12px,2vw,20px) 0" }}>
            <Ticker />
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)" }} />
          <div style={{ padding: "clamp(12px,2vw,20px) 0" }}>
            <Ticker reverse />
          </div>
          {/* Bottom separator line with gradient */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(46,182,125,0.12) 25%, rgba(236,178,46,0.12) 50%, rgba(54,197,240,0.12) 75%, transparent 100%)" }} />
        </div>

        {/* ─── FEATURES ─── */}
        <div id="how-it-works" data-scroll-section><StickyFeatures /></div>

        {/* ─── HORIZONTAL CARDS ─── */}
        <div data-scroll-section><HorizontalCards /></div>

        {/* ─── SCROLL TEXT ─── */}
        <div data-scroll-section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", maxWidth: 1200, margin: "0 auto" }}>
          <ScrollTextReveal />
        </div>

        {/* ─── TESTIMONIALS ─── */}
        <section data-scroll-section style={{ padding: `clamp(64px,10vh,120px) 0`, position: "relative", overflow: "hidden" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", top: "50%", left: "50%", width: "min(1000px,150vw)", height: "min(1000px,150vw)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.015)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${PX}` }}>
            <Reveal><div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 64 }}>
              <span style={{ width: 28, height: 2, background: "rgba(255,255,255,0.12)", display: "block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Real teams</span>
            </div></Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))", gap: 2 }}>
              {testimonials.map((t, i) => (
                <Reveal3D key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ background: "rgba(255,255,255,0.025)", y: -6, rotateX: -2 }}
                    style={{ padding: "clamp(28px,4vw,52px) clamp(24px,4vw,44px)", border: "1px solid rgba(255,255,255,0.035)", cursor: "default", perspective: 600 }}>
                    <div style={{ fontSize: 72, lineHeight: 0.8, color: t.accent, fontWeight: 800, opacity: 0.4, marginBottom: 24 }}>&quot;</div>
                    <p style={{ fontSize: "clamp(14px,1.5vw,17px)", fontWeight: 500, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36 }}>{t.quote}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                        {t.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t.name}</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                </Reveal3D>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" data-scroll-section style={{ padding: "clamp(64px,10vh,120px) 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${PX}` }}>
            <Reveal>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ width: 28, height: 2, background: "rgba(255,255,255,0.15)", display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Pricing</span>
              </div>
              <h2 style={{ fontSize: "clamp(34px,5vw,64px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 64, lineHeight: 1.06, maxWidth: 500, color: "#fff" }}>Honest pricing.<br />No gotchas.</h2>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px,100%), 1fr))", gap: 16 }}>
              {plans.map((p, i) => (
                <Reveal3D key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -8, rotateY: p.featured ? 0 : (i === 0 ? 3 : -3), boxShadow: p.featured ? "0 30px 70px rgba(54,197,240,0.12)" : "0 20px 50px rgba(0,0,0,0.3)" }}
                    style={{
                      padding: "clamp(28px,4vw,48px) clamp(24px,4vw,44px)",
                      background: p.featured ? "linear-gradient(145deg, rgba(54,197,240,0.1), rgba(46,182,125,0.06))" : "rgba(255,255,255,0.015)",
                      border: p.featured ? "1px solid rgba(54,197,240,0.18)" : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 20, position: "relative", cursor: "default", perspective: 600, transformStyle: "preserve-3d",
                    }}>
                    {p.featured && <div style={{ position: "absolute", top: 18, right: 18, background: "linear-gradient(135deg,#36C5F0,#2EB67D)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100 }}>Most popular</div>}
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 28 }}>{p.tier}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                      {p.price !== "—" && <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>$</span>}
                      <span style={{ fontSize: "clamp(48px,6vw,64px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>{p.price}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: 20 }}>{p.cadence}</p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{p.pitch}</p>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                      {p.lines.map((line, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>
                          <span style={{ width: 18, height: 18, borderRadius: "50%", background: p.featured ? "rgba(54,197,240,0.1)" : "rgba(46,182,125,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke={p.featured ? "#36C5F0" : "#2EB67D"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>{line}
                        </li>
                      ))}
                    </ul>
                    <motion.button whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(54,197,240,0.2)" }} whileTap={{ scale: 0.97 }}
                      style={{ width: "100%", padding: 14, borderRadius: 100, fontWeight: 800, fontSize: 14, border: "none", background: p.featured ? "linear-gradient(135deg,#36C5F0,#2EB67D)" : "#fff", color: p.featured ? "#fff" : "#050510", fontFamily: "'Sora',sans-serif", cursor: "pointer" }}>{p.cta}</motion.button>
                  </motion.div>
                </Reveal3D>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" data-scroll-section style={{ background: "rgba(255,255,255,0.015)", padding: "clamp(64px,10vh,112px) 0" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: `0 ${PX}` }}>
            <Reveal>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ width: 28, height: 2, background: "rgba(255,255,255,0.15)", display: "block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>FAQ</span>
              </div>
              <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 56, color: "#fff" }}>Good questions.</h2>
            </Reveal>
            {faqs.map((item, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <motion.button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}
                    whileHover={{ x: 4 }}>
                    <span style={{ fontSize: "clamp(14px,1.5vw,16px)", fontWeight: 700, color: "#fff", lineHeight: 1.35, flex: 1 }}>{item.q}</span>
                    <motion.span animate={{ rotate: openFaq === i ? 45 : 0, background: openFaq === i ? "#36C5F0" : "transparent" }}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 2v7M2 5.5h7" stroke={openFaq === i ? "#fff" : "rgba(255,255,255,0.25)"} strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </motion.span>
                  </motion.button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.75, paddingBottom: 24, overflow: "hidden" }}>{item.a}</motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section data-scroll-section style={{ padding: "clamp(80px,12vh,140px) 0", position: "relative", overflow: "hidden" }}>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "50%", left: "50%", width: "clamp(300px,60vw,700px)", height: "clamp(200px,45vw,500px)", borderRadius: "50%", background: "radial-gradient(ellipse,#36C5F0 0%,transparent 70%)", transform: "translate(-50%,-50%)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 720, margin: "0 auto", padding: `0 ${PX}`, textAlign: "center", position: "relative" }}>
            <Reveal3D>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}><NudgeLogo scale={1} /></div>
              <h2 style={{ fontSize: "clamp(36px,6vw,76px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.03, marginBottom: 24 }}>Your team is one<br />nudge away.</h2>
              <p style={{ fontSize: "clamp(14px,1.8vw,17px)", color: "rgba(255,255,255,0.28)", lineHeight: 1.7, marginBottom: 48, maxWidth: 440, margin: "0 auto 48px" }}>14,000 teams ship faster. Start free — 3 minutes to onboard your whole team.</p>
              <motion.button whileHover={{ y: -3, boxShadow: "0 10px 40px rgba(54,197,240,0.15)" }} whileTap={{ scale: 0.97 }}
                style={{ fontSize: "clamp(14px,1.6vw,16px)", fontWeight: 800, color: "#050510", background: "#fff", border: "none", padding: "clamp(15px,2vw,20px) clamp(32px,4vw,52px)", borderRadius: 100, fontFamily: "'Sora',sans-serif", cursor: "pointer" }}>Start for free</motion.button>
              <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.12)" }}>Free forever on Solo · Cancel Team anytime</p>
            </Reveal3D>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer data-scroll-section style={{ borderTop: "1px solid rgba(255,255,255,0.035)", padding: `28px ${PX}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <NudgeLogo scale={0.58} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
              {["Privacy", "Terms", "Changelog", "Status", "Blog"].map((l) => (
                <motion.a key={l} href="#" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.15)" }}
                  whileHover={{ color: "rgba(255,255,255,0.55)" }}>{l}</motion.a>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.1)" }}>© 2026 Nudge Inc.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}