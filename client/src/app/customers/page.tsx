"use client";

import { motion } from "framer-motion";
import { GrainOverlay, Nav, Footer, Reveal, SmoothScroll, PrimaryButton } from "../components/LandingComponents";
import { ArrowRight, Quote } from "lucide-react";
import Image from "next/image";

export default function CustomersPage() {
  const testimonials = [
    {
      quote: "Nudge has completely transformed how our engineering team operates. We no longer have PRs sitting stale for days. The AI instantly knows who to ping and exactly what context they need.",
      author: "Sarah Chen",
      role: "VP of Engineering at Globex",
      avatar: "https://i.pravatar.cc/150?img=47"
    },
    {
      quote: "Before Nudge, our daily standups were just status updates about blocked tickets. Now, blockers are resolved asynchronously before standup even begins. It's like having an automated Scrum Master.",
      author: "Marcus Johnson",
      role: "Lead Developer at Initech",
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
      quote: "We evaluated several developer productivity tools, but Nudge was the only one that didn't feel like spyware. It respects our engineers' time and only interrupts when absolutely necessary.",
      author: "Elena Rodriguez",
      role: "CTO at Acme Corp",
      avatar: "https://i.pravatar.cc/150?img=32"
    },
    {
      quote: "The Slack integration is flawless. Instead of digging through Jira, our developers get a simple, actionable message with exactly the code snippet they need to review.",
      author: "David Kim",
      role: "Engineering Manager at Stark Ind",
      avatar: "https://i.pravatar.cc/150?img=59"
    }
  ];

  return (
    <div className="bg-[#09090B] min-h-screen text-zinc-300 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white font-sans">
      <SmoothScroll />
      <GrainOverlay />
      <Nav />

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,70,229,0.1) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal y={20}>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6">
              Trusted by the world's best <br className="hidden md:block" />
              <span className="text-zinc-500">engineering teams.</span>
            </h1>
          </Reveal>
          
          <Reveal y={20} delay={0.1}>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              See how fast-moving organizations use Nudge OS to eliminate bottlenecks, 
              ship code faster, and keep their developers happy.
            </p>
          </Reveal>

          <Reveal y={20} delay={0.2}>
             <div className="flex justify-center gap-4">
                <PrimaryButton href="/get-started" size="lg">
                  Join them today <ArrowRight size={16} />
                </PrimaryButton>
             </div>
          </Reveal>
        </div>
      </section>

      {/* ─── METRICS ─── */}
      <section className="py-12 border-y border-white/[0.04] bg-[#0A0A0C]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/[0.04]">
            {[
              { label: "Hours saved per dev/week", value: "4.2h" },
              { label: "Faster PR resolution", value: "3x" },
              { label: "Reduction in stale tickets", value: "85%" },
              { label: "Engineering teams on Nudge", value: "2,000+" }
            ].map((metric, i) => (
              <Reveal key={i} delay={0.1 * i} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{metric.value}</div>
                <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WALL OF LOVE ─── */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Wall of Love</h2>
            <p className="text-zinc-400 text-lg">Don't just take our word for it.</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={i} y={20} delay={i * 0.1}>
              <div className="h-full p-8 rounded-2xl border border-white/[0.08] bg-[#111113] hover:bg-[#151518] transition-colors relative group">
                <Quote className="absolute top-8 right-8 text-white/[0.04] group-hover:text-indigo-500/10 transition-colors" size={64} />
                <p className="text-lg text-zinc-300 leading-relaxed mb-8 relative z-10">"{t.quote}"</p>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                    <img src={t.avatar} alt={t.author} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{t.author}</div>
                    <div className="text-sm text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
