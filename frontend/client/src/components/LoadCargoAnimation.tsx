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

// Brand gradient colors
const BLUE = "#1473FF";
const PURPLE = "#BE01FF";
const VIOLET = "#8B5CF6";

interface LoadCargoAnimationProps {
  equipmentType?: string | null;
  cargoType?: string | null;
  compartments?: number;
  className?: string;
  height?: number;
  isLight?: boolean;
}

export default function LoadCargoAnimation({
  equipmentType,
  cargoType,
  compartments = 1,
  className = "",
  height = 120,
  isLight = false,
}: LoadCargoAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<any[]>([]);
  const initializedRef = useRef(false);

  const getAnimationType = useCallback(() => {
    const et = (equipmentType || "").toLowerCase();
    const ct = (cargoType || "").toLowerCase();

    if (et.includes("liquid") || et === "tank" || ct === "petroleum" || ct === "chemicals") return "liquid";
    if (et.includes("gas") || et === "tanker" || ct === "gas" || ct === "lpg" || ct === "lng") return "gas";
    if (et === "flatbed") return "flatbed";
    if (et === "reefer" || ct === "refrigerated" || ct === "frozen") return "reefer";
    if (et.includes("dry") || et === "dry-van" || et === "dry_van") return "dryvan";
    if (et === "hopper" || ct === "grain" || ct === "cement" || ct === "sand") return "hopper";
    if (et === "cryogenic") return "cryogenic";
    return "default";
  }, [equipmentType, cargoType]);

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
  const { margin, tankW, tankH, tankY, radius } = drawTankOutline(ctx, w, h, isLight);

  // Tank body
  ctx.save();
  ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.3) : hexAlpha(BLUE, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Clip to tank shape
  ctx.clip();

  // Fill level (65-80% full with gentle oscillation)
  const fillLevel = 0.72 + Math.sin(t * 0.5) * 0.04;
  const liquidTop = tankY + tankH * (1 - fillLevel);

  // Draw sloshing liquid waves
  const grad = createBrandGradient(ctx, margin, liquidTop, margin, tankY + tankH, 0.6);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(margin - 5, tankY + tankH + 5);

  // Multiple wave layers for realistic sloshing
  for (let x = margin - 5; x <= margin + tankW + 5; x += 2) {
    const nx = (x - margin) / tankW;
    const wave1 = Math.sin(nx * Math.PI * 3 + t * 2.5) * 4;
    const wave2 = Math.sin(nx * Math.PI * 5 - t * 1.8) * 2;
    const wave3 = Math.sin(nx * Math.PI * 7 + t * 3.2) * 1.5;
    const y = liquidTop + wave1 + wave2 + wave3;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(margin + tankW + 5, tankY + tankH + 5);
  ctx.closePath();
  ctx.fill();

  // Highlight wave on top for glossy effect
  const highlightGrad = createBrandGradient(ctx, margin, liquidTop - 3, margin + tankW, liquidTop + 5, 0.35);
  ctx.strokeStyle = highlightGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = margin; x <= margin + tankW; x += 2) {
    const nx = (x - margin) / tankW;
    const wave = Math.sin(nx * Math.PI * 3 + t * 2.5) * 4 + Math.sin(nx * Math.PI * 5 - t * 1.8) * 2;
    const y = liquidTop + wave;
    if (x === margin) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Compartment dividers
  if (compartments > 1) {
    ctx.strokeStyle = isLight ? hexAlpha(BLUE, 0.25) : hexAlpha(PURPLE, 0.3);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < compartments; i++) {
      const divX = margin + (tankW / compartments) * i;
      ctx.beginPath();
      ctx.moveTo(divX, tankY);
      ctx.lineTo(divX, tankY + tankH);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  ctx.restore();

  // Tank label
  ctx.font = "bold 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = isLight ? hexAlpha(BLUE, 0.5) : hexAlpha(BLUE, 0.6);
  ctx.textAlign = "center";
  ctx.fillText(compartments > 1 ? `${compartments}-COMP TANKER` : "LIQUID TANKER", w / 2, tankY + tankH + 18);

  // Subtle reflection dots on surface
  for (let i = 0; i < 5; i++) {
    const rx = margin + 20 + i * (tankW / 5);
    const ry = liquidTop + Math.sin(t * 2 + i) * 3;
    ctx.beginPath();
    ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha("#ffffff", 0.3 + Math.sin(t * 3 + i * 2) * 0.15);
    ctx.fill();
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
// 8. DEFAULT — gradient cargo boxes
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
