/**
 * LOAD CARGO ANIMATION — Canvas-based physics graphics
 * Renders animated cargo visualization per equipment/cargo type
 * Uses brand gradient (#1473FF → #BE01FF) throughout
 *
 * Animations:
 * - liquid_tank / tank: Sloshing liquid waves inside tank silhouette
 * - gas_tank / tanker: Floating gas particles with gradient glow
 * - flatbed: Stacked cargo pallets with subtle hover
 * - dry-van / dry_van: Boxes inside container with gentle sway
 * - reefer: Refrigerated frost particles + cold gradient
 * - hopper: Granular particles flowing
 * - cryogenic: Frozen mist with ice crystals
 * - default: Gradient cargo boxes
 */

import React, { useRef, useEffect, useCallback } from "react";
import { inferAnimationType } from "@/lib/loadUtils";

// Brand gradient colors
const BLUE = "#1473FF";
const PURPLE = "#BE01FF";
const VIOLET = "#8B5CF6";

interface LoadCargoAnimationProps {
  equipmentType?: string | null;
  cargoType?: string | null;
  hazmatClass?: string | null;
  compartments?: number;
  className?: string;
  height?: number;
  isLight?: boolean;
  isHazmat?: boolean;
}

export default function LoadCargoAnimation({
  equipmentType,
  cargoType,
  hazmatClass,
  compartments = 1,
  className = "",
  height = 120,
  isLight = false,
  isHazmat = false,
}: LoadCargoAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<any[]>([]);
  const initializedRef = useRef(false);

  const getAnimationType = useCallback(() => {
    // Use centralized inference: equipmentType → cargoType → hazmatClass
    const result = inferAnimationType(equipmentType, cargoType, hazmatClass);
    // Map "default" to "dryvan" for canvas rendering
    return result === "default" ? "dryvan" : result;
  }, [equipmentType, cargoType, hazmatClass]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const animType = getAnimationType();

    // Initialize particles once
    if (!initializedRef.current) {
      particlesRef.current = initParticles(animType, w, h, compartments);
      initializedRef.current = true;
    }

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      ctx.clearRect(0, 0, w, h);

      switch (animType) {
        case "liquid":
          drawLiquidTank(ctx, w, h, timeRef.current, compartments, isLight);
          break;
        case "gas":
          drawGasParticles(ctx, w, h, timeRef.current, particlesRef.current, isLight);
          break;
        case "flatbed":
          drawFlatbedCargo(ctx, w, h, timeRef.current, isLight);
          break;
        case "reefer":
          drawReeferFrost(ctx, w, h, timeRef.current, particlesRef.current, isLight);
          break;
        case "dryvan":
          drawDryVanBoxes(ctx, w, h, timeRef.current, isLight);
          break;
        case "hopper":
          drawHopperGranules(ctx, w, h, timeRef.current, particlesRef.current, isLight);
          break;
        case "cryogenic":
          drawCryogenicMist(ctx, w, h, timeRef.current, particlesRef.current, isLight);
          break;
        case "hazmat":
          drawHazmatCargo(ctx, w, h, timeRef.current, isLight);
          break;
        case "autocarrier":
          drawAutoCarrier(ctx, w, h, timeRef.current, isLight);
          break;
        case "livestock":
          drawLivestock(ctx, w, h, timeRef.current, isLight);
          break;
        case "dump":
          drawDumpTrailer(ctx, w, h, timeRef.current, particlesRef.current, isLight);
          break;
        case "intermodal":
          drawIntermodal(ctx, w, h, timeRef.current, isLight);
          break;
        default:
          drawDefaultCargo(ctx, w, h, timeRef.current, isLight);
          break;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [getAnimationType, height, compartments, isLight]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height, display: "block" }}
    />
  );
}

// ============================================================================
// PARTICLE INITIALIZATION
// ============================================================================

function initParticles(type: string, w: number, h: number, compartments: number): any[] {
  const particles: any[] = [];

  if (type === "gas") {
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 2 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.2 - Math.random() * 0.5,
        opacity: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  } else if (type === "reefer") {
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.1 + Math.random() * 0.3,
        opacity: 0.3 + Math.random() * 0.4,
        type: Math.random() > 0.6 ? "flake" : "dot",
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }
  } else if (type === "hopper") {
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: w * 0.2 + Math.random() * w * 0.6,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 2,
        vy: 0.3 + Math.random() * 0.8,
        opacity: 0.4 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
  } else if (type === "cryogenic") {
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * w,
        y: h * 0.3 + Math.random() * h * 0.6,
        r: 2 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.1 - Math.random() * 0.3,
        opacity: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        type: Math.random() > 0.7 ? "crystal" : "mist",
      });
    }
  }

  return particles;
}

// ============================================================================
// GRADIENT HELPERS
// ============================================================================

function createBrandGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, alpha = 1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, hexAlpha(BLUE, alpha));
  g.addColorStop(0.5, hexAlpha(VIOLET, alpha));
  g.addColorStop(1, hexAlpha(PURPLE, alpha));
  return g;
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// TANK SILHOUETTE (shared by liquid, gas, cryogenic)
// ============================================================================

function drawTankOutline(ctx: CanvasRenderingContext2D, w: number, h: number, isLight: boolean) {
  const margin = w * 0.08;
  const tankW = w - margin * 2;
  const tankH = h * 0.55;
  const tankY = h * 0.22;
  const radius = tankH * 0.45;

  ctx.beginPath();
  ctx.moveTo(margin + radius, tankY);
  ctx.lineTo(margin + tankW - radius, tankY);
  ctx.arcTo(margin + tankW, tankY, margin + tankW, tankY + radius, radius);
  ctx.lineTo(margin + tankW, tankY + tankH - radius);
  ctx.arcTo(margin + tankW, tankY + tankH, margin + tankW - radius, tankY + tankH, radius);
  ctx.lineTo(margin + radius, tankY + tankH);
  ctx.arcTo(margin, tankY + tankH, margin, tankY + tankH - radius, radius);
  ctx.lineTo(margin, tankY + radius);
  ctx.arcTo(margin, tankY, margin + radius, tankY, radius);
  ctx.closePath();

  return { margin, tankW, tankH, tankY, radius };
}

// ============================================================================
// 1. LIQUID TANK — sloshing waves
// ============================================================================

