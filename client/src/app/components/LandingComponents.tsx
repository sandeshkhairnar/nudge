"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Twitter, Github, Linkedin, ArrowRight, Menu, X } from "lucide-react";

import Lenis from "@studio-freight/lenis";

// ─── Smooth Scroll ────────────────────────────────────────────────────────────

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

export function NudgeLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconH = size === "sm" ? 18 : size === "lg" ? 32 : 22;
  const textSize = size === "sm" ? "text-xl" : size === "lg" ? "text-4xl" : "text-2xl";
  return (
    <div className="flex items-center gap-0.5">
      <svg
        style={{ height: iconH, width: "auto", marginRight: "1px" }}
        viewBox="21 21 58 58"
        fill="none"
      >
        <path d="M28 72V28" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
        <path d="M72 72V28" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
        <path d="M28 28L72 72" stroke="#4F46E5" strokeWidth="14" strokeLinecap="round" />
      </svg>
      <span
        className={`${textSize} font-black tracking-tighter leading-none text-white`}
        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.04em" }}
      >
        udge
      </span>
    </div>
  );
}

// ─── Scroll progress bar ───────────────────────────────────────────────────────

export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[9999] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #4F46E5, #7C3AED, #36C5F0)",
      }}
    />
  );
}

// ─── Scroll reveal ─────────────────────────────────────────────────────────────

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
  style,
  id,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      id={id}
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Grain overlay ─────────────────────────────────────────────────────────────

export const GrainOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.025]"
    style={{
      backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
    }}
  />
);

// ─── Nav ───────────────────────────────────────────────────────────────────────

export const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Overview", href: "/" },
    { label: "Product", href: "/product" },
    { label: "Customers", href: "/customers" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Manifesto", href: "/manifesto" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className={`fixed left-0 right-0 z-50 flex justify-center px-6 pointer-events-none transition-all duration-500 ${scrolled ? "top-6" : "top-0"}`}>
      <header 
        className={`pointer-events-auto w-full transition-all duration-500 relative flex items-center justify-between px-5 h-16 ${
          scrolled 
            ? "max-w-4xl bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full" 
            : "max-w-7xl bg-transparent border border-transparent rounded-none"
        }`}
      >
          {/* Logo */}
          <Link href="/" className="flex items-center mt-0.5">
            <NudgeLogo size="sm" />
          </Link>

          {/* Center links — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              // Exact match for root "/", otherwise startsWith for subpages
              const isActive = link.href === "/" 
                ? pathname === "/" 
                : link.href.startsWith("/#") 
                  ? false // Hash links handled differently if needed, but not highlighting by default on other pages
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 text-[13px] font-medium transition-colors rounded-full ${
                    isActive 
                      ? "bg-white/[0.1] text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-3 py-1.5 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link href="/get-started">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold text-white rounded-full cursor-pointer border-0"
                style={{
                  backgroundColor: "#4F46E5",
                  boxShadow: "0 4px 14px 0 rgba(79,70,229,0.39)",
                }}
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.08]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 bg-[#0A0A0C]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden md:hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {links.map((link) => {
                  const isActive = link.href === "/" 
                    ? pathname === "/" 
                    : link.href.startsWith("/#") 
                      ? false 
                      : pathname?.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`py-3 px-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? "bg-white/[0.08] text-white" 
                          : "text-zinc-300 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="pt-3 mt-2 border-t border-white/[0.06] flex flex-col gap-2">
                  <Link
                    href="/sign-in"
                    className="py-2.5 text-center text-sm font-medium text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link href="/get-started">
                    <button
                      className="w-full py-2.5 text-sm font-semibold text-white rounded-lg border-0 cursor-pointer"
                      style={{ backgroundColor: "#4F46E5" }}
                    >
                      Get Started Free
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};

// ─── Footer ────────────────────────────────────────────────────────────────────

export const Footer = () => {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/product" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#" },
        { label: "Roadmap", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Manifesto", href: "/manifesto" },
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Security", href: "#" },
        { label: "Cookie Policy", href: "#" },
      ],
    },
  ];

  return (
    <footer
      className="relative border-t overflow-hidden"
      style={{ background: "#09090B", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(79,70,229,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <NudgeLogo size="sm" />
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-[200px]">
              The AI workspace that forces momentum.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Nudge OS Inc. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
};

export function PrimaryButton({
  children,
  href,
  size = "md",
}: {
  children: React.ReactNode;
  href: string;
  size?: "sm" | "md" | "lg";
}) {
  const padding = size === "lg" ? "px-8 py-4 text-base" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-sm";
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(79,70,229,0.4)" }}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-2 ${padding} font-semibold text-white rounded-xl cursor-pointer border-0 transition-shadow`}
        style={{
          backgroundColor: "#4F46E5",
          boxShadow: "0 4px 14px 0 rgba(79,70,229,0.39)",
        }}
      >
        {children}
      </motion.button>
    </Link>
  );
}

// ─── Ghost button ──────────────────────────────────────────────────────────────

export function GhostButton({
  children,
  href,
  size = "md",
}: {
  children: React.ReactNode;
  href: string;
  size?: "sm" | "md" | "lg";
}) {
  const padding = size === "lg" ? "px-8 py-4 text-base" : size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-sm";
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-2 ${padding} font-semibold text-zinc-300 hover:text-white rounded-xl cursor-pointer transition-all`}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {children}
      </motion.button>
    </Link>
  );
}
