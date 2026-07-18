"use client";

import { motion } from "framer-motion";
import { GrainOverlay, Nav, Footer, Reveal, SmoothScroll } from "../components/LandingComponents";
import { Send } from "lucide-react";
import Image from "next/image";

export default function ContactPage() {
  return (
    <div className="bg-[#09090B] min-h-screen text-zinc-300 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white font-sans">
      <SmoothScroll />
      <GrainOverlay />
      <Nav />

      <main className="pt-32 pb-20 lg:pt-40 lg:pb-32 min-h-screen relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: "radial-gradient(circle 800px at 0% 50%, rgba(79,70,229,0.08) 0%, transparent 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-32 items-start pt-10">
          
          {/* Left Side - Typography & Details */}
          <Reveal y={20}>
            <div className="flex flex-col gap-12 sticky top-40">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white mb-6">
                  Let's build <br className="hidden lg:block"/> <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">velocity</span> together.
                </h1>
                <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
                  Whether you have questions about Nudge OS, need to discuss custom integrations, or want to explore enterprise volume pricing, our team is ready to help you ship faster.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-white/[0.04]">
                <div>
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    Enterprise Sales
                  </h4>
                  <p className="text-sm text-zinc-500 mb-4">Discuss custom plans and volume pricing.</p>
                  <a href="mailto:sales@nudge.com" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors">sales@nudge.com</a>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    Technical Support
                  </h4>
                  <p className="text-sm text-zinc-500 mb-4">Get help with API integrations and webhooks.</p>
                  <a href="mailto:support@nudge.com" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors">support@nudge.com</a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right Side - Form */}
          <Reveal y={20} delay={0.2} className="relative w-full max-w-lg lg:ml-auto">
            <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-purple-500/20 rounded-[2rem] blur-2xl opacity-50 pointer-events-none" />
            <div className="bg-[#0A0A0C]/90 backdrop-blur-2xl border border-white/[0.08] p-8 md:p-10 rounded-[2rem] shadow-2xl relative">
              <h3 className="text-2xl font-bold text-white mb-8">Send us a message</h3>
              
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-zinc-400">First name</label>
                    <input 
                      type="text" 
                      id="firstName"
                      className="bg-[#111113] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-zinc-400">Last name</label>
                    <input 
                      type="text" 
                      id="lastName"
                      className="bg-[#111113] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-400">Work email</label>
                  <input 
                    type="email" 
                    id="email"
                    className="bg-[#111113] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="jane@company.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-zinc-400">Message</label>
                  <textarea 
                    id="message"
                    rows={5}
                    className="bg-[#111113] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Tell us about your team and what you're looking to achieve..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold text-white rounded-xl cursor-pointer border-0"
                  style={{
                    backgroundColor: "#4F46E5",
                    boxShadow: "0 4px 14px 0 rgba(79,70,229,0.39)",
                  }}
                >
                  Send Message <Send size={16} />
                </motion.button>
              </form>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