function drawLiquidTank(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, compartments: number, isLight: boolean) {
  if (compartments > 1) {
    // ═══════════ MULTI-COMPARTMENT SIDE-VIEW TANKER ═══════════
    // Shows a proper side profile of a tanker truck with visible compartment walls
    const truckH = h * 0.48;
    const truckY = h * 0.18;
    const truckW = w * 0.82;
    const truckX = (w - truckW) / 2;
    const compW = truckW / compartments;
    const wallThickness = 3;

    // Truck cab (right side)
    const cabW = w * 0.12;
    const cabX = truckX + truckW + 2;
    const cabH = truckH * 0.7;
    const cabY = truckY + truckH - cabH;
    ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.12) : hexAlpha(BLUE, 0.15);
    roundRect(ctx, cabX, cabY, cabW, cabH, 4);
    ctx.fill();
    ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.2) : hexAlpha(BLUE, 0.3);
    ctx.lineWidth = 1;
    roundRect(ctx, cabX, cabY, cabW, cabH, 4);
    ctx.stroke();
    // Cab window
    ctx.fillStyle = hexAlpha("#38bdf8", 0.15);
    roundRect(ctx, cabX + 3, cabY + 3, cabW - 6, cabH * 0.35, 2);
    ctx.fill();

    // Chassis line
    const chassisY = truckY + truckH + 2;
    ctx.fillStyle = isLight ? hexAlpha("#475569", 0.2) : hexAlpha("#475569", 0.35);
    roundRect(ctx, truckX - 5, chassisY, truckW + cabW + 12, 4, 2);
    ctx.fill();

    // Wheels
    const wheelR = 7;
    const wheelY = chassisY + 6;
    const wheelPositions = [truckX + 15, truckX + 35, truckX + truckW - 35, truckX + truckW - 15, cabX + cabW * 0.5];
    for (const wx of wheelPositions) {
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? hexAlpha("#334155", 0.35) : hexAlpha("#475569", 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx, wheelY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? hexAlpha("#94a3b8", 0.4) : hexAlpha("#64748b", 0.6);
      ctx.fill();
      // Spinning spoke
      const spoke = t * 3;
      ctx.strokeStyle = hexAlpha("#94a3b8", 0.3);
      ctx.lineWidth = 0.5;
      for (let a = 0; a < 3; a++) {
        const angle = spoke + (Math.PI * 2 / 3) * a;
        ctx.beginPath();
        ctx.moveTo(wx, wheelY);
        ctx.lineTo(wx + Math.cos(angle) * 5, wheelY + Math.sin(angle) * 5);
        ctx.stroke();
      }
    }

    // Compartment fill colors (alternate between brand gradient shades)
    const compColors = [BLUE, VIOLET, PURPLE, "#6366f1", "#3b82f6"];

    for (let c = 0; c < compartments; c++) {
      const cx = truckX + c * compW;
      const isFirst = c === 0;
      const isLast = c === compartments - 1;
      const rL = isFirst ? truckH * 0.35 : 0;
      const rR = isLast ? truckH * 0.35 : 0;

      // Draw compartment outline (rounded ends for first/last)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + rL, truckY);
      ctx.lineTo(cx + compW - rR, truckY);
      if (isLast) ctx.arcTo(cx + compW, truckY, cx + compW, truckY + rR, rR);
      else ctx.lineTo(cx + compW, truckY);
      ctx.lineTo(cx + compW, truckY + truckH);
      if (isLast) {} else ctx.lineTo(cx + compW, truckY + truckH);
      ctx.lineTo(cx + rL, truckY + truckH);
      if (isFirst) ctx.arcTo(cx, truckY + truckH, cx, truckY + truckH - rL, rL);
      else ctx.lineTo(cx, truckY + truckH);
      ctx.lineTo(cx, truckY + rL);
      if (isFirst) ctx.arcTo(cx, truckY, cx + rL, truckY, rL);
      else ctx.lineTo(cx, truckY);
      ctx.closePath();

      // Light outline
      ctx.strokeStyle = isLight ? hexAlpha(compColors[c % compColors.length], 0.25) : hexAlpha(compColors[c % compColors.length], 0.35);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Clip to this compartment
      ctx.clip();

      // Each compartment has its own fill level + wave phase
      const fillLevel = 0.6 + c * 0.06 + Math.sin(t * 0.5 + c * 1.2) * 0.05;
      const liquidTop = truckY + truckH * (1 - fillLevel);
      const baseColor = compColors[c % compColors.length];

      // Liquid fill
      const grad = ctx.createLinearGradient(cx, liquidTop, cx, truckY + truckH);
      grad.addColorStop(0, hexAlpha(baseColor, 0.45));
      grad.addColorStop(0.5, hexAlpha(VIOLET, 0.5));
      grad.addColorStop(1, hexAlpha(baseColor, 0.65));
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(cx - 2, truckY + truckH + 2);
      for (let x = cx; x <= cx + compW; x += 2) {
        const nx = (x - cx) / compW;
        const wave1 = Math.sin(nx * Math.PI * 4 + t * 2.5 + c * 1.5) * 3;
        const wave2 = Math.sin(nx * Math.PI * 6 - t * 1.8 + c * 0.8) * 1.5;
        ctx.lineTo(x, liquidTop + wave1 + wave2);
      }
      ctx.lineTo(cx + compW + 2, truckY + truckH + 2);
      ctx.closePath();
      ctx.fill();

      // Wave highlight
      ctx.strokeStyle = hexAlpha("#ffffff", 0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = cx + 2; x <= cx + compW - 2; x += 2) {
        const nx = (x - cx) / compW;
        const wave = Math.sin(nx * Math.PI * 4 + t * 2.5 + c * 1.5) * 3;
        if (x === cx + 2) ctx.moveTo(x, liquidTop + wave);
        else ctx.lineTo(x, liquidTop + wave);
      }
      ctx.stroke();

      // Reflection dots
      for (let i = 0; i < 2; i++) {
        const rx = cx + compW * 0.3 + i * compW * 0.4;
        const ry = liquidTop + Math.sin(t * 2 + c + i) * 2;
        ctx.beginPath();
        ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha("#ffffff", 0.3 + Math.sin(t * 3 + c + i) * 0.15);
        ctx.fill();
      }

      ctx.restore();

      // Compartment wall (thick divider between compartments)
      if (c < compartments - 1) {
        const wallX = cx + compW - wallThickness / 2;
        ctx.fillStyle = isLight ? hexAlpha("#475569", 0.3) : hexAlpha("#64748b", 0.4);
        ctx.fillRect(wallX, truckY + 2, wallThickness, truckH - 4);
        // Rivet dots
        for (let r = 0; r < 3; r++) {
          const ry = truckY + 8 + r * ((truckH - 16) / 2);
          ctx.beginPath();
          ctx.arc(wallX + wallThickness / 2, ry, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha("#94a3b8", 0.5);
          ctx.fill();
        }
      }

      // Compartment number label
      ctx.font = "bold 9px Inter, system-ui, sans-serif";
      ctx.fillStyle = hexAlpha("#ffffff", 0.6);
      ctx.textAlign = "center";
      ctx.fillText(`${c + 1}`, cx + compW / 2, truckY + 12);
    }

    // Tank label
    ctx.font = "bold 10px Inter, system-ui, sans-serif";
    ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha(BLUE, 0.6);
    ctx.textAlign = "center";
    ctx.fillText(`${compartments}-COMPARTMENT TANKER`, w / 2, wheelY + wheelR + 12);

  } else {
    // ═══════════ SINGLE COMPARTMENT TANKER ═══════════
    const { margin, tankW, tankH, tankY } = drawTankOutline(ctx, w, h, isLight);

    ctx.save();
    ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.3) : hexAlpha(BLUE, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();

    const fillLevel = 0.72 + Math.sin(t * 0.5) * 0.04;
    const liquidTop = tankY + tankH * (1 - fillLevel);

    const grad = createBrandGradient(ctx, margin, liquidTop, margin, tankY + tankH, 0.6);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(margin - 5, tankY + tankH + 5);
    for (let x = margin - 5; x <= margin + tankW + 5; x += 2) {
      const nx = (x - margin) / tankW;
      const wave1 = Math.sin(nx * Math.PI * 3 + t * 2.5) * 4;
      const wave2 = Math.sin(nx * Math.PI * 5 - t * 1.8) * 2;
      const wave3 = Math.sin(nx * Math.PI * 7 + t * 3.2) * 1.5;
      ctx.lineTo(x, liquidTop + wave1 + wave2 + wave3);
    }
    ctx.lineTo(margin + tankW + 5, tankY + tankH + 5);
    ctx.closePath();
    ctx.fill();

    // Highlight wave
    const highlightGrad = createBrandGradient(ctx, margin, liquidTop - 3, margin + tankW, liquidTop + 5, 0.35);
    ctx.strokeStyle = highlightGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = margin; x <= margin + tankW; x += 2) {
      const nx = (x - margin) / tankW;
      const wave = Math.sin(nx * Math.PI * 3 + t * 2.5) * 4 + Math.sin(nx * Math.PI * 5 - t * 1.8) * 2;
      if (x === margin) ctx.moveTo(x, liquidTop + wave);
      else ctx.lineTo(x, liquidTop + wave);
    }
    ctx.stroke();
    ctx.restore();

    ctx.font = "bold 10px Inter, system-ui, sans-serif";
    ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha(BLUE, 0.6);
    ctx.textAlign = "center";
    ctx.fillText("LIQUID TANKER", w / 2, tankY + tankH + 18);

    for (let i = 0; i < 5; i++) {
      const rx = margin + 20 + i * (tankW / 5);
      const ry = liquidTop + Math.sin(t * 2 + i) * 3;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha("#ffffff", 0.3 + Math.sin(t * 3 + i * 2) * 0.15);
      ctx.fill();
    }
  }
}

