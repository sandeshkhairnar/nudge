"use client";

import { motion } from "framer-motion";
import { GrainOverlay, Nav, Footer, Reveal, SmoothScroll } from "../components/LandingComponents";
import Image from "next/image";

export default function ManifestoPage() {
  return (
    <div className="bg-[#09090B] min-h-screen text-zinc-300 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white font-sans">
      <SmoothScroll />
      <GrainOverlay />
      <Nav />

      <main className="pt-[72px] min-h-screen relative">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
             <Image
              src="/hero_glow_bg.png"
              alt="Ambient background"
              fill
              className="object-cover opacity-30 mix-blend-screen"
              priority
            />
          </div>

        <article className="max-w-3xl mx-auto px-6 py-20 lg:py-32">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-16">
              The Nudge <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Manifesto.</span>
            </h1>
          </Reveal>

          <div className="space-y-12 text-lg md:text-xl text-zinc-400 leading-relaxed font-medium">
            <Reveal delay={0.1}>
              <p className="border-l-2 border-indigo-500 pl-6 py-2 text-white">
                The modern software development lifecycle is broken. We have more
                tools than ever, yet we ship slower.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p>
                Why? Because our tools are passive. A Jira board is just a digital
                graveyard where good ideas go to die in the "Backlog". They require humans to 
                constantly feed them status updates, turning engineers into data entry clerks.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <p className="bg-[#111113] p-8 rounded-2xl border border-white/10 text-white shadow-lg">
                We believe your tools should have teeth. They should work for you, not the other way around.
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <p>
                If a Pull Request has been sitting idle for 48 hours, your tool
                shouldn't just show a little red badge. It should analyze the
                blocker, identify the reviewer, and actively ping them to merge
                it. It should escalate when necessary and celebrate when velocity increases.
              </p>
            </Reveal>

            <Reveal delay={0.5}>
              <p>
                Nudge is not just another task board. It is an active participant
                in your engineering organization. It forces momentum. It
                eliminates bottlenecks. It demands that you ship.
              </p>
            </Reveal>

            <Reveal delay={0.6}>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold text-3xl md:text-4xl pt-12 tracking-tight">
                Stop waiting.
                <br />
                Start shipping.
              </p>
            </Reveal>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
