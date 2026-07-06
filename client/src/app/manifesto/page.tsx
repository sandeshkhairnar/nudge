"use client";

import { motion } from "framer-motion";
import { GrainOverlay, Nav, Footer } from "../components/LandingComponents";

export default function ManifestoPage() {
  return (
    <div className="bg-[#F4F4F0] min-h-screen text-black overflow-x-hidden selection:bg-[#CCFF00] selection:text-black">
      <GrainOverlay />
      <Nav />

      <main className="pt-[72px] min-h-screen">
        <article className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-[10vw] lg:text-[6vw] leading-[0.9] font-[900] tracking-tighter uppercase mb-16"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              The Nudge <br />
              <span className="text-[#FF007F]">Manifesto.</span>
            </h1>
          </motion.div>

          <div className="space-y-12 text-xl lg:text-3xl font-[600] leading-tight max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="border-l-[6px] border-black pl-6 py-2"
            >
              The modern software development lifecycle is broken. We have more
              tools than ever, yet we ship slower.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Why? Because our tools are passive. A Jira board is just a digital
              graveyard where good ideas go to die in the "Backlog".
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-[#CCFF00] p-6 border-[3px] border-black shadow-[8px_8px_0_0_#000]"
            >
              We believe your tools should have teeth.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              If a Pull Request has been sitting idle for 48 hours, your tool
              shouldn't just show a little red badge. It should analyze the
              blocker, identify the reviewer, and actively ping them to merge
              it.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Nudge is not just another task board. It is an active participant
              in your engineering organization. It forces momentum. It
              eliminates bottlenecks. It demands that you ship.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-[#0047FF] font-[900] uppercase text-4xl lg:text-5xl pt-12"
            >
              Stop waiting.
              <br />
              Start shipping.
            </motion.p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