// ============================================================================
// 2. GAS PARTICLES — floating gradient orbs
// ============================================================================

function drawGasParticles(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, particles: any[], isLight: boolean) {
  const { margin, tankW, tankH, tankY } = drawTankOutline(ctx, w, h, isLight);

  // Tank outline
  ctx.strokeStyle = isLight ? hexAlpha(PURPLE, 0.25) : hexAlpha(PURPLE, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Clip to tank
  ctx.save();
  ctx.clip();

  // Subtle fill
  const bgGrad = createBrandGradient(ctx, margin, tankY, margin + tankW, tankY + tankH, 0.06);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Animated gas particles
  for (const p of particles) {
    p.x += p.vx + Math.sin(t + p.phase) * 0.3;
    p.y += p.vy;
    p.opacity = 0.15 + Math.sin(t * 2 + p.phase) * 0.15 + 0.2;

    // Wrap around
    if (p.y < tankY - 10) p.y = tankY + tankH;
    if (p.x < margin - 10) p.x = margin + tankW;
    if (p.x > margin + tankW + 10) p.x = margin;

    // Radial gradient particle
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
    const colorMix = (p.x - margin) / tankW;
    const baseColor = colorMix < 0.5 ? BLUE : PURPLE;
    grad.addColorStop(0, hexAlpha(baseColor, p.opacity));
    grad.addColorStop(0.5, hexAlpha(baseColor, p.opacity * 0.4));
    grad.addColorStop(1, hexAlpha(baseColor, 0));

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core bright spot
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha("#ffffff", p.opacity * 0.5);
    ctx.fill();
  }

  ctx.restore();

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(PURPLE, 0.5) : hexAlpha(PURPLE, 0.6);
  ctx.textAlign = "center";
  ctx.fillText("GAS TANKER", w / 2, tankY + tankH + 18);
}

// ============================================================================
// 3. FLATBED — stacked pallets/cargo
// ============================================================================

function drawFlatbedCargo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const baseY = h * 0.72;
  const deckW = w * 0.75;
  const deckX = (w - deckW) / 2;

  // Flatbed deck
  const deckGrad = createBrandGradient(ctx, deckX, baseY, deckX + deckW, baseY + 6, 0.3);
  ctx.fillStyle = deckGrad;
  roundRect(ctx, deckX, baseY, deckW, 6, 2);
  ctx.fill();

  // Wheels
  for (let i = 0; i < 3; i++) {
    const wx = deckX + 30 + i * (deckW / 2 - 15);
    ctx.beginPath();
    ctx.arc(wx, baseY + 12, 7, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? hexAlpha("#334155", 0.4) : hexAlpha("#475569", 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx, baseY + 12, 3, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? hexAlpha("#94a3b8", 0.5) : hexAlpha("#64748b", 0.6);
    ctx.fill();
  }

  // Stacked cargo items (pallets, pipes, beams)
  const items = [
    { x: deckX + 15, w: deckW * 0.28, h: 22, type: "pallet" },
    { x: deckX + deckW * 0.32, w: deckW * 0.35, h: 30, type: "crate" },
    { x: deckX + deckW * 0.7, w: deckW * 0.22, h: 18, type: "pipe" },
  ];

  items.forEach((item, idx) => {
    const bobY = Math.sin(t * 1.5 + idx * 1.2) * 1.5;
    const itemY = baseY - item.h + bobY;
    const alpha = 0.5 + Math.sin(t + idx) * 0.1;

    if (item.type === "pipe") {
      // Cylindrical pipes
      for (let p = 0; p < 3; p++) {
        const py = itemY + p * 7;
        const pGrad = ctx.createLinearGradient(item.x, py, item.x, py + 6);
        pGrad.addColorStop(0, hexAlpha(BLUE, alpha * 0.8));
        pGrad.addColorStop(0.5, hexAlpha(VIOLET, alpha));
        pGrad.addColorStop(1, hexAlpha(BLUE, alpha * 0.6));
        ctx.fillStyle = pGrad;
        roundRect(ctx, item.x, py, item.w, 5, 2.5);
        ctx.fill();
      }
    } else {
      // Box/crate
      const boxGrad = createBrandGradient(ctx, item.x, itemY, item.x + item.w, itemY + item.h, alpha);
      ctx.fillStyle = boxGrad;
      roundRect(ctx, item.x, itemY, item.w, item.h, 3);
      ctx.fill();

      // Strap lines
      ctx.strokeStyle = hexAlpha("#ffffff", 0.2);
      ctx.lineWidth = 0.5;
      const straps = item.type === "crate" ? 3 : 2;
      for (let s = 1; s <= straps; s++) {
        const sx = item.x + (item.w / (straps + 1)) * s;
        ctx.beginPath();
        ctx.moveTo(sx, itemY);
        ctx.lineTo(sx, itemY + item.h);
        ctx.stroke();
      }
    }
  });

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha(BLUE, 0.55);
  ctx.textAlign = "center";
  ctx.fillText("FLATBED", w / 2, h * 0.15);
}

// ============================================================================
// 4. REEFER — frost particles + cold gradient
// ============================================================================

function drawReeferFrost(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, particles: any[], isLight: boolean) {
  const margin = w * 0.1;
  const boxW = w - margin * 2;
  const boxH = h * 0.58;
  const boxY = h * 0.18;

  // Container body
  ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.25) : hexAlpha(BLUE, 0.35);
  ctx.lineWidth = 1.5;
  roundRect(ctx, margin, boxY, boxW, boxH, 6);
  ctx.stroke();

  // Cold gradient fill
  const coldGrad = ctx.createLinearGradient(margin, boxY, margin + boxW, boxY + boxH);
  coldGrad.addColorStop(0, hexAlpha("#0ea5e9", 0.08));
  coldGrad.addColorStop(0.5, hexAlpha(BLUE, 0.06));
  coldGrad.addColorStop(1, hexAlpha(PURPLE, 0.04));
  ctx.fillStyle = coldGrad;
  roundRect(ctx, margin, boxY, boxW, boxH, 6);
  ctx.fill();

  // Reefer ridges
  ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.1) : hexAlpha(BLUE, 0.15);
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 8; i++) {
    const rx = margin + (boxW / 8) * i;
    ctx.beginPath();
    ctx.moveTo(rx, boxY + 4);
    ctx.lineTo(rx, boxY + boxH - 4);
    ctx.stroke();
  }

  // Snowflake / frost particles
  ctx.save();
  roundRect(ctx, margin, boxY, boxW, boxH, 6);
  ctx.clip();

  for (const p of particles) {
    p.x += p.vx + Math.sin(t * 0.8 + p.rotation) * 0.2;
    p.y += p.vy;
    p.rotation += p.rotSpeed;

    // Wrap
    if (p.y > boxY + boxH + 5) { p.y = boxY - 5; p.x = margin + Math.random() * boxW; }
    if (p.x < margin - 5) p.x = margin + boxW;
    if (p.x > margin + boxW + 5) p.x = margin;

    const flicker = 0.5 + Math.sin(t * 3 + p.rotation * 10) * 0.3;

    if (p.type === "flake") {
      // Snowflake
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.strokeStyle = hexAlpha("#93c5fd", p.opacity * flicker);
      ctx.lineWidth = 0.8;
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * p.r * 2, Math.sin(angle) * p.r * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Frost dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha("#93c5fd", p.opacity * flicker * 0.7);
      ctx.fill();
    }
  }

  ctx.restore();

  // Temperature indicator
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = hexAlpha("#38bdf8", 0.7);
  ctx.textAlign = "right";
  const tempVal = -18 + Math.sin(t * 0.3) * 2;
  ctx.fillText(`${tempVal.toFixed(0)}°F`, margin + boxW - 8, boxY + 16);

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha("#38bdf8", 0.6);
  ctx.textAlign = "center";
  ctx.fillText("REFRIGERATED", w / 2, boxY + boxH + 18);
}

