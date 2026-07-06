"use client";

import { useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GrainOverlay, Nav, Footer } from "./components/LandingComponents";

// --- CUSTOM COMPONENTS ---

const Marquee = () => (
  <div className="flex overflow-hidden bg-black text-[#CCFF00] border-y-[3px] border-black py-3 whitespace-nowrap">
    <motion.div
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="flex gap-8 text-xl font-[900] uppercase tracking-widest"
      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
    >
      {[...Array(6)].map((_, i) => (
        <span key={i} className="flex items-center gap-8">
          <span>Momentum Enforced</span>
          <span className="text-white">★</span>
          <span>Kill The Backlog</span>
          <span className="text-[#FF007F]">★</span>
          <span>Silence The Noise</span>
          <span className="text-[#0047FF]">★</span>
          <span>Destroy Blockers</span>
          <span className="text-white">★</span>
        </span>
      ))}
    </motion.div>
  </div>
);

// --- MAIN PAGE ---

export default function Page() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -300]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-[#F4F4F0] min-h-screen text-black overflow-x-hidden selection:bg-[#CCFF00] selection:text-black">
      <GrainOverlay />
      <Nav />

      {/* ─── HERO ─── */}
      <section className="pt-[72px] min-h-[90vh] flex flex-col relative border-b-[3px] border-black">
        {/* Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #00000020 1px, transparent 1px), linear-gradient(to bottom, #00000020 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="flex-1 grid lg:grid-cols-12 relative z-10">
          <div className="lg:col-span-8 p-6 lg:p-12 xl:p-20 flex flex-col justify-center border-r-[3px] border-black bg-[#F4F4F0]">
            <h1
              className="text-[12vw] lg:text-[7vw] leading-[0.85] font-[900] tracking-tighter uppercase mb-8"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              The workspace
              <br />
              <span className="text-[#0047FF]">with teeth.</span>
            </h1>
            <p className="text-xl lg:text-3xl font-[600] max-w-2xl leading-tight border-l-[6px] border-[#CCFF00] pl-6 py-2">
              Boring SaaS makes you lazy. Nudge is actively hostile to stalled
              tickets. It watches, it analyzes, and it yells at your team to
              ship.
            </p>

            <div className="mt-12 flex flex-wrap gap-6">
              <Link href="/get-started">
                <motion.button
                  whileHover={{
                    x: -4,
                    y: -4,
                    boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                  }}
                  whileTap={{
                    x: 0,
                    y: 0,
                    boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                  }}
                  className="bg-[#CCFF00] border-[3px] border-black px-8 py-5 text-xl font-[900] uppercase tracking-wider flex items-center gap-4 transition-all"
                >
                  Create Workspace <ArrowRight strokeWidth={3} />
                </motion.button>
              </Link>
              <Link href="/product">
                <motion.button
                  whileHover={{
                    x: -4,
                    y: -4,
                    boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                  }}
                  whileTap={{
                    x: 0,
                    y: 0,
                    boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                  }}
                  className="bg-white border-[3px] border-black px-8 py-5 text-xl font-[900] uppercase tracking-wider flex items-center gap-4 transition-all"
                >
                  View Product
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Hero Graphic Panel */}
          <div className="lg:col-span-4 bg-[#0A0A0A] p-8 flex flex-col justify-end overflow-hidden relative min-h-[500px]">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #FF007F 25%, transparent 25%, transparent 75%, #FF007F 75%, #FF007F), repeating-linear-gradient(45deg, #FF007F 25%, #0A0A0A 25%, #0A0A0A 75%, #FF007F 75%, #FF007F)",
                backgroundPosition: "0 0, 20px 20px",
                backgroundSize: "40px 40px",
              }}
            />

            <motion.div
              style={{ y: y1 }}
              className="relative z-10 bg-white border-[3px] border-black p-6 shadow-[8px_8px_0_0_#CCFF00]"
            >
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-[3px] border-black">
                <div className="w-4 h-4 bg-[#FF007F] rounded-full animate-ping" />
                <span className="font-[800] uppercase text-sm tracking-widest text-black">
                  Nudge Engine Action
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-black mb-4">
                &gt; ENG-402 is blocked for 72 hours.
                <br />
                &gt; Detecting PR #128 pending review.
                <br />
                &gt; Pinging @marcus with high priority.
              </p>
              <div className="bg-black text-[#CCFF00] font-mono p-3 text-xs uppercase font-bold text-center">
                Momentum Enforced
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ─── FEATURES GRID ─── */}
      <section id="product" className="border-b-[3px] border-black bg-white">
        <div className="grid lg:grid-cols-2">
          {/* Left Col */}
          <div className="border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black p-8 lg:p-20 flex flex-col justify-center">
            <h2
              className="text-[10vw] lg:text-[5vw] leading-[0.9] font-[900] tracking-tighter uppercase mb-6"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Data so clear <br />
              <span className="text-[#FF007F]">it hurts.</span>
            </h2>
            <p className="text-xl font-[600] mb-10 max-w-lg">
              No more digging through endless Jira tabs. Instantly see what's
              shipped, what's stuck, and exactly who is holding up the release.
            </p>
            <div className="space-y-6">
              {[
                "Live Velocity Tracking",
                "Automated Block Resolution",
                "Hyper-Synced with GitHub & Slack",
              ].map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-[3px] border-black p-4 bg-[#F4F4F0] shadow-[4px_4px_0_0_#0047FF]"
                >
                  <div className="w-8 h-8 bg-black flex items-center justify-center text-white font-bold">
                    0{i + 1}
                  </div>
                  <span className="font-[800] uppercase tracking-wider">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link href="/product">
                <motion.button
                  whileHover={{
                    x: -4,
                    y: -4,
                    boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                  }}
                  whileTap={{
                    x: 0,
                    y: 0,
                    boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                  }}
                  className="bg-[#FF007F] text-white border-[3px] border-black px-8 py-5 text-lg font-[900] uppercase tracking-wider transition-all"
                >
                  Explore All Features
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Right Col */}
          <div className="bg-[#0047FF] p-8 lg:p-20 flex items-center justify-center relative overflow-hidden">
            <motion.div
              style={{ y: y2 }}
              className="w-full max-w-md bg-black border-[3px] border-black text-white p-8 shadow-[12px_12px_0_0_#FF007F]"
            >
              <h3
                className="text-3xl font-[900] uppercase mb-6"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Team Velocity
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Frontend", val: "94%", color: "#CCFF00" },
                  { name: "Backend", val: "42%", color: "#FF007F" },
                  { name: "Design", val: "88%", color: "#0047FF", bg: "white" },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between font-[700] uppercase text-sm">
                      <span>{stat.name}</span>
                      <span style={{ color: stat.color }}>{stat.val}</span>
                    </div>
                    <div className="h-4 bg-gray-800 border-2 border-white w-full">
                      <div
                        className="h-full"
                        style={{
                          width: stat.val,
                          backgroundColor: stat.bg || stat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-700 text-center text-xs font-mono text-gray-400">
                Warning: Backend velocity dropping below threshold.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section
        id="faq"
        className="grid lg:grid-cols-12 border-b-[3px] border-black bg-[#CCFF00]"
      >
        <div className="lg:col-span-5 p-8 lg:p-20 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black">
          <h2
            className="text-[10vw] lg:text-[6vw] leading-[0.9] font-[900] tracking-tighter uppercase text-black"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Hard <br />
            Questions.
          </h2>
          <div className="mt-16">
            <p className="text-xl font-[600] mb-6">
              Want to know what we really believe? Read why passive tools are
              dead.
            </p>
            <Link href="/manifesto">
              <motion.button
                whileHover={{
                  x: -4,
                  y: -4,
                  boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
                }}
                whileTap={{
                  x: 0,
                  y: 0,
                  boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)",
                }}
                className="bg-white border-[3px] border-black px-8 py-5 text-lg font-[900] uppercase tracking-wider transition-all"
              >
                Read Our Manifesto
              </motion.button>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7 bg-[#F4F4F0] flex flex-col">
          {[
            {
              q: "Why use Nudge over Jira?",
              a: "Because you want to build software, not manage it. Nudge automates the nagging so you can focus on coding.",
            },
            {
              q: "Is there a free plan?",
              a: "Yes. Solo developers and side projects are free forever. We only charge when you start making real money with a team.",
            },
            {
              q: "How aggressive is the AI?",
              a: "As aggressive as you configure it to be. It can send a polite Slack DM, or it can lock down your ability to merge new code until you review pending PRs.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="border-b-[3px] border-black last:border-b-0"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left p-6 lg:p-8 flex items-center justify-between hover:bg-black hover:text-white transition-colors"
              >
                <span className="text-xl lg:text-2xl font-[800] uppercase tracking-wide">
                  {item.q}
                </span>
                <motion.div animate={{ rotate: openFaq === i ? 45 : 0 }}>
                  <span className="text-4xl font-[300]">+</span>
                </motion.div>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white"
                  >
                    <p className="p-6 lg:p-8 text-lg font-[600] border-t-[3px] border-black">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
