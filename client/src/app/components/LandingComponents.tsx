"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import Link from "next/link";
import { Twitter, Github } from "lucide-react";

// --- EXISTING COMPONENTS ---
export function NudgeLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-0">
      <svg
        style={{ height: "24px", width: "auto", marginRight: "2px" }}
        viewBox="21 21 58 58"
        fill="none"
      >
        <path
          d="M28 72V28"
          stroke={dark ? "#FFFFFF" : "#000000"}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M72 72V28"
          stroke={dark ? "#FFFFFF" : "#000000"}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M28 28L72 72"
          stroke="#4F46E5"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="text-[28px] md:text-[32px] font-[900] tracking-tighter leading-none uppercase"
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          color: dark ? "#FFFFFF" : "#000000",
        }}
      >
        udge
      </span>
    </div>
  );
}

export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 bottom-0 right-0 w-1.5 z-[9999] bg-[#CCFF00] border-l-[3px] border-black origin-top"
      style={{ scaleY }}
    />
  );
}

export function Reveal({
  children,
  delay = 0,
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// --- NEW SHARED COMPONENTS FOR MARKETING PAGES ---

export const GrainOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.04]"
    style={{
      backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
    }}
  />
);

export const Nav = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-[#F4F4F0] border-b-[3px] border-black">
    <div className="flex h-[72px] items-stretch">
      <div className="flex-1 flex items-center px-6 lg:px-12 border-r-[3px] border-black">
        <Link href="/" className="flex items-center gap-0">
          <svg
            style={{ height: "24px", width: "auto", marginRight: "2px" }}
            viewBox="21 21 58 58"
            fill="none"
          >
            <path
              d="M28 72V28"
              stroke="#000"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M72 72V28"
              stroke="#000"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M28 28L72 72"
              stroke="#4F46E5"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="text-3xl font-[900] tracking-tighter text-black uppercase"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            udge
          </span>
        </Link>
      </div>
      <Link
        href="/manifesto"
        className="hidden sm:flex items-center px-8 border-r-[3px] border-black bg-[#CCFF00] hover:bg-[#b3e600] transition-colors cursor-pointer text-sm font-[800] uppercase tracking-wider text-black"
      >
        Manifesto
      </Link>
      <Link
        href="/product"
        className="hidden sm:flex items-center px-8 border-r-[3px] border-black hover:bg-[#FF007F] hover:text-white transition-colors cursor-pointer group text-sm font-[800] uppercase tracking-wider text-black group-hover:text-white"
      >
        Product
      </Link>
      <div className="flex items-center">
        <Link
          href="/sign-in"
          className="hidden sm:flex h-full items-center px-8 text-sm font-[800] uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors border-r-[3px] border-black"
        >
          Login
        </Link>
        <Link
          href="/get-started"
          className="flex h-full items-center px-8 text-sm font-[900] uppercase tracking-wider text-white bg-[#0047FF] hover:bg-black transition-colors"
        >
          Start for Free
        </Link>
      </div>
    </div>
  </header>
);

export const Footer = () => (
  <footer className="bg-black text-white px-6 py-12 lg:p-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
    <div>
      <h2
        className="text-[12vw] lg:text-[8vw] leading-[0.8] font-[900] tracking-tighter uppercase mb-4"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        Nudge
      </h2>
      <p className="text-gray-400 font-mono text-sm">
        © {new Date().getFullYear()} NUDGE OS. All rights reserved.
      </p>
    </div>

    <div className="flex flex-col items-start md:items-end gap-6">
      <Link href="/get-started">
        <motion.button
          whileHover={{ x: -4, y: -4, boxShadow: "8px 8px 0px 0px #FF007F" }}
          whileTap={{ x: 0, y: 0, boxShadow: "0px 0px 0px 0px #FF007F" }}
          className="bg-white text-black border-[3px] border-black px-8 py-4 text-xl font-[900] uppercase tracking-wider transition-all"
        >
          Start Building
        </motion.button>
      </Link>
      <div className="flex gap-6">
        <a href="#" className="hover:text-[#CCFF00] transition-colors">
          <Twitter size={24} />
        </a>
        <a href="#" className="hover:text-[#CCFF00] transition-colors">
          <Github size={24} />
        </a>
      </div>
    </div>
  </footer>
);