// ============================================================================
// 5. DRY VAN — boxes inside container
// ============================================================================

function drawDryVanBoxes(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const margin = w * 0.1;
  const boxW = w - margin * 2;
  const boxH = h * 0.55;
  const boxY = h * 0.2;

  // Container body
  ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.2) : hexAlpha(BLUE, 0.3);
  ctx.lineWidth = 1.5;
  roundRect(ctx, margin, boxY, boxW, boxH, 5);
  ctx.stroke();

  // Faint fill
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.03) : hexAlpha(BLUE, 0.04);
  roundRect(ctx, margin, boxY, boxW, boxH, 5);
  ctx.fill();

  // Stacked boxes inside
  const boxes = [
    { x: 0.05, y: 0.55, w: 0.28, h: 0.4 },
    { x: 0.35, y: 0.35, w: 0.3, h: 0.6 },
    { x: 0.67, y: 0.5, w: 0.28, h: 0.45 },
    { x: 0.08, y: 0.15, w: 0.24, h: 0.35 },
    { x: 0.38, y: 0.05, w: 0.25, h: 0.28 },
    { x: 0.7, y: 0.1, w: 0.22, h: 0.35 },
  ];

  ctx.save();
  roundRect(ctx, margin, boxY, boxW, boxH, 5);
  ctx.clip();

  boxes.forEach((b, idx) => {
    const bx = margin + boxW * b.x;
    const by = boxY + boxH * b.y + Math.sin(t * 1.2 + idx * 0.8) * 0.8;
    const bw = boxW * b.w;
    const bh = boxH * b.h;
    const alpha = 0.25 + (idx % 3) * 0.1;

    const boxGrad = createBrandGradient(ctx, bx, by, bx + bw, by + bh, alpha);
    ctx.fillStyle = boxGrad;
    roundRect(ctx, bx, by, bw, bh, 2);
    ctx.fill();

    // Box outline
    ctx.strokeStyle = hexAlpha(VIOLET, alpha * 0.6);
    ctx.lineWidth = 0.5;
    roundRect(ctx, bx, by, bw, bh, 2);
    ctx.stroke();
  });

  ctx.restore();

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha(BLUE, 0.55);
  ctx.textAlign = "center";
  ctx.fillText("DRY VAN", w / 2, boxY + boxH + 18);
}

