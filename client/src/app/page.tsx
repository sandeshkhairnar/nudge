"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  NudgeLogo, ScrollBar, Reveal, CountUp, NeoButton, NeoCard
} from "./components/LandingComponents";

const PX = "clamp(24px, 5vw, 80px)";

// NEOBRUTALIST COLORS
const N_BLUE = "#4D9FFF";
const N_GREEN = "#23CE6B";
const N_YELLOW = "#FFD23F";
const N_PINK = "#F45B69";

const testimonials = [
  { quote: "Tickets used to rot in our backlog. Now Nudge literally yells at us (in a good way) to ship.", name: "Ava Mercer", role: "Head of Product", bg: N_PINK },
  { quote: "It looks fun but it's genuinely the most aggressive and effective task board we've ever used.", name: "Tomás Ruiz", role: "Eng Manager", bg: N_YELLOW },
  { quote: "Slack threads are dead. Everything lives on the Nudge board now. I love it.", name: "Kira Johansson", role: "CTO", bg: N_BLUE },
];

const faqs = [
  { q: "WHY DOES IT LOOK LIKE THIS?", a: "Because boring enterprise SaaS doesn't make you work faster. Bold, clear, structured UI forces you to focus on the work, not the tool." },
  { q: "IS THERE A FREE PLAN?", a: "Yes. Solo is free forever for side projects and freelancers. No credit card." },
  { q: "CAN I IMPORT MY JIRA TICKETS?", a: "Yes. We have a one-click importer that rescues your tasks from the abyss of Jira in seconds." },
  { q: "HOW DOES THE AI WORK?", a: "It watches your board. If a task stalls, it nudges the owner. No spam, just a single focused prompt to unblock." },
];

