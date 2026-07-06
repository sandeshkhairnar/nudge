"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function LiquidDrop() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useMotionValue(0), { stiffness: 40, damping: 15 });
  const rotY = useSpring(useMotionValue(0), { stiffness: 40, damping: 15 });
  const springX = useSpring(mx, { stiffness: 25, damping: 18 });
  const springY = useSpring(my, { stiffness: 25, damping: 18 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      mx.set(dx * 30);
      my.set(dy * 20);
      rotY.set(dx * 18);
      rotX.set(-dy * 12);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [mx, my, rotX, rotY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.3, speed: Math.random() * 0.4 + 0.08,
      phase: Math.random() * Math.PI * 2,
    }));
    let raf: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        const alpha = 0.15 + 0.35 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,255,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200 }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }} />

      {/* Orbit rings */}
      <div style={{ position: "absolute", width: "clamp(480px,52vw,720px)", height: "clamp(480px,52vw,720px)", animation: "spin-slow 50s linear infinite", border: "1px solid rgba(54,197,240,0.05)", borderRadius: "50%", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -3, left: "50%", width: 6, height: 6, borderRadius: "50%", background: "#4F46E5", boxShadow: "0 0 10px #4F46E5" }} />
      </div>
      <div style={{ position: "absolute", width: "clamp(580px,62vw,860px)", height: "clamp(580px,62vw,860px)", animation: "spin-reverse 70s linear infinite", border: "1px solid rgba(46,182,125,0.04)", borderRadius: "50%", pointerEvents: "none" }}>
        <div style={{ position: "absolute", bottom: -3, right: "30%", width: 4, height: 4, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
      </div>

      {/* Pulse ring */}
      <div style={{ position: "absolute", width: "clamp(300px,40vw,540px)", height: "clamp(300px,40vw,540px)", borderRadius: "50%", border: "1px solid rgba(54,197,240,0.1)", animation: "pulse-ring 4s ease-out infinite", pointerEvents: "none" }} />

      {/* 3D Drop */}
      <motion.div
        style={{ x: springX, y: springY, rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      >
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "clamp(260px,36vw,480px)", height: "clamp(260px,36vw,480px)", position: "relative", transformStyle: "preserve-3d" }}
        >
          {/* Main drop */}
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
            background: `
              radial-gradient(ellipse at 25% 15%, rgba(54,197,240,0.45) 0%, transparent 45%),
              radial-gradient(ellipse at 75% 65%, rgba(46,182,125,0.35) 0%, transparent 45%),
              radial-gradient(ellipse at 50% 85%, rgba(8,8,35,0.95) 0%, transparent 55%),
              linear-gradient(140deg, #0a1930 0%, #0d2e50 30%, #061222 55%, #0b2e40 80%, #050e1c 100%)
            `,
            animation: "drop-morph 10s ease-in-out infinite",
            boxShadow: `
              0 0 100px rgba(54,197,240,0.15),
              0 0 200px rgba(46,182,125,0.06),
              inset 0 0 80px rgba(54,197,240,0.08),
              inset 0 -50px 80px rgba(5,5,16,0.6)
            `,
            overflow: "hidden",
          }}>
            {/* Top highlight */}
            <div style={{ position: "absolute", top: "5%", left: "12%", width: "60%", height: "30%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.13) 0%, transparent 70%)", transform: "rotate(-20deg)", filter: "blur(10px)" }} />
            {/* Inner morphing shape */}
            <div style={{ position: "absolute", inset: "12%", borderRadius: "45% 55% 60% 35% / 35% 55% 40% 60%", background: "radial-gradient(ellipse at 35% 35%, rgba(54,197,240,0.1) 0%, transparent 55%)", animation: "drop-morph 7s ease-in-out infinite reverse" }} />
            {/* Continent shapes for globe feel */}
            <div style={{ position: "absolute", top: "28%", left: "20%", width: "45%", height: "28%", borderRadius: "25% 75% 45% 55% / 55% 25% 65% 35%", background: "rgba(150,190,220,0.1)", filter: "blur(3px)" }} />
            <div style={{ position: "absolute", top: "52%", left: "42%", width: "28%", height: "22%", borderRadius: "45% 55% 35% 65% / 60% 35% 55% 40%", background: "rgba(150,190,220,0.07)", filter: "blur(3px)" }} />
            {/* Bottom rim glow */}
            <div style={{ position: "absolute", bottom: "10%", right: "8%", width: "45%", height: "22%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(46,182,125,0.2) 0%, transparent 70%)", filter: "blur(14px)" }} />
            {/* Edge highlight */}
            <div style={{ position: "absolute", top: "15%", right: "5%", width: "15%", height: "40%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)", filter: "blur(6px)" }} />
          </div>

          {/* Ambient haze */}
          <div style={{ position: "absolute", inset: "-35%", borderRadius: "50%", background: "radial-gradient(circle, rgba(54,197,240,0.05) 0%, transparent 55%)", filter: "blur(50px)", pointerEvents: "none" }} />
        </motion.div>
      </motion.div>

      {/* Floating card – left */}
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        style={{
          position: "absolute", left: "6%", top: "32%",
          background: "rgba(12,12,28,0.8)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 20px",
          minWidth: 170, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          transform: "perspective(600px) rotateY(6deg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Teams</span>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(54,197,240,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H3M8 2V7" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Unparalleled</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>Market Access</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.25)" }}>46%</span>
      </motion.div>

      {/* Floating card – right */}
      <motion.div
        animate={{ y: [0, -11, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        style={{
          position: "absolute", right: "5%", bottom: "22%",
          background: "rgba(12,12,28,0.8)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 20px",
          minWidth: 150, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          transform: "perspective(600px) rotateY(-5deg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Retention</span>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(46,182,125,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H3M8 2V7" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>96%</div>
        <div style={{ width: 36, height: 3, background: "linear-gradient(90deg,#4F46E5,#10B981)", borderRadius: 2, marginTop: 6 }} />
      </motion.div>
    </div>
  );
}