// ============================================================================
// 6. HOPPER — granular particles flowing
// ============================================================================

function drawHopperGranules(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, particles: any[], isLight: boolean) {
  const tankTop = h * 0.12;
  const tankBot = h * 0.75;
  const topW = w * 0.7;
  const botW = w * 0.25;
  const cx = w / 2;

  // Hopper shape (V-shape)
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, tankTop);
  ctx.lineTo(cx + topW / 2, tankTop);
  ctx.lineTo(cx + botW / 2, tankBot);
  ctx.lineTo(cx - botW / 2, tankBot);
  ctx.closePath();

  ctx.strokeStyle = isLight ? hexAlpha(PURPLE, 0.25) : hexAlpha(PURPLE, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Clip to hopper
  ctx.save();
  ctx.clip();

  // Fill gradient
  const fillGrad = createBrandGradient(ctx, cx - topW / 2, tankTop, cx + topW / 2, tankBot, 0.08);
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Granules
  for (const p of particles) {
    p.y += p.vy;
    p.x += Math.sin(t + p.phase) * 0.15;

    if (p.y > tankBot) {
      p.y = tankTop;
      p.x = cx + (Math.random() - 0.5) * topW * 0.8;
    }

    // Calculate width at this Y level (V-shape)
    const progress = (p.y - tankTop) / (tankBot - tankTop);
    const widthAtY = topW * (1 - progress) + botW * progress;
    const leftAtY = cx - widthAtY / 2;
    const rightAtY = cx + widthAtY / 2;

    if (p.x < leftAtY + 3) p.x = leftAtY + 3;
    if (p.x > rightAtY - 3) p.x = rightAtY - 3;

    const colorT = (p.x - leftAtY) / widthAtY;
    const color = colorT < 0.5 ? BLUE : PURPLE;
    const alpha = p.opacity * (0.7 + Math.sin(t * 2 + p.phase) * 0.3);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(color, alpha);
    ctx.fill();
  }

  ctx.restore();

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(PURPLE, 0.5) : hexAlpha(PURPLE, 0.55);
  ctx.textAlign = "center";
  ctx.fillText("DRY BULK / HOPPER", w / 2, tankBot + 18);
}

// ============================================================================
// 7. CRYOGENIC — frozen mist + ice crystals
// ============================================================================