export default function Page() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ background: "#F4F4F0", color: "#000", overflow: "hidden", minHeight: "100vh", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <ScrollBar />

      {/* ─── NAV ─── */}
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 80,
          display: "flex", alignItems: "center", background: "#F4F4F0", borderBottom: "3px solid #000"
        }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `0 ${PX}`, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <NudgeLogo scale={1} />
          <nav className="hide-mobile" style={{ display: "flex", gap: 40, alignItems: "center" }}>
            {["PRODUCT", "PRICING", "FAQ"].map((l) => (
              <motion.a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: 16, fontWeight: 900, color: "#000", textTransform: "uppercase" }}
                whileHover={{ y: -2, color: N_BLUE }}>{l}</motion.a>
            ))}
          </nav>
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/sign-in">
              <span style={{ fontSize: 16, fontWeight: 900, color: "#000", textTransform: "uppercase", cursor: "pointer", marginRight: 16 }}>LOGIN</span>
            </Link>
            <Link href="/get-started">
              <NeoButton color={N_YELLOW}>START FOR FREE</NeoButton>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section style={{ position: "relative", minHeight: "90vh", display: "flex", alignItems: "center", padding: `120px ${PX} 80px` }}>
        {/* Background Grid Pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)", backgroundSize: "60px 60px", opacity: 0.05, pointerEvents: "none" }} />
        
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: 32 }}>
          <Reveal y={20}>
            <div style={{ display: "inline-block", background: N_PINK, border: "3px solid #000", padding: "8px 16px", boxShadow: "4px 4px 0px #000" }}>
              <span style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", color: "#000" }}>🚀 NUDGE OS 2.0 IS LIVE</span>
            </div>
          </Reveal>
          
          <Reveal delay={0.1} y={30}>
            <h1 style={{ fontSize: "clamp(56px, 10vw, 120px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: 0, color: "#000", textTransform: "uppercase", textShadow: "4px 4px 0px #fff, 6px 6px 0px #000" }}>
              STOP WAITING.<br/>
              START <span style={{ background: N_GREEN, padding: "0 16px", border: "4px solid #000", display: "inline-block", transform: "rotate(-2deg)", boxShadow: "8px 8px 0px #000" }}>SHIPPING.</span>
            </h1>
          </Reveal>
          
          <Reveal delay={0.2} y={30}>
            <p style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 600, color: "#000", lineHeight: 1.5, maxWidth: 700, margin: "16px 0 24px", background: "#fff", padding: 24, border: "3px solid #000", boxShadow: "6px 6px 0px #000" }}>
              The workspace that actively fights stalled tasks. Bold, intelligent, and designed to force momentum.
            </p>
          </Reveal>

          <Reveal delay={0.3} y={30}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 16 }}>
              <Link href="/get-started">
                <NeoButton color={N_BLUE}>CREATE WORKSPACE</NeoButton>
              </Link>
              <NeoButton color="#fff">VIEW DEMO</NeoButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── TERMINAL / AGENT LOG ─── */}
      <section style={{ padding: "80px 0", background: "#000", borderTop: "3px solid #000", borderBottom: "3px solid #000" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: `0 ${PX}` }}>
          <Reveal>
            <div style={{ background: "#111", border: "3px solid #fff", padding: "clamp(24px, 4vw, 40px)", boxShadow: "8px 8px 0px #fff", color: N_GREEN, fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: "clamp(14px, 1.5vw, 18px)", display: "flex", flexDirection: "column", gap: 16, overflowX: "hidden" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, borderBottom: "2px dashed #333", paddingBottom: 16 }}>
                <span style={{ color: "#fff", fontWeight: "bold" }}>NUDGE ENGINE V2.0</span>
                <span style={{ color: "#666" }}>// AUTONOMOUS TASK RESOLUTION</span>
              </div>
              
              <div><span style={{ color: N_PINK }}>[SYSTEM]</span> Scanning workspace for stalled tickets...</div>
              <div><span style={{ color: N_PINK }}>[SYSTEM]</span> Ticket ENG-402 (API Rate Limiting) idle for 7 days.</div>
              <div><span style={{ color: N_YELLOW }}>[AI]</span> Analyzing blockers across GitHub & Slack...</div>
              <div><span style={{ color: N_YELLOW }}>[AI]</span> Found unreviewed PR #128 by @marcus.</div>
              <div><span style={{ color: N_BLUE }}>[ACTION]</span> Nudging @sarah to review PR #128.</div>
              <div><span style={{ color: N_GREEN }}>[RESULT]</span> PR Approved. ENG-402 automatically moved to In Progress.</div>
              
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#fff" }}>$</span>
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 12, height: 20, background: "#fff", display: "inline-block" }} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── METRICS ─── */}
      <section style={{ padding: "clamp(80px, 12vh, 160px) 0", background: "#fff", borderTop: "3px solid #000", borderBottom: "3px solid #000" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `0 ${PX}` }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#000", textTransform: "uppercase", marginBottom: 64 }}>THE NUMBERS<br/>DON'T LIE.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {[
              { val: 14, suffix: "k+", label: "ACTIVE TEAMS", c: N_YELLOW },
              { val: 98, suffix: "%", label: "RETENTION RATE", c: N_PINK },
              { val: 34, suffix: "x", label: "VELOCITY MULTIPLIER", c: N_GREEN, display: "3.4x" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <NeoCard bg={s.c} rotate={i % 2 === 0 ? 2 : -2}>
                  <div style={{ fontSize: "clamp(56px, 8vw, 96px)", fontWeight: 900, color: "#000", lineHeight: 1, textShadow: "2px 2px 0px #fff" }}>
                    {s.display ? s.display : <><CountUp to={s.val} />{s.suffix}</>}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#000", marginTop: 16, textTransform: "uppercase" }}>{s.label}</div>
                </NeoCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="product" style={{ padding: "clamp(80px, 12vh, 160px) 0", background: N_BLUE, borderBottom: "3px solid #000" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `0 ${PX}` }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", marginBottom: 64, textShadow: "4px 4px 0px #000" }}>FEATURES THAT<br/>HIT HARD.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 32 }}>
            <Reveal delay={0.1}>
              <NeoCard bg="#fff">
                <div style={{ width: 64, height: 64, background: N_PINK, border: "3px solid #000", marginBottom: 24, boxShadow: "4px 4px 0px #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🧠</div>
                <h3 style={{ fontSize: 32, fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>NUDGE ENGINE</h3>
                <p style={{ fontSize: 18, fontWeight: 600 }}>The AI watches your board and aggressively prompts owners when tasks stall. No manual pinging required.</p>
              </NeoCard>
            </Reveal>
            <Reveal delay={0.2}>
              <NeoCard bg="#fff">
                <div style={{ width: 64, height: 64, background: N_GREEN, border: "3px solid #000", marginBottom: 24, boxShadow: "4px 4px 0px #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>⚡</div>
                <h3 style={{ fontSize: 32, fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>LIVE VELOCITY</h3>
                <p style={{ fontSize: 18, fontWeight: 600 }}>Instantly see what's shipped, stuck, and at risk. Data so clear it hurts.</p>
              </NeoCard>
            </Reveal>
            <Reveal delay={0.3}>
              <NeoCard bg="#fff">
                <div style={{ width: 64, height: 64, background: N_YELLOW, border: "3px solid #000", marginBottom: 24, boxShadow: "4px 4px 0px #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🔗</div>
                <h3 style={{ fontSize: 32, fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>HYPER-SYNC</h3>
                <p style={{ fontSize: 18, fontWeight: 600 }}>Link PRs, Figma frames, and Slack threads directly to the block. Stop context switching.</p>
              </NeoCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: "clamp(80px, 12vh, 160px) 0", background: "#F4F4F0" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `0 ${PX}` }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#000", textTransform: "uppercase", marginBottom: 64 }}>DON'T JUST TAKE<br/>OUR WORD.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <NeoCard bg={t.bg} rotate={i % 2 === 0 ? -1 : 1}>
                  <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4, flex: 1, marginBottom: 32 }}>"{t.quote}"</p>
                  <div style={{ borderTop: "3px solid #000", paddingTop: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>{t.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.role}</div>
                  </div>
                </NeoCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ padding: "clamp(80px, 12vh, 160px) 0", background: "#fff", borderTop: "3px solid #000", borderBottom: "3px solid #000" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: `0 ${PX}` }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#000", textTransform: "uppercase", marginBottom: 64, textAlign: "center" }}>FAQ</h2>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div style={{ background: "#F4F4F0", border: "3px solid #000", boxShadow: "4px 4px 0px #000" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", textAlign: "left", background: openFaq === i ? N_PINK : "transparent", border: "none", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "background 0.2s" }}>
                    <span style={{ fontSize: 20, fontWeight: 900 }}>{item.q}</span>
                    <span style={{ fontSize: 32, fontWeight: 900 }}>{openFaq === i ? "-" : "+"}</span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", borderTop: "3px solid #000" }}>
                        <p style={{ padding: 32, fontSize: 18, fontWeight: 600, lineHeight: 1.6, background: "#fff", margin: 0 }}>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: "clamp(120px, 20vh, 240px) 0", background: N_YELLOW }}>
        <div style={{ textAlign: "center", maxWidth: 900, margin: "0 auto", padding: `0 ${PX}` }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(64px, 10vw, 140px)", fontWeight: 900, color: "#000", textTransform: "uppercase", lineHeight: 0.9, marginBottom: 40, textShadow: "4px 4px 0px #fff, 8px 8px 0px #000" }}>GET SH*T<br/>DONE.</h2>
            <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 48 }}>Join 14,000+ teams shipping faster.</p>
            <Link href="/get-started">
              <NeoButton color={N_BLUE}>
                <span style={{ fontSize: 24 }}>START FOR FREE</span>
              </NeoButton>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: `40px ${PX}`, background: "#F4F4F0", borderTop: "3px solid #000" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <NudgeLogo scale={0.8} />
          <div style={{ display: "flex", gap: 32 }}>
            {["TWITTER", "GITHUB", "LEGAL", "PRIVACY"].map(l => (
              <a key={l} href="#" style={{ fontSize: 16, fontWeight: 900, color: "#000" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
