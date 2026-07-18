"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  Zap,
  Activity,
  Layers,
  ChevronDown,
  Box,
  Globe,
  Droplets,
  Cpu,
  Umbrella,
  Command,
  Hexagon
} from "lucide-react";
import {
  GrainOverlay,
  Nav,
  Footer,
  Reveal,
  PrimaryButton,
  GhostButton,
  SmoothScroll,
} from "./components/LandingComponents";
import Image from "next/image";

export default function Page() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const rotateX = useTransform(smoothProgress, [0, 0.15], [25, 0]);
  const scale = useTransform(smoothProgress, [0, 0.15], [0.85, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.15], [0.3, 1]);

  return (
    <div className="bg-[#09090B] min-h-screen text-zinc-300 selection:bg-indigo-500/30 selection:text-white font-sans">
      <SmoothScroll />
      <GrainOverlay />
      <Nav />

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-0 lg:pt-40 overflow-hidden">
        {/* CSS-only background: subtle radial glow + dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.12) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
          <Reveal y={12}>
            <p className="text-sm font-medium text-zinc-500 mb-6 tracking-wide">
              Project management for engineering teams
            </p>
          </Reveal>

          <Reveal y={16} delay={0.05}>
            <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-semibold tracking-[-0.035em] text-white leading-[1.1] mb-5">
              Your team's work is stalling.
              <br />
              <span className="text-zinc-500">Nudge fixes that.</span>
            </h1>
          </Reveal>

          <Reveal y={16} delay={0.1}>
            <p className="text-[17px] text-zinc-400 max-w-xl mx-auto mb-8 leading-[1.7]">
              Nudge connects to your repos and channels, detects blocked work
              in real time, and sends the right person the right context to
              unblock it — automatically.
            </p>
          </Reveal>

          <Reveal y={16} delay={0.15} className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <PrimaryButton href="/get-started" size="lg">
              Get started — it's free <ArrowRight size={16} />
            </PrimaryButton>
            <GhostButton href="/product" size="lg">
              See how it works
            </GhostButton>
          </Reveal>

          {/* Minimal social proof — text only, no fake avatars */}
          <Reveal y={12} delay={0.2}>
            <div className="flex items-center gap-6 text-sm text-zinc-600">
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>Free for solo devs</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span>Setup in 2 minutes</span>
            </div>
          </Reveal>
        </div>

        {/* Product screenshot with window chrome */}
        <Reveal y={40} delay={0.25} className="w-full max-w-[1100px] mx-auto mt-16 px-6 relative z-10" style={{ perspective: "1000px" }}>
          {/* Glow behind the screenshot — CSS only */}
          <div
            className="absolute -inset-10 -z-10 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(79,70,229,0.08) 0%, transparent 70%)",
            }}
          />
          {/* Window frame */}
          <motion.div 
            style={{ rotateX, scale, opacity, transformStyle: "preserve-3d" }}
            className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#111113] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0C0C0E] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-8 py-0.5 rounded bg-white/[0.04] text-[11px] text-zinc-600 font-mono">
                  app.nudge.dev
                </div>
              </div>
              <div className="w-12" /> {/* Spacer to balance traffic lights */}
            </div>
            {/* Screenshot */}
            <Image
              src="/hero_dashboard.png"
              alt="Nudge workspace — task board and team analytics"
              width={2200}
              height={1375}
              className="w-full h-auto block"
              priority
            />
          </motion.div>
          {/* Bottom fade into page bg */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent pointer-events-none" />
        </Reveal>
      </section>

      {/* ─── LOGO CLOUD ─── */}
      <section className="py-10 border-y border-white/[0.04] bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-6 overflow-hidden flex relative">
          {/* We create two identical marquees, one following the other */}
          <div className="flex shrink-0 items-center justify-around gap-16 pr-16 min-w-full animate-marquee opacity-40 hover:opacity-100 transition-opacity duration-500">
            {[
              { name: "Acme Corp", icon: Box },
              { name: "Globex", icon: Globe },
              { name: "Soylent", icon: Droplets },
              { name: "Initech", icon: Cpu },
              { name: "Umbrella", icon: Umbrella },
              { name: "Stark Ind", icon: Zap },
              { name: "Wayne Ent", icon: Command },
              { name: "Massive Dynamic", icon: Hexagon }
            ].map(({ name, icon: Icon }, i) => (
              <div key={i} className="text-xl font-bold tracking-tight text-zinc-500 uppercase flex items-center gap-2">
                <Icon size={24} className="text-zinc-500 shrink-0" /> <span className="whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center justify-around gap-16 pr-16 min-w-full animate-marquee opacity-40 hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
            {[
              { name: "Acme Corp", icon: Box },
              { name: "Globex", icon: Globe },
              { name: "Soylent", icon: Droplets },
              { name: "Initech", icon: Cpu },
              { name: "Umbrella", icon: Umbrella },
              { name: "Stark Ind", icon: Zap },
              { name: "Wayne Ent", icon: Command },
              { name: "Massive Dynamic", icon: Hexagon }
            ].map(({ name, icon: Icon }, i) => (
              <div key={i} className="text-xl font-bold tracking-tight text-zinc-500 uppercase flex items-center gap-2">
                <Icon size={24} className="text-zinc-500 shrink-0" /> <span className="whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 md:py-40 max-w-7xl mx-auto px-6 space-y-32">
        {/* Feature 1 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Reveal className="order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              AI that actually <br className="hidden md:block" />
              <span className="text-indigo-400">unblocks your team.</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Nudge Engine connects to your GitHub and Slack. It analyzes stale pull requests, 
              failed builds, and forgotten tickets, automatically pinging the exact right person 
              to resolve the bottleneck.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Detects PRs waiting for review",
                "Flags tickets stalled in 'In Progress'",
                "Smart Slack DMs with context and action items"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" size={18} />
                  <span className="text-zinc-300 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <GhostButton href="/product#engine">Explore Nudge Engine</GhostButton>
          </Reveal>
          <Reveal y={40} className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-[#111113] p-2">
               <Image
                src="/nudge_engine_ui.png"
                alt="Nudge Engine UI"
                width={1200}
                height={800}
                className="w-full rounded-xl border border-white/5"
              />
            </div>
          </Reveal>
        </div>

        {/* Feature 2 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Reveal y={40}>
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-[#111113] p-2">
               <Image
                src="/analytics_dashboard.png"
                alt="Analytics Dashboard"
                width={1200}
                height={800}
                className="w-full rounded-xl border border-white/5"
              />
            </div>
          </Reveal>
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Live velocity data. <br className="hidden md:block" />
              <span className="text-purple-400">No guesswork.</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              See exactly how fast each team is shipping in real time. We highlight bottlenecks 
              and negative trends before they impact your release cycle. Data so clear, it hurts.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Real-time team performance metrics",
                "Automated cycle time tracking",
                "Predictive release risk scoring"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" size={18} />
                  <span className="text-zinc-300 font-medium">{item}</span>
                </li>
              ))}
            </ul>
             <GhostButton href="/product#analytics">View Analytics</GhostButton>
          </Reveal>
        </div>

        {/* Feature 3 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Reveal className="order-2 lg:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Deeply integrated. <br className="hidden md:block" />
              <span className="text-teal-400">Zero context switching.</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Nudge acts as the central brain of your engineering stack. It syncs bidirectionally 
              with the tools you already use, keeping everything perfectly in state.
            </p>
            <div className="flex gap-4 flex-wrap mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <GitPullRequest size={16} /> <span className="text-sm font-semibold">GitHub</span>
              </div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <MessageSquare size={16} /> <span className="text-sm font-semibold">Slack</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <Layers size={16} /> <span className="text-sm font-semibold">Linear</span>
              </div>
            </div>
             <GhostButton href="/integrations">See all integrations</GhostButton>
          </Reveal>
          <Reveal y={40} className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-[#111113] p-2">
               <Image
                src="/integrations_panel.png"
                alt="Integrations Panel"
                width={1200}
                height={800}
                className="w-full rounded-xl border border-white/5"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 bg-[#0A0A0C] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Three simple steps to transform your team's velocity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (hidden on mobile) */}
            <div className="hidden md:block absolute top-12 left-20 right-20 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {[
              {
                step: "01",
                title: "Connect",
                desc: "Link your GitHub repos, issue trackers, and Slack workspace in one click.",
                icon: <Layers size={24} className="text-indigo-400" />
              },
              {
                step: "02",
                title: "Analyze",
                desc: "Our engine scans for stale PRs, stalled tickets, and critical blockers in real-time.",
                icon: <Activity size={24} className="text-purple-400" />
              },
              {
                step: "03",
                title: "Nudge",
                desc: "Smart alerts ping the right developers with context to immediately unblock work.",
                icon: <Zap size={24} className="text-teal-400" />
              }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15} className="relative bg-[#111113] p-8 rounded-2xl border border-white/[0.06] flex flex-col items-center text-center hover:bg-white/[0.02] transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-inner z-10">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">Step {item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Engineering leaders love Nudge</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Nudge replaced 3 different tools for us. We no longer have to chase devs for PR reviews. It just happens.", name: "Sarah Jenkins", role: "VP Engineering" },
            { quote: "The velocity insights are incredibly sharp. We found bottlenecks in our QA process we didn't even know existed.", name: "Marcus Chen", role: "Lead Developer" },
            { quote: "Our sprint completion rate went from 65% to 92% in two months. The Nudge Engine is legitimately magic.", name: "Alex Rivera", role: "CTO" }
          ].map((t, i) => (
             <Reveal key={i} delay={i * 0.1} className={`bg-[#111113] p-8 rounded-2xl border border-white/[0.06] relative ${i === 1 ? 'shadow-[0_0_40px_rgba(79,70,229,0.15)] border-indigo-500/20' : ''}`}>
               {i === 1 && <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl pointer-events-none" />}
               <div className="flex gap-1 text-indigo-400 mb-4">★★★★★</div>
               <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-medium relative z-10">"{t.quote}"</p>
               <div className="flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-zinc-800" />
                 <div>
                   <div className="text-sm font-bold text-white">{t.name}</div>
                   <div className="text-xs text-zinc-500">{t.role}</div>
                 </div>
               </div>
             </Reveal>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 bg-[#0A0A0C] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Free for individuals. Scales with your team.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Solo */}
            <Reveal delay={0.1} className="bg-[#111113] rounded-3xl p-8 border border-white/[0.06] flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Solo</h3>
              <p className="text-zinc-400 text-sm mb-6">Perfect for side projects.</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$0</span><span className="text-zinc-500">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Unlimited tasks", "Basic Nudge Engine", "1 Integration", "Community Support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle2 size={16} className="text-zinc-500" /> {f}</li>
                ))}
              </ul>
              <GhostButton href="/get-started">Get Started</GhostButton>
            </Reveal>

            {/* Team */}
            <Reveal delay={0.2} className="bg-[#111113] rounded-3xl p-8 border border-indigo-500/30 relative flex flex-col shadow-[0_0_60px_rgba(79,70,229,0.15)] transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-2">Team</h3>
              <p className="text-indigo-200/60 text-sm mb-6">For growing engineering orgs.</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$12</span><span className="text-zinc-500">/user/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Everything in Solo", "Advanced AI Nudges", "Unlimited Integrations", "Velocity Analytics", "Priority Support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-200"><CheckCircle2 size={16} className="text-indigo-400" /> {f}</li>
                ))}
              </ul>
              <PrimaryButton href="/get-started">Start 14-Day Trial</PrimaryButton>
            </Reveal>

            {/* Enterprise */}
            <Reveal delay={0.3} className="bg-[#111113] rounded-3xl p-8 border border-white/[0.06] flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-zinc-400 text-sm mb-6">For large scale operations.</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">Custom</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Everything in Team", "Custom AI Models", "SSO / SAML", "Dedicated Success Manager", "SLA Guarantee"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle2 size={16} className="text-zinc-500" /> {f}</li>
                ))}
              </ul>
              <GhostButton href="/contact">Contact Sales</GhostButton>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "Why use Nudge over Jira or Linear?",
              a: "Nudge isn't just a place to store tickets. It's an active system. While other tools wait for you to update them, Nudge actively monitors your codebase and chat, analyzes blockers, and pushes your team to resolve them. It's built for momentum."
            },
            {
              q: "How aggressive is the AI?",
              a: "Completely customizable. You set the thresholds. It can send a polite daily digest, or it can immediately flag and escalate a PR that has been blocked for more than 4 hours during a critical sprint."
            },
            {
              q: "Is my source code safe?",
              a: "Absolutely. Nudge Engine only reads metadata (PR status, authors, labels). We never store or analyze your proprietary source code."
            },
            {
              q: "Can I use Nudge alongside my existing tools?",
              a: "Yes. Nudge is designed to sit on top of your existing stack. You can keep using GitHub Issues or Linear for planning, and use Nudge to enforce execution and velocity."
            }
          ].map((item, i) => (
            <div key={i} className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-base font-semibold text-white">{item.q}</span>
                <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} className="text-zinc-500">
                  <ChevronDown size={20} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <p className="p-6 pt-0 text-sm text-zinc-400 leading-relaxed border-t border-white/[0.02] mt-2">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-32 overflow-hidden border-t border-white/[0.04]">
         <div className="absolute inset-0 pointer-events-none -z-10">
          <Image
            src="/hero_glow_bg.png"
            alt="Ambient background"
            fill
            className="object-cover opacity-60 mix-blend-screen rotate-180"
          />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Ready to kill the backlog?
            </h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Join the elite engineering teams who have stopped waiting and started shipping.
            </p>
            <div className="flex flex-col items-center gap-4">
              <PrimaryButton href="/get-started" size="lg">
                Get Started for Free <ArrowRight size={18} />
              </PrimaryButton>
              <p className="text-sm text-zinc-500 mt-2">
                No credit card required · Free forever for solo devs
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