function drawCryogenicMist(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, particles: any[], isLight: boolean) {
  const { margin, tankW, tankH, tankY } = drawTankOutline(ctx, w, h, isLight);

  // Tank body with icy outline
  ctx.strokeStyle = hexAlpha("#38bdf8", 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  ctx.clip();

  // Dark icy fill
  const icyGrad = ctx.createLinearGradient(margin, tankY, margin + tankW, tankY + tankH);
  icyGrad.addColorStop(0, hexAlpha("#0c4a6e", 0.15));
  icyGrad.addColorStop(0.5, hexAlpha(BLUE, 0.1));
  icyGrad.addColorStop(1, hexAlpha(PURPLE, 0.08));
  ctx.fillStyle = icyGrad;
  ctx.fill();

  // Mist particles
  for (const p of particles) {
    p.x += p.vx + Math.sin(t * 0.7 + p.phase) * 0.4;
    p.y += p.vy + Math.cos(t * 0.5 + p.phase) * 0.2;

    if (p.y < tankY - 10) { p.y = tankY + tankH * 0.8; p.x = margin + Math.random() * tankW; }
    if (p.x < margin - 10) p.x = margin + tankW;
    if (p.x > margin + tankW + 10) p.x = margin;

    const flicker = 0.6 + Math.sin(t * 2.5 + p.phase) * 0.4;

    if (p.type === "crystal") {
      // Ice crystal — diamond shape
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(t * 0.3 + p.phase);
      const s = p.r * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.6, 0);
      ctx.closePath();
      ctx.fillStyle = hexAlpha("#93c5fd", p.opacity * flicker);
      ctx.fill();
      ctx.strokeStyle = hexAlpha("#bfdbfe", p.opacity * flicker * 0.5);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    } else {
      // Mist blob
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, hexAlpha("#38bdf8", p.opacity * flicker * 0.5));
      grad.addColorStop(0.5, hexAlpha(BLUE, p.opacity * flicker * 0.2));
      grad.addColorStop(1, hexAlpha(BLUE, 0));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  ctx.restore();

  // Frost line on top edge
  ctx.strokeStyle = hexAlpha("#93c5fd", 0.3 + Math.sin(t * 2) * 0.1);
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(margin + 10, tankY + 2);
  ctx.lineTo(margin + tankW - 10, tankY + 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = hexAlpha("#38bdf8", 0.65);
  ctx.textAlign = "center";
  ctx.fillText("CRYOGENIC TANK", w / 2, tankY + tankH + 18);
}

// ============================================================================
// 8. HAZMAT — warning symbols and hazmat diamonds
// ============================================================================

function drawHazmatCargo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const cx = w / 2;
  const cy = h * 0.42;

  // Pulsing glow effect
  const pulse = 0.6 + Math.sin(t * 2) * 0.2;
  const warningColor = "#ef4444";
  const warningColorAlt = "#f97316";

  // Draw hazmat diamond (rotated square)
  const diamondSize = Math.min(w, h) * 0.32;
  const bobY = Math.sin(t * 1.5) * 2;

  ctx.save();
  ctx.translate(cx, cy + bobY);
  ctx.rotate(Math.PI / 4);

  // Diamond outline with glow
  ctx.shadowColor = warningColor;
  ctx.shadowBlur = 8 + Math.sin(t * 3) * 4;
  ctx.strokeStyle = hexAlpha(warningColor, pulse);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);

  // Diamond fill
  const diamondGrad = ctx.createLinearGradient(-diamondSize / 2, -diamondSize / 2, diamondSize / 2, diamondSize / 2);
  diamondGrad.addColorStop(0, hexAlpha(warningColor, 0.15));
  diamondGrad.addColorStop(0.5, hexAlpha(warningColorAlt, 0.2));
  diamondGrad.addColorStop(1, hexAlpha(warningColor, 0.15));
  ctx.fillStyle = diamondGrad;
  ctx.fillRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);

  ctx.shadowBlur = 0;
  ctx.restore();

  // Draw hazmat symbol (trefoil / radiation-like pattern) in center
  ctx.save();
  ctx.translate(cx, cy + bobY);

  // Central warning icon - three curved blades
  const bladeCount = 3;
  const bladeRadius = diamondSize * 0.22;
  const innerRadius = bladeRadius * 0.35;

  for (let i = 0; i < bladeCount; i++) {
    const angle = (Math.PI * 2 / bladeCount) * i - Math.PI / 2 + t * 0.3;
    const x1 = Math.cos(angle) * innerRadius;
    const y1 = Math.sin(angle) * innerRadius;
    const x2 = Math.cos(angle) * bladeRadius;
    const y2 = Math.sin(angle) * bladeRadius;

    // Draw blade
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.arc(0, 0, bladeRadius, angle - 0.5, angle + 0.5);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.fillStyle = hexAlpha(warningColor, pulse * 0.9);
    ctx.fill();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha(warningColorAlt, pulse);
  ctx.fill();

  ctx.restore();

  // Floating warning particles
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i + t * 0.5;
    const radius = diamondSize * 0.55 + Math.sin(t * 2 + i) * 5;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius + bobY;
    const particleAlpha = 0.3 + Math.sin(t * 3 + i * 1.5) * 0.2;

    ctx.beginPath();
    ctx.arc(px, py, 2 + Math.sin(t * 2 + i) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(i % 2 === 0 ? warningColor : warningColorAlt, particleAlpha);
    ctx.fill();
  }

  // Side hazmat class indicators
  const classBoxSize = 18;
  const classBoxY = cy - 8;

  // Left class box
  ctx.fillStyle = hexAlpha(warningColor, 0.2 + Math.sin(t * 2.5) * 0.1);
  roundRect(ctx, cx - diamondSize - 10, classBoxY, classBoxSize, classBoxSize, 3);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(warningColor, 0.5);
  ctx.lineWidth = 1;
  roundRect(ctx, cx - diamondSize - 10, classBoxY, classBoxSize, classBoxSize, 3);
  ctx.stroke();
  ctx.font = "bold 9px Inter, system-ui, sans-serif";
  ctx.fillStyle = hexAlpha(warningColor, 0.9);
  ctx.textAlign = "center";
  ctx.fillText("3", cx - diamondSize - 10 + classBoxSize / 2, classBoxY + 13);

  // Right class box
  ctx.fillStyle = hexAlpha(warningColorAlt, 0.2 + Math.sin(t * 2.5 + 1) * 0.1);
  roundRect(ctx, cx + diamondSize - 8, classBoxY, classBoxSize, classBoxSize, 3);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(warningColorAlt, 0.5);
  roundRect(ctx, cx + diamondSize - 8, classBoxY, classBoxSize, classBoxSize, 3);
  ctx.stroke();
  ctx.fillStyle = hexAlpha(warningColorAlt, 0.9);
  ctx.fillText("UN", cx + diamondSize - 8 + classBoxSize / 2, classBoxY + 13);

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = hexAlpha(warningColor, 0.7 + Math.sin(t * 2) * 0.15);
  ctx.textAlign = "center";
  ctx.fillText("HAZARDOUS MATERIAL", w / 2, h * 0.88);
}

// ============================================================================
// 9. DEFAULT — gradient cargo boxes
// ============================================================================

function drawDefaultCargo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const cx = w / 2;
  const cy = h * 0.45;

  // Three stacked gradient boxes
  const sizes = [
    { w: 50, h: 35, ox: -30, oy: 10 },
    { w: 45, h: 40, ox: 5, oy: -5 },
    { w: 38, h: 30, ox: -8, oy: -25 },
  ];

  sizes.forEach((s, idx) => {
    const bx = cx + s.ox + Math.sin(t * 1.3 + idx * 1.5) * 1.5;
    const by = cy + s.oy + Math.cos(t * 1.1 + idx * 1.2) * 1;
    const alpha = 0.3 + idx * 0.1;

    const grad = createBrandGradient(ctx, bx, by, bx + s.w, by + s.h, alpha);
    ctx.fillStyle = grad;
    roundRect(ctx, bx, by, s.w, s.h, 4);
    ctx.fill();

    ctx.strokeStyle = hexAlpha(VIOLET, alpha * 0.6);
    ctx.lineWidth = 0.8;
    roundRect(ctx, bx, by, s.w, s.h, 4);
    ctx.stroke();

    // Tape/strap
    ctx.strokeStyle = hexAlpha("#ffffff", 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + s.w / 2, by);
    ctx.lineTo(bx + s.w / 2, by + s.h);
    ctx.stroke();
  });

  // Label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.45) : hexAlpha(BLUE, 0.5);
  ctx.textAlign = "center";
  ctx.fillText("CARGO", w / 2, h * 0.88);
}

// ============================================================================
// 10. AUTO CARRIER — multi-level car silhouettes on carrier frame
// ============================================================================

