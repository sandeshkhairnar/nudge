"use client";

import { motion } from "framer-motion";
import { GrainOverlay, Nav, Footer, Reveal, PrimaryButton, SmoothScroll } from "../components/LandingComponents";
import Image from "next/image";
import { ArrowRight, Brain, Zap, GitPullRequest, Workflow, ShieldAlert, Activity } from "lucide-react";

export default function ProductPage() {
  return (
    <div className="bg-[#09090B] min-h-screen text-zinc-300 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white font-sans">
      <SmoothScroll />
      <GrainOverlay />
      <Nav />

      <main className="pt-[72px] min-h-screen">
        {/* HERO */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
            <Image
              src="/hero_glow_bg.png"
              alt="Ambient background"
              fill
              className="object-cover opacity-60 mix-blend-screen"
              priority
            />
          </div>

          <div className="max-w-6xl mx-auto px-6 text-center">
            <Reveal>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <span>Built for</span>
                <span className="relative inline-block italic -skew-x-[16deg] pr-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400">
                  Velocity.
                  {/* Speed lines */}
                  <motion.div 
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: "250%", opacity: [0, 1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear", repeatDelay: 0.5 }}
                    className="absolute top-[40%] w-32 h-[3px] bg-white/70 blur-[1px] rounded-full z-10 pointer-events-none"
                  />
                  <motion.div 
                    initial={{ x: "-200%", opacity: 0 }}
                    animate={{ x: "250%", opacity: [0, 1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear", repeatDelay: 1.2 }}
                    className="absolute top-[60%] w-48 h-[2px] bg-indigo-300/60 blur-[1px] rounded-full z-10 pointer-events-none"
                  />
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mt-8">
                We took the standard issue task board and wired it to an aggressive AI engine
                that actively pushes your code forward. Experience engineering without bottlenecks.
              </p>
            </Reveal>
          </div>
        </section>

        <article className="max-w-6xl mx-auto px-6 pb-32">

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Nudge Engine Card */}
            <Reveal id="engine" className="bg-[#111113] border border-white/[0.06] rounded-3xl p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none" />

              <Brain className="text-indigo-400 mb-6" size={32} />
              <h3 className="text-2xl font-bold text-white mb-4">Nudge Engine</h3>
              <p className="text-zinc-400 leading-relaxed mb-8 relative z-10">
                Connect your GitHub repository and Slack workspace. Nudge analyzes stale pull requests,
                failed builds, and forgotten tickets, automatically pinging the right person to unblock the team.
              </p>

              <div className="font-mono text-sm bg-[#09090B] p-4 rounded-xl border border-white/5 text-zinc-300">
                <span className="text-indigo-400">$</span> nudge analyze --target="ENG-402"<br />
                <span className="text-zinc-500">&gt; Blocked: Awaiting Review from @marcus</span><br />
                <span className="text-emerald-400">&gt; Pinging @marcus via Slack...</span>
              </div>
            </Reveal>

            {/* Live Velocity Card */}
            <Reveal delay={0.1} id="analytics" className="bg-[#111113] border border-white/[0.06] rounded-3xl p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-colors duration-700 pointer-events-none" />

              <Activity className="text-purple-400 mb-6" size={32} />
              <h3 className="text-2xl font-bold text-white mb-4">Live Velocity</h3>
              <p className="text-zinc-400 leading-relaxed mb-8 relative z-10">
                No more guessing. See exactly how fast each team is shipping in real time.
                We highlight bottlenecks before they impact your release cycle.
              </p>

              <div className="h-32 flex items-end gap-2 border-b border-white/10 pb-2">
                {[40, 70, 30, 90, 60, 100, 80].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="flex-1 bg-gradient-to-t from-purple-500/20 to-purple-400/80 rounded-t-sm"
                  />
                ))}
              </div>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              { title: "Smart Workflows", icon: <Workflow size={24} className="text-teal-400" />, desc: "Automate task transitions based on GitHub PR status." },
              { title: "Blocker Alerts", icon: <ShieldAlert size={24} className="text-rose-400" />, desc: "Instantly notify leads when critical path items stall." },
              { title: "Deep Sync", icon: <GitPullRequest size={24} className="text-blue-400" />, desc: "Bidirectional sync ensures your board always matches reality." }
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.1} className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
                <div className="mb-4">{f.icon}</div>
                <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="bg-[#111113] border border-indigo-500/30 rounded-3xl p-12 lg:p-24 text-center shadow-[0_0_80px_rgba(79,70,229,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 relative z-10">
              Experience the momentum.
            </h2>
            <p className="text-zinc-400 mb-10 max-w-xl mx-auto relative z-10">
              Stop managing tasks and start shipping products. Nudge is free for solo developers.
            </p>
            <div className="flex justify-center relative z-10">
              <PrimaryButton href="/get-started" size="lg">
                Create Workspace <ArrowRight size={18} />
              </PrimaryButton>
            </div>
          </Reveal>
        </article>
      </main>

      <Footer />
    </div>
  );
}
