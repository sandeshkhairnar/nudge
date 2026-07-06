"use client";

import { motion } from "framer-motion";
import { GrainOverlay, Nav, Footer } from "../components/LandingComponents";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ProductPage() {
  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden selection:bg-[#FF007F] selection:text-white">
      <GrainOverlay />
      <Nav />

      <main className="pt-[72px] min-h-screen">
        <article className="max-w-6xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center mb-24">
            <h1
              className="text-[10vw] lg:text-[7vw] leading-[0.9] font-[900] tracking-tighter uppercase mb-8"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Built for <br />
              <span className="text-[#CCFF00]">Velocity.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-400 font-[600] max-w-3xl mx-auto">
              We took the standard issue task board and wired it to an
              aggressive AI engine that actively pushes your code forward.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-24">
            <div className="bg-[#111] border-[3px] border-white p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF007F] rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-700" />
              <h3
                className="text-3xl font-[900] uppercase mb-4"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Nudge Engine
              </h3>
              <p className="text-lg text-gray-400 font-[600] mb-8 relative z-10">
                Connect your GitHub repository and Slack workspace. Nudge
                analyzes stale pull requests, failed builds, and forgotten
                tickets, automatically pinging the right person to unblock the
                team.
              </p>
              <div className="font-mono text-sm bg-black p-4 border border-white/20 text-[#CCFF00]">
                $ nudge analyze --target="ENG-402"
                <br />
                &gt; Blocked: Awaiting Review from @marcus
              </div>
            </div>

            <div className="bg-[#111] border-[3px] border-white p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0047FF] rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-700" />
              <h3
                className="text-3xl font-[900] uppercase mb-4"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Live Velocity
              </h3>
              <p className="text-lg text-gray-400 font-[600] mb-8 relative z-10">
                No more guessing. See exactly how fast each team is shipping in
                real time. We highlight bottlenecks before they impact your
                release cycle.
              </p>
              <div className="h-32 flex items-end gap-2 border-b-2 border-white/20 pb-2">
                {[40, 70, 30, 90, 60, 100, 80].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex-1 bg-white"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#CCFF00] text-black border-[3px] border-white p-12 lg:p-24 text-center shadow-[12px_12px_0_0_#FF007F]">
            <h2
              className="text-4xl lg:text-6xl font-[900] uppercase mb-8"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Experience the momentum.
            </h2>
            <Link href="/get-started">
              <motion.button
                whileHover={{ x: -4, y: -4, boxShadow: "8px 8px 0px 0px #000" }}
                whileTap={{ x: 0, y: 0, boxShadow: "0px 0px 0px 0px #000" }}
                className="bg-white text-black border-[3px] border-black px-10 py-5 text-2xl font-[900] uppercase tracking-wider mx-auto flex items-center gap-4 transition-all"
              >
                Create Workspace <ArrowRight strokeWidth={3} size={28} />
              </motion.button>
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
