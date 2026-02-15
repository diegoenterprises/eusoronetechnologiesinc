/**
 * ESANG AI FLOATING BUTTON — Fixed bottom-right on all dashboard screens
 * Canvas-based particle physics animation (same engine as gas tanker animation)
 * Particles float with velocity, sine-wave drift, radial gradient glow
 * Click navigates to /esang chat page
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getApprovalStatus } from "@/lib/approvalGating";
import EsangChatWidget from "./EsangChatWidget";

const BLUE = "#1473FF";
const PURPLE = "#BE01FF";
const VIOLET = "#8B5CF6";

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  opacity: number;
  phase: number;
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function EsangFloatingButton() {
  const { user } = useAuth();
  const approvalStatus = getApprovalStatus(user);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDissolving, setChatDissolving] = useState(false);
  const [chatParticles, setChatParticles] = useState<Array<{startX: number; startY: number; delay: number; size: number; color: string; dur: number}>>([] );
  const [location, navigate] = useLocation();
  const isOnEsang = location === "/esang" || location === "/ai-assistant";

  const SIZE = 56;
  const CANVAS_SIZE = 80;

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 20;
      particles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        r: 1.2 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        opacity: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    if (particlesRef.current.length === 0) {
      particlesRef.current = initParticles();
    }

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    const radius = SIZE / 2;

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const lt = isLightRef.current;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Outer glow ring — stronger in light mode for visibility
      const glowGrad = ctx.createRadialGradient(cx, cy, radius - 4, cx, cy, radius + 12);
      if (lt) {
        glowGrad.addColorStop(0, hexAlpha(PURPLE, 0.35 + Math.sin(t * 1.5) * 0.1));
        glowGrad.addColorStop(0.5, hexAlpha(BLUE, 0.2));
        glowGrad.addColorStop(1, hexAlpha(PURPLE, 0));
      } else {
        glowGrad.addColorStop(0, hexAlpha(PURPLE, 0.15 + Math.sin(t * 1.5) * 0.05));
        glowGrad.addColorStop(0.5, hexAlpha(BLUE, 0.08));
        glowGrad.addColorStop(1, hexAlpha(PURPLE, 0));
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Main circle background with gradient
      const bgGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      bgGrad.addColorStop(0, BLUE);
      bgGrad.addColorStop(0.5, VIOLET);
      bgGrad.addColorStop(1, PURPLE);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Clip particles to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
      ctx.clip();

      // Animated particles — same physics as gas tanker
      for (const p of particlesRef.current) {
        p.x += p.vx + Math.sin(t * 1.2 + p.phase) * 0.25;
        p.y += p.vy + Math.cos(t * 0.9 + p.phase) * 0.25;
        p.opacity = 0.15 + Math.sin(t * 2 + p.phase) * 0.15 + 0.25;

        // Bounce within circle
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius - p.r * 2) {
          const angle = Math.atan2(dy, dx);
          p.x = cx + Math.cos(angle) * (radius - p.r * 2 - 2);
          p.y = cy + Math.sin(angle) * (radius - p.r * 2 - 2);
          p.vx = -p.vx * 0.5 + (Math.random() - 0.5) * 0.3;
          p.vy = -p.vy * 0.5 + (Math.random() - 0.5) * 0.3;
        }

        // Radial gradient particle glow
        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        pGrad.addColorStop(0, hexAlpha("#ffffff", p.opacity * 0.9));
        pGrad.addColorStop(0.3, hexAlpha("#ffffff", p.opacity * 0.4));
        pGrad.addColorStop(1, hexAlpha("#ffffff", 0));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = pGrad;
        ctx.fill();

        // Core bright dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha("#ffffff", p.opacity * 0.8);
        ctx.fill();
      }

      ctx.restore();

      // Neural network icon in center (brain nodes + connections)
      const nodeColor = hexAlpha("#ffffff", 0.85 + Math.sin(t * 3) * 0.1);
      const lineColor = hexAlpha("#ffffff", 0.3 + Math.sin(t * 2) * 0.1);

      // Center node
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();

      // Surrounding nodes (neural ring)
      const nodeCount = 6;
      const nodeRadius = 14;
      const nodes: [number, number][] = [];
      for (let i = 0; i < nodeCount; i++) {
        const a = (i / nodeCount) * Math.PI * 2 - Math.PI / 2 + Math.sin(t * 0.5) * 0.1;
        const nx = cx + Math.cos(a) * nodeRadius;
        const ny = cy + Math.sin(a) * nodeRadius;
        nodes.push([nx, ny]);

        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // Connection to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Cross connections between adjacent nodes
      for (let i = 0; i < nodeCount; i++) {
        const next = (i + 1) % nodeCount;
        ctx.beginPath();
        ctx.moveTo(nodes[i][0], nodes[i][1]);
        ctx.lineTo(nodes[next][0], nodes[next][1]);
        ctx.strokeStyle = hexAlpha("#ffffff", 0.15);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Pulsing outer ring — white in dark mode, colored in light mode
      const ringAlpha = 0.2 + Math.sin(t * 2) * 0.1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
      ctx.strokeStyle = lt ? hexAlpha(PURPLE, ringAlpha + 0.15) : hexAlpha("#ffffff", ringAlpha);
      ctx.lineWidth = lt ? 1.5 : 1;
      ctx.stroke();

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [initParticles, isLight]);

  // Auto-expand label briefly on mount
  useEffect(() => {
    const timer = setTimeout(() => setExpanded(true), 1500);
    const hide = setTimeout(() => setExpanded(false), 5000);
    return () => { clearTimeout(timer); clearTimeout(hide); };
  }, []);

  // Never show mini chat while on /esang full page
  useEffect(() => {
    if (isOnEsang && chatOpen) setChatOpen(false);
  }, [isOnEsang]);

  // Gate: ESANG AI is only available to approved users
  if (approvalStatus !== "approved") return null;

  return (
    <>
      {/* Floating button — transformed motion.div (creates containing block) */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-0 cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        onMouseEnter={() => { setHovered(true); if (!chatOpen) setExpanded(true); }}
        onMouseLeave={() => { setHovered(false); if (!chatOpen) setExpanded(false); }}
        onClick={() => {
          if (isOnEsang) {
            window.dispatchEvent(new Event('esang-dissolve'));
            const prevPage = sessionStorage.getItem('esang-prev-page') || '/dashboard';
            setTimeout(() => {
              navigate(prevPage);
              setChatOpen(true);
            }, 700);
          } else if (chatOpen && !chatDissolving) {
            // Dissolve the mini chatbox with particles
            const colors = isLight
              ? ['#0D5FE3', '#9B00D4', '#7C3AED', '#4F46E5', '#9333EA']
              : ['#1473FF', '#BE01FF', '#8B5CF6', '#6366F1', '#A855F7'];
            setChatParticles(
              Array.from({ length: 30 }, () => ({
                startX: window.innerWidth - 390 + Math.random() * 360,
                startY: window.innerHeight - 560 + Math.random() * 480,
                delay: Math.random() * 0.25,
                size: 3 + Math.random() * 7,
                color: colors[Math.floor(Math.random() * colors.length)],
                dur: 0.35 + Math.random() * 0.35,
              }))
            );
            setChatDissolving(true);
            setTimeout(() => {
              setChatOpen(false);
              setChatDissolving(false);
              setChatParticles([]);
            }, 650);
          } else {
            setChatOpen(true);
          }
        }}
      >
        {/* Expanded label */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className={`${isLight ? "bg-white text-slate-800 shadow-lg shadow-slate-300/50 border border-slate-200" : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-purple-500/25"} text-base font-semibold px-4 py-2.5 rounded-l-full whitespace-nowrap mr-[-12px] pr-5 lowercase tracking-[0.15em]`} style={{ fontFamily: "'Inter', 'Gilroy', system-ui, sans-serif" }}>
                esang
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated circle button */}
        <motion.div
          className="relative flex-shrink-0"
          animate={{
            scale: hovered ? 1.1 : 1,
            filter: hovered ? "drop-shadow(0 0 20px rgba(190, 1, 255, 0.5))" : "drop-shadow(0 4px 12px rgba(20, 115, 255, 0.3))",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              display: "block",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Chat Widget — outside transformed parent so fixed positioning works */}
      <EsangChatWidget open={(chatOpen || chatDissolving) && !isOnEsang} onClose={() => setChatOpen(false)} dissolving={chatDissolving} />

      {/* Mini chat dissolution particles — outside transformed parent so fixed inset-0 covers viewport */}
      {chatDissolving && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          {chatParticles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: isLight
                  ? `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}40`
                  : `0 0 ${p.size * 2}px ${p.color}`,
              }}
              initial={{ left: p.startX, top: p.startY, opacity: 1, scale: 1 }}
              animate={{
                left: window.innerWidth - 46,
                top: window.innerHeight - 46,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                ease: [0.6, 0, 0.2, 1],
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