function drawAutoCarrier(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const baseY = h * 0.78;
  const frameW = w * 0.82;
  const frameX = (w - frameW) / 2;

  // Carrier frame rails
  ctx.strokeStyle = hexAlpha(BLUE, isLight ? 0.35 : 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(frameX, baseY);
  ctx.lineTo(frameX + frameW, baseY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(frameX + frameW * 0.08, baseY - h * 0.32);
  ctx.lineTo(frameX + frameW * 0.95, baseY - h * 0.32);
  ctx.stroke();
  // Ramp supports
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const sx = frameX + frameW * (0.15 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(sx, baseY);
    ctx.lineTo(sx + 3, baseY - h * 0.32);
    ctx.stroke();
  }

  // Car silhouettes — lower deck (3 cars)
  for (let i = 0; i < 3; i++) {
    const cx = frameX + frameW * (0.12 + i * 0.28);
    const cy = baseY - 6;
    const cw = frameW * 0.22;
    const ch = h * 0.12;
    const bob = Math.sin(t * 1.5 + i * 1.8) * 0.8;
    const alpha = 0.25 + i * 0.05;
    const grad = createBrandGradient(ctx, cx, cy - ch + bob, cx + cw, cy + bob, alpha);
    ctx.fillStyle = grad;
    // Body
    roundRect(ctx, cx, cy - ch + bob, cw, ch * 0.6, 3);
    ctx.fill();
    // Roof
    roundRect(ctx, cx + cw * 0.15, cy - ch - ch * 0.25 + bob, cw * 0.7, ch * 0.35, 3);
    ctx.fill();
    // Wheels
    ctx.fillStyle = hexAlpha(isLight ? "#334155" : "#94a3b8", 0.4);
    ctx.beginPath(); ctx.arc(cx + cw * 0.22, cy + bob, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + cw * 0.78, cy + bob, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Upper deck (2 cars)
  for (let i = 0; i < 2; i++) {
    const cx = frameX + frameW * (0.2 + i * 0.32);
    const cy = baseY - h * 0.32 - 4;
    const cw = frameW * 0.22;
    const ch = h * 0.11;
    const bob = Math.sin(t * 1.3 + i * 2.1 + 1) * 0.6;
    const alpha = 0.2 + i * 0.05;
    const grad = createBrandGradient(ctx, cx, cy - ch + bob, cx + cw, cy + bob, alpha);
    ctx.fillStyle = grad;
    roundRect(ctx, cx, cy - ch + bob, cw, ch * 0.6, 3);
    ctx.fill();
    roundRect(ctx, cx + cw * 0.15, cy - ch - ch * 0.25 + bob, cw * 0.7, ch * 0.35, 3);
    ctx.fill();
    ctx.fillStyle = hexAlpha(isLight ? "#334155" : "#94a3b8", 0.4);
    ctx.beginPath(); ctx.arc(cx + cw * 0.22, cy + bob, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + cw * 0.78, cy + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // Carrier wheels
  ctx.fillStyle = hexAlpha(isLight ? "#1e293b" : "#64748b", 0.5);
  for (const wx of [0.1, 0.25, 0.75, 0.9]) {
    ctx.beginPath(); ctx.arc(frameX + frameW * wx, baseY + 5, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha(BLUE, 0.55);
  ctx.textAlign = "center";
  ctx.fillText("AUTO CARRIER", w / 2, baseY + 18);
}

// ============================================================================
// 11. LIVESTOCK — ventilated trailer with cattle silhouettes
// ============================================================================

function drawLivestock(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const margin = w * 0.1;
  const boxW = w - margin * 2;
  const boxH = h * 0.5;
  const boxY = h * 0.18;
  const GREEN = "#22c55e";

  // Trailer body
  ctx.strokeStyle = hexAlpha(GREEN, isLight ? 0.3 : 0.4);
  ctx.lineWidth = 1.5;
  roundRect(ctx, margin, boxY, boxW, boxH, 6);
  ctx.stroke();

  // Ventilation slats
  ctx.strokeStyle = hexAlpha(GREEN, 0.2);
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 12; i++) {
    const sx = margin + 8 + i * (boxW - 16) / 11;
    ctx.beginPath();
    ctx.moveTo(sx, boxY + 4);
    ctx.lineTo(sx, boxY + boxH - 4);
    ctx.stroke();
  }

  // Cattle silhouettes (simplified)
  const cowPositions = [0.18, 0.38, 0.58, 0.78];
  cowPositions.forEach((px, i) => {
    const cx = margin + boxW * px;
    const cy = boxY + boxH * 0.55;
    const bob = Math.sin(t * 0.8 + i * 1.5) * 1.5;
    const sway = Math.sin(t * 0.6 + i * 2) * 1;
    const alpha = 0.35 + i * 0.05;

    ctx.fillStyle = hexAlpha(GREEN, alpha);
    // Body (oval)
    ctx.beginPath();
    ctx.ellipse(cx + sway, cy + bob, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.ellipse(cx + 12 + sway, cy - 6 + bob, 5, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = hexAlpha(GREEN, alpha * 0.8);
    ctx.lineWidth = 1.5;
    for (const lx of [-8, -3, 5, 10]) {
      ctx.beginPath();
      ctx.moveTo(cx + lx + sway, cy + 7 + bob);
      ctx.lineTo(cx + lx + sway, cy + 16 + bob);
      ctx.stroke();
    }
  });

  // Wheels
  ctx.fillStyle = hexAlpha(isLight ? "#1e293b" : "#64748b", 0.4);
  for (const wx of [0.15, 0.3, 0.7, 0.85]) {
    ctx.beginPath(); ctx.arc(margin + boxW * wx, boxY + boxH + 6, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(GREEN, 0.5) : hexAlpha(GREEN, 0.55);
  ctx.textAlign = "center";
  ctx.fillText("LIVESTOCK", w / 2, boxY + boxH + 20);
}

// ============================================================================
// 12. DUMP TRAILER — tilted trailer with cascading material
// ============================================================================

function drawDumpTrailer(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, particles: any[], isLight: boolean) {
  const AMBER = "#f59e0b";
  const baseY = h * 0.75;
  const trailerW = w * 0.55;
  const trailerH = h * 0.4;
  const pivotX = w * 0.25;
  const pivotY = baseY;

  // Tilt angle (oscillates slowly)
  const tiltAngle = -0.25 - Math.sin(t * 0.4) * 0.08;

  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(tiltAngle);

  // Trailer body (tilted)
  const grad = ctx.createLinearGradient(0, -trailerH, trailerW, 0);
  grad.addColorStop(0, hexAlpha(AMBER, 0.15));
  grad.addColorStop(1, hexAlpha(AMBER, 0.25));
  ctx.fillStyle = grad;
  roundRect(ctx, 0, -trailerH, trailerW, trailerH, 4);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(AMBER, isLight ? 0.3 : 0.45);
  ctx.lineWidth = 1.5;
  roundRect(ctx, 0, -trailerH, trailerW, trailerH, 4);
  ctx.stroke();

  // Material inside (aggregate/gravel fill)
  ctx.fillStyle = hexAlpha(AMBER, 0.2);
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(4, -trailerH * 0.6);
  ctx.lineTo(trailerW * 0.5, -trailerH * 0.5);
  ctx.lineTo(trailerW - 4, -trailerH * 0.15);
  ctx.lineTo(trailerW - 4, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Cascading particles from the dump end
  const dumpX = pivotX + Math.cos(tiltAngle) * trailerW;
  const dumpY = pivotY + Math.sin(tiltAngle) * trailerW;
  if (particles.length < 20) {
    for (let i = particles.length; i < 20; i++) {
      particles.push({ x: 0, y: 0, vx: Math.random() * 1.5 + 0.5, vy: Math.random() * 0.5, size: Math.random() * 3 + 1, life: 0, maxLife: 40 + Math.random() * 30 });
    }
  }
  particles.forEach(p => {
    p.life++;
    if (p.life > p.maxLife) { p.life = 0; p.x = 0; p.y = 0; p.vx = Math.random() * 1.5 + 0.5; p.vy = Math.random() * 0.5; }
    p.x += p.vx;
    p.vy += 0.08;
    p.y += p.vy;
    const alpha = Math.max(0, 1 - p.life / p.maxLife) * 0.5;
    ctx.fillStyle = hexAlpha(AMBER, alpha);
    ctx.beginPath();
    ctx.arc(dumpX + p.x, dumpY + p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ground line + pile
  ctx.fillStyle = hexAlpha(AMBER, 0.15);
  ctx.beginPath();
  ctx.moveTo(dumpX + 5, baseY + 3);
  ctx.quadraticCurveTo(dumpX + 25, baseY - 12, dumpX + 50, baseY + 3);
  ctx.closePath();
  ctx.fill();

  // Wheels
  ctx.fillStyle = hexAlpha(isLight ? "#1e293b" : "#64748b", 0.45);
  ctx.beginPath(); ctx.arc(pivotX + 15, baseY + 5, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pivotX + 35, baseY + 5, 5, 0, Math.PI * 2); ctx.fill();

  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(AMBER, 0.5) : hexAlpha(AMBER, 0.6);
  ctx.textAlign = "center";
  ctx.fillText("DUMP TRAILER", w / 2, baseY + 20);
}

// ============================================================================
// 13. INTERMODAL — ISO container on chassis
// ============================================================================

function drawIntermodal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isLight: boolean) {
  const margin = w * 0.08;
  const contW = w - margin * 2;
  const contH = h * 0.52;
  const contY = h * 0.16;
  const TEAL = "#14b8a6";

  // Container body
  const grad = ctx.createLinearGradient(margin, contY, margin + contW, contY + contH);
  grad.addColorStop(0, hexAlpha(TEAL, isLight ? 0.1 : 0.15));
  grad.addColorStop(1, hexAlpha(BLUE, isLight ? 0.08 : 0.12));
  ctx.fillStyle = grad;
  roundRect(ctx, margin, contY, contW, contH, 4);
  ctx.fill();

  // Container outline
  ctx.strokeStyle = hexAlpha(TEAL, isLight ? 0.35 : 0.5);
  ctx.lineWidth = 1.5;
  roundRect(ctx, margin, contY, contW, contH, 4);
  ctx.stroke();

  // Corrugation lines (vertical ribs typical of ISO containers)
  ctx.strokeStyle = hexAlpha(TEAL, 0.15);
  ctx.lineWidth = 0.5;
  const ribCount = 18;
  for (let i = 1; i < ribCount; i++) {
    const rx = margin + (contW / ribCount) * i;
    ctx.beginPath();
    ctx.moveTo(rx, contY + 3);
    ctx.lineTo(rx, contY + contH - 3);
    ctx.stroke();
  }

  // Door end (right side) — double doors
  const doorX = margin + contW - contW * 0.12;
  ctx.strokeStyle = hexAlpha(TEAL, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(doorX, contY + 4);
  ctx.lineTo(doorX, contY + contH - 4);
  ctx.stroke();
  // Door handles
  ctx.fillStyle = hexAlpha(TEAL, 0.4);
  ctx.fillRect(doorX + 4, contY + contH * 0.35, 3, 8);
  ctx.fillRect(doorX + 4, contY + contH * 0.55, 3, 8);

  // Corner castings (ISO standard)
  const castSize = 6;
  ctx.fillStyle = hexAlpha(TEAL, 0.3);
  [[margin + 2, contY + 2], [margin + contW - castSize - 2, contY + 2],
   [margin + 2, contY + contH - castSize - 2], [margin + contW - castSize - 2, contY + contH - castSize - 2]].forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, castSize, castSize);
  });

  // CSC plate
  ctx.fillStyle = hexAlpha(TEAL, 0.2);
  ctx.fillRect(margin + 12, contY + contH * 0.7, 22, 10);
  ctx.font = "bold 5px Inter, system-ui, sans-serif";
  ctx.fillStyle = hexAlpha(TEAL, 0.5);
  ctx.textAlign = "left";
  ctx.fillText("CSC", margin + 14, contY + contH * 0.7 + 7);

  // Container ID
  ctx.font = "bold 9px Inter, system-ui, sans-serif";
  ctx.fillStyle = hexAlpha(TEAL, 0.5);
  ctx.textAlign = "left";
  const flicker = Math.sin(t * 2) > 0.5 ? 0.6 : 0.45;
  ctx.fillStyle = hexAlpha(TEAL, flicker);
  ctx.fillText("EUSU", margin + 10, contY + 16);
  ctx.fillText("123456-7", margin + 10, contY + 27);

  // Chassis frame
  const chassisY = contY + contH + 3;
  ctx.strokeStyle = hexAlpha(isLight ? "#334155" : "#64748b", 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin + 10, chassisY);
  ctx.lineTo(margin + contW - 10, chassisY);
  ctx.stroke();

  // Twist locks
  ctx.fillStyle = hexAlpha(isLight ? "#334155" : "#94a3b8", 0.35);
  for (const tx of [0.12, 0.88]) {
    ctx.beginPath(); ctx.arc(margin + contW * tx, chassisY, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Wheels
  ctx.fillStyle = hexAlpha(isLight ? "#1e293b" : "#64748b", 0.45);
  for (const wx of [0.15, 0.28, 0.72, 0.85]) {
    ctx.beginPath(); ctx.arc(margin + contW * wx, chassisY + 7, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(TEAL, 0.5) : hexAlpha(TEAL, 0.55);
  ctx.textAlign = "center";
  ctx.fillText("INTERMODAL CONTAINER", w / 2, chassisY + 20);
}

// ============================================================================
// HELPER: Rounded Rectangle Path
// ============================================================================

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
