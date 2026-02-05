/**
 * LOAD VISUALIZATION COMPONENT
 * Animated vehicle graphics for all product types with physics-based
 * liquid sloshing animation on volume/quantity input.
 * 
 * Product types: Hazardous/Tanker, Refrigerated, Dry Bulk, Liquid Bulk,
 * Gas, Dry Van, Flatbed, Oversize
 * 
 * Each type has a unique vehicle SVG animation that responds to fill level.
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LoadVisualizationProps {
  productType: string;
  quantity: number;
  maxCapacity: number;
  unit?: string;
  hazmatClass?: string;
  productName?: string;
  trailerCount?: number;
  className?: string;
}

// Physics state for liquid sloshing
function useLiquidPhysics(fillPercent: number) {
  const [waveOffset, setWaveOffset] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const prevFillRef = useRef(fillPercent);
  const frameRef = useRef<number>(0);
  const dampingRef = useRef(0);

  useEffect(() => {
    const delta = Math.abs(fillPercent - prevFillRef.current);
    if (delta > 0.5) {
      dampingRef.current = Math.min(delta * 0.8, 15);
    }
    prevFillRef.current = fillPercent;
  }, [fillPercent]);

  useEffect(() => {
    let t = 0;
    const animate = () => {
      t += 0.06;
      if (dampingRef.current > 0.1) {
        dampingRef.current *= 0.96;
      } else {
        dampingRef.current = 0;
      }
      setWaveOffset(t);
      setAmplitude(dampingRef.current);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return { waveOffset, amplitude };
}

// Generate wave path for liquid surface
function generateWavePath(
  width: number,
  baseY: number,
  amplitude: number,
  offset: number,
  height: number
): string {
  const points: string[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const wave1 = Math.sin((i / steps) * Math.PI * 3 + offset) * amplitude;
    const wave2 = Math.sin((i / steps) * Math.PI * 5 + offset * 1.3) * amplitude * 0.4;
    const y = baseY + wave1 + wave2;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  points.push(`L ${width} ${height}`);
  points.push(`L 0 ${height}`);
  points.push("Z");
  return points.join(" ");
}

// Hazmat/Tanker visualization
function TankerViz({ fillPercent, quantity, unit, hazmatClass, waveOffset, amplitude }: {
  fillPercent: number; quantity: number; unit: string; hazmatClass?: string;
  waveOffset: number; amplitude: number;
}) {
  const tankW = 160, tankH = 160;
  const innerR = 62;
  const liquidBaseY = tankH / 2 + innerR - (fillPercent / 100) * (innerR * 2);
  const clipId = "tanker-clip-" + Math.random().toString(36).substring(7);

  return (
    <svg viewBox={`0 0 ${tankW} ${tankH + 40}`} className="w-full h-full">
      <defs>
        <linearGradient id="tankerLiquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BE01FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7B3AFF" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="tankerShell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx={tankW / 2} cy={tankH / 2} r={innerR} />
        </clipPath>
        <filter id="tankerGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Tank dome */}
      <path d={`M ${tankW / 2 - 12} ${tankH / 2 - innerR - 4} Q ${tankW / 2} ${tankH / 2 - innerR - 18} ${tankW / 2 + 12} ${tankH / 2 - innerR - 4}`}
        fill="#6B7280" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x={tankW / 2 - 4} y={tankH / 2 - innerR - 22} width="8" height="8" rx="2" fill="#9CA3AF" />

      {/* Tank shell */}
      <circle cx={tankW / 2} cy={tankH / 2} r={innerR + 6} fill="url(#tankerShell)" stroke="#6B7280" strokeWidth="2" />
      <circle cx={tankW / 2} cy={tankH / 2} r={innerR + 1} fill="#1E293B" stroke="#374151" strokeWidth="1" />

      {/* Liquid with wave physics */}
      <g clipPath={`url(#${clipId})`}>
        <path
          d={generateWavePath(tankW, liquidBaseY, amplitude + 1.5, waveOffset, tankH)}
          fill="url(#tankerLiquid)"
        />
        <path
          d={generateWavePath(tankW, liquidBaseY + 3, amplitude * 0.6 + 1, waveOffset * 0.8 + 1, tankH)}
          fill="#BE01FF" fillOpacity="0.3"
        />
      </g>

      {/* Quantity text */}
      <text x={tankW / 2} y={tankH / 2 + 2} textAnchor="middle" dominantBaseline="middle"
        className="font-bold" fill="white" fontSize="20" filter="url(#tankerGlow)">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={tankW / 2} y={tankH / 2 + 18} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11">
        {unit}
      </text>

      {/* Side brackets */}
      <rect x={tankW / 2 - innerR - 16} y={tankH / 2 - 12} width="10" height="24" rx="3" fill="#6B7280" />
      <rect x={tankW / 2 + innerR + 6} y={tankH / 2 - 12} width="10" height="24" rx="3" fill="#6B7280" />

      {/* Hazmat badge */}
      {hazmatClass && (
        <g transform={`translate(${tankW / 2 - 30}, ${tankH / 2 + innerR + 12})`}>
          <rect width="60" height="20" rx="10" fill="#EF4444" fillOpacity="0.8" />
          <text x="30" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
            Hazardous
          </text>
        </g>
      )}

      {/* Trailer wheels */}
      <g transform={`translate(0, ${tankH / 2 + innerR + 34})`}>
        {[tankW / 2 - 30, tankW / 2 - 10, tankW / 2 + 10, tankW / 2 + 30].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="0" r="7" fill="#374151" stroke="#6B7280" strokeWidth="1.5" />
            <circle cx={x} cy="0" r="3" fill="#6B7280" />
          </g>
        ))}
        <text x={tankW / 2} y="18" textAnchor="middle" fill="#9CA3AF" fontSize="10">Trailer-1</text>
      </g>
    </svg>
  );
}

// Reefer (Refrigerated) visualization
function ReeferViz({ fillPercent, quantity, unit, waveOffset }: {
  fillPercent: number; quantity: number; unit: string; waveOffset: number;
}) {
  const w = 180, h = 130;
  const fillH = (fillPercent / 100) * 80;
  const snowflakes = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    x: 30 + Math.random() * 120,
    y: 15 + Math.random() * 60,
    size: 2 + Math.random() * 3,
    speed: 0.5 + Math.random() * 1,
  })), []);

  return (
    <svg viewBox={`0 0 ${w} ${h + 50}`} className="w-full h-full">
      <defs>
        <linearGradient id="reeferFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0891B2" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Reefer unit on top */}
      <rect x="60" y="2" width="60" height="14" rx="4" fill="#374151" stroke="#6B7280" strokeWidth="1" />
      <rect x="72" y="5" width="8" height="8" rx="1" fill="#06B6D4" fillOpacity="0.5" />
      <rect x="100" y="5" width="8" height="8" rx="1" fill="#06B6D4" fillOpacity="0.5" />
      {/* Vent lines */}
      {[82, 86, 90, 94].map(x => (
        <line key={x} x1={x} y1="5" x2={x} y2="13" stroke="#6B7280" strokeWidth="0.5" />
      ))}

      {/* Box body */}
      <rect x="20" y="18" width="140" height="90" rx="6" fill="#1E293B" stroke="#4B5563" strokeWidth="2" />

      {/* Frost effect inside */}
      <rect x="22" y="20" width="136" height="86" rx="4" fill="#0F172A" />

      {/* Fill level */}
      <rect x="24" y={22 + (84 - fillH)} width="132" height={fillH} rx="2" fill="url(#reeferFill)" />

      {/* Animated snowflakes */}
      {snowflakes.map((sf, i) => (
        <circle key={i}
          cx={sf.x}
          cy={sf.y + Math.sin(waveOffset * sf.speed + i) * 8}
          r={sf.size}
          fill="white"
          fillOpacity={0.15 + Math.sin(waveOffset + i) * 0.1}
        />
      ))}

      {/* Temperature indicator */}
      <rect x="132" y="25" width="22" height="40" rx="3" fill="#374151" stroke="#6B7280" strokeWidth="0.5" />
      <rect x="135" y="40" width="16" height="22" rx="2" fill="#06B6D4" fillOpacity="0.4" />
      <text x="143" y="35" textAnchor="middle" fill="#06B6D4" fontSize="7" fontWeight="bold">-20°F</text>

      {/* Quantity */}
      <text x={w / 2} y="68" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={w / 2} y="82" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">{unit}</text>

      {/* Badge */}
      <g transform={`translate(${w / 2 - 32}, 112)`}>
        <rect width="64" height="18" rx="9" fill="#06B6D4" fillOpacity="0.3" />
        <text x="32" y="13" textAnchor="middle" fill="#06B6D4" fontSize="9" fontWeight="bold">Refrigerated</text>
      </g>

      {/* Wheels */}
      <g transform="translate(0, 128)">
        {[50, 70, 110, 130].map((x, i) => (
          <g key={i}><circle cx={x} cy="0" r="6" fill="#374151" stroke="#6B7280" strokeWidth="1.5" /><circle cx={x} cy="0" r="2.5" fill="#6B7280" /></g>
        ))}
        <text x={w / 2} y="16" textAnchor="middle" fill="#9CA3AF" fontSize="9">Trailer-1</text>
      </g>
    </svg>
  );
}

// Dry Bulk (hopper) visualization
function DryBulkViz({ fillPercent, quantity, unit, waveOffset }: {
  fillPercent: number; quantity: number; unit: string; waveOffset: number;
}) {
  const w = 180, h = 120;
  const fillH = (fillPercent / 100) * 70;
  const grainParticles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: 40 + Math.random() * 100,
    y: 25 + Math.random() * 55,
    r: 1.5 + Math.random() * 2,
  })), []);

  return (
    <svg viewBox={`0 0 ${w} ${h + 50}`} className="w-full h-full">
      <defs>
        <linearGradient id="bulkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#92400E" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Hopper hatches on top */}
      {[55, 90, 125].map((x, i) => (
        <g key={i}>
          <rect x={x - 12} y="5" width="24" height="8" rx="3" fill="#4B5563" stroke="#6B7280" strokeWidth="1" />
          <rect x={x - 3} y="2" width="6" height="5" rx="1" fill="#6B7280" />
        </g>
      ))}

      {/* Hopper body - trapezoid shape */}
      <path d="M 25,16 L 155,16 L 145,85 L 130,100 L 50,100 L 35,85 Z" fill="#1E293B" stroke="#4B5563" strokeWidth="2" />

      {/* Fill level with grain texture */}
      <clipPath id="hopperClip">
        <path d="M 27,18 L 153,18 L 143,83 L 128,98 L 52,98 L 37,83 Z" />
      </clipPath>
      <g clipPath="url(#hopperClip)">
        <rect x="27" y={20 + (80 - fillH)} width="126" height={fillH + 10} fill="url(#bulkFill)" />
        {/* Grain texture particles */}
        {grainParticles.filter(p => p.y > (100 - fillPercent)).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y + Math.sin(waveOffset * 0.3 + i) * 1} r={p.r}
            fill="#B45309" fillOpacity="0.4" />
        ))}
        {/* Mound on top */}
        {fillPercent > 10 && (
          <ellipse cx={w / 2} cy={20 + (80 - fillH)} rx="55" ry="6"
            fill="#D97706" fillOpacity="0.5" />
        )}
      </g>

      {/* Quantity */}
      <text x={w / 2} y="60" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={w / 2} y="74" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">{unit}</text>

      {/* Badge */}
      <g transform={`translate(${w / 2 - 26}, ${h})`}>
        <rect width="52" height="18" rx="9" fill="#D97706" fillOpacity="0.3" />
        <text x="26" y="13" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="bold">Dry Bulk</text>
      </g>

      {/* Discharge chutes */}
      {[65, 90, 115].map((x, i) => (
        <path key={i} d={`M ${x - 4},100 L ${x + 4},100 L ${x + 2},112 L ${x - 2},112 Z`} fill="#4B5563" stroke="#6B7280" strokeWidth="0.5" />
      ))}

      {/* Wheels */}
      <g transform="translate(0, 125)">
        {[50, 70, 110, 130].map((x, i) => (
          <g key={i}><circle cx={x} cy="0" r="6" fill="#374151" stroke="#6B7280" strokeWidth="1.5" /><circle cx={x} cy="0" r="2.5" fill="#6B7280" /></g>
        ))}
        <text x={w / 2} y="16" textAnchor="middle" fill="#9CA3AF" fontSize="9">Trailer-1</text>
      </g>
    </svg>
  );
}

// Liquid Bulk (non-hazmat tanker) visualization
function LiquidBulkViz({ fillPercent, quantity, unit, waveOffset, amplitude }: {
  fillPercent: number; quantity: number; unit: string; waveOffset: number; amplitude: number;
}) {
  const w = 180, h = 100;
  const tankTop = 15, tankBot = 85, tankLeft = 20, tankRight = 160;
  const tankH = tankBot - tankTop;
  const liquidY = tankBot - (fillPercent / 100) * tankH;
  const clipId = "lbulk-clip-" + Math.random().toString(36).substring(7);

  return (
    <svg viewBox={`0 0 ${w} ${h + 50}`} className="w-full h-full">
      <defs>
        <linearGradient id="liquidBulkFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1473FF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={tankLeft + 2} y={tankTop + 2} width={tankRight - tankLeft - 4} height={tankH - 4} rx="20" />
        </clipPath>
      </defs>

      {/* Dome hatches */}
      {[60, 90, 120].map((x, i) => (
        <rect key={i} x={x - 5} y="6" width="10" height="8" rx="3" fill="#4B5563" stroke="#6B7280" strokeWidth="0.5" />
      ))}

      {/* Cylindrical tank body */}
      <rect x={tankLeft} y={tankTop} width={tankRight - tankLeft} height={tankH} rx="22" fill="#1E293B" stroke="#4B5563" strokeWidth="2" />

      {/* Liquid with sloshing */}
      <g clipPath={`url(#${clipId})`}>
        <path d={generateWavePath(w, liquidY, amplitude + 1.2, waveOffset, h)} fill="url(#liquidBulkFill)" />
        <path d={generateWavePath(w, liquidY + 2.5, amplitude * 0.5 + 0.8, waveOffset * 0.7 + 2, h)} fill="#1473FF" fillOpacity="0.2" />
      </g>

      {/* Quantity */}
      <text x={w / 2} y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={w / 2} y="69" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">{unit}</text>

      {/* Badge */}
      <g transform={`translate(${w / 2 - 32}, ${h})`}>
        <rect width="64" height="18" rx="9" fill="#1473FF" fillOpacity="0.3" />
        <text x="32" y="13" textAnchor="middle" fill="#60A5FA" fontSize="9" fontWeight="bold">Liquid Bulk</text>
      </g>

      {/* Wheels */}
      <g transform="translate(0, 120)">
        {[50, 70, 110, 130].map((x, i) => (
          <g key={i}><circle cx={x} cy="0" r="6" fill="#374151" stroke="#6B7280" strokeWidth="1.5" /><circle cx={x} cy="0" r="2.5" fill="#6B7280" /></g>
        ))}
        <text x={w / 2} y="16" textAnchor="middle" fill="#9CA3AF" fontSize="9">Trailer-1</text>
      </g>
    </svg>
  );
}

// Gas (pressurized cylinder tanker) visualization
function GasViz({ fillPercent, quantity, unit, waveOffset }: {
  fillPercent: number; quantity: number; unit: string; waveOffset: number;
}) {
  const w = 180, h = 110;
  const pressure = fillPercent;
  const pulseR = Math.sin(waveOffset * 2) * 2;

  return (
    <svg viewBox={`0 0 ${w} ${h + 50}`} className="w-full h-full">
      <defs>
        <radialGradient id="gasFill" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3 + fillPercent / 200} />
          <stop offset="100%" stopColor="#15803D" stopOpacity={0.1 + fillPercent / 300} />
        </radialGradient>
      </defs>

      {/* Pressure gauge on top */}
      <circle cx={w / 2} cy="12" r="10" fill="#374151" stroke="#6B7280" strokeWidth="1" />
      <text x={w / 2} y="15" textAnchor="middle" fill="#22C55E" fontSize="6" fontWeight="bold">{Math.round(pressure)}%</text>
      <line x1={w / 2} y1="22" x2={w / 2} y2="30" stroke="#6B7280" strokeWidth="2" />

      {/* Cylindrical pressure vessel */}
      <rect x="25" y="30" width="130" height="60" rx="30" fill="#1E293B" stroke="#4B5563" strokeWidth="2" />

      {/* Gas fill - glowing effect */}
      <rect x="27" y="32" width="126" height="56" rx="28" fill="url(#gasFill)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
      </rect>

      {/* Pressure rings */}
      {[55, 90, 125].map((x, i) => (
        <ellipse key={i} cx={x} cy="60" rx="2" ry={25 + pulseR}
          fill="none" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.3" />
      ))}

      {/* Quantity */}
      <text x={w / 2} y="63" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={w / 2} y="77" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">{unit}</text>

      {/* Valves */}
      <rect x="30" y="55" width="8" height="12" rx="2" fill="#374151" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.5" />
      <rect x="142" y="55" width="8" height="12" rx="2" fill="#374151" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.5" />

      {/* Badge */}
      <g transform={`translate(${w / 2 - 18}, ${h - 4})`}>
        <rect width="36" height="18" rx="9" fill="#22C55E" fillOpacity="0.2" />
        <text x="18" y="13" textAnchor="middle" fill="#22C55E" fontSize="9" fontWeight="bold">Gas</text>
      </g>

      {/* Wheels */}
      <g transform="translate(0, 125)">
        {[50, 70, 110, 130].map((x, i) => (
          <g key={i}><circle cx={x} cy="0" r="6" fill="#374151" stroke="#6B7280" strokeWidth="1.5" /><circle cx={x} cy="0" r="2.5" fill="#6B7280" /></g>
        ))}
        <text x={w / 2} y="16" textAnchor="middle" fill="#9CA3AF" fontSize="9">Trailer-1</text>
      </g>
    </svg>
  );
}

// Dry Van visualization
function DryVanViz({ fillPercent, quantity, unit, waveOffset }: {
  fillPercent: number; quantity: number; unit: string; waveOffset: number;
}) {
  const w = 180, h = 110;
  const fillW = (fillPercent / 100) * 126;
  const boxCount = Math.ceil(fillPercent / 15);

  return (
    <svg viewBox={`0 0 ${w} ${h + 50}`} className="w-full h-full">
      <defs>
        <linearGradient id="dryvanFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Box trailer body */}
      <rect x="22" y="15" width="136" height="80" rx="4" fill="#1E293B" stroke="#4B5563" strokeWidth="2" />

      {/* Corrugated walls */}
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={34 + i * 11} y1="17" x2={34 + i * 11} y2="93" stroke="#374151" strokeWidth="0.5" />
      ))}

      {/* Fill level (boxes stacking from left) */}
      <rect x="24" y="17" width={fillW} height="76" rx="2" fill="url(#dryvanFill)" />

      {/* Animated box icons inside */}
      {Array.from({ length: Math.min(boxCount, 8) }, (_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const bx = 32 + col * 30;
        const by = 30 + row * 28;
        const bob = Math.sin(waveOffset * 0.5 + i * 0.7) * 1;
        return (
          <g key={i} transform={`translate(${bx}, ${by + bob})`} opacity={fillPercent > i * 12 ? 0.7 : 0}>
            <rect width="22" height="20" rx="2" fill="#7C3AED" fillOpacity="0.3" stroke="#8B5CF6" strokeWidth="0.5" />
            <line x1="0" y1="10" x2="22" y2="10" stroke="#8B5CF6" strokeWidth="0.3" strokeOpacity="0.5" />
            <line x1="11" y1="0" x2="11" y2="10" stroke="#8B5CF6" strokeWidth="0.3" strokeOpacity="0.5" />
          </g>
        );
      })}

      {/* Rear doors */}
      <rect x="156" y="18" width="4" height="74" rx="1" fill="#374151" stroke="#6B7280" strokeWidth="0.5" />

      {/* Quantity */}
      <text x={w / 2} y="62" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={w / 2} y="76" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">{unit}</text>

      {/* Badge */}
      <g transform={`translate(${w / 2 - 24}, ${h - 2})`}>
        <rect width="48" height="18" rx="9" fill="#8B5CF6" fillOpacity="0.2" />
        <text x="24" y="13" textAnchor="middle" fill="#A78BFA" fontSize="9" fontWeight="bold">Dry Van</text>
      </g>

      {/* Wheels */}
      <g transform="translate(0, 128)">
        {[50, 70, 110, 130].map((x, i) => (
          <g key={i}><circle cx={x} cy="0" r="6" fill="#374151" stroke="#6B7280" strokeWidth="1.5" /><circle cx={x} cy="0" r="2.5" fill="#6B7280" /></g>
        ))}
        <text x={w / 2} y="16" textAnchor="middle" fill="#9CA3AF" fontSize="9">Trailer-1</text>
      </g>
    </svg>
  );
}

// Flatbed visualization
function FlatbedViz({ fillPercent, quantity, unit, waveOffset }: {
  fillPercent: number; quantity: number; unit: string; waveOffset: number;
}) {
  const w = 180, h = 80;
  const itemCount = Math.ceil(fillPercent / 20);

  return (
    <svg viewBox={`0 0 ${w} ${h + 70}`} className="w-full h-full">
      {/* Flatbed deck */}
      <rect x="18" y="50" width="144" height="6" rx="2" fill="#374151" stroke="#6B7280" strokeWidth="1.5" />
      {/* I-beam understructure */}
      <rect x="25" y="56" width="130" height="4" fill="#1E293B" stroke="#4B5563" strokeWidth="0.5" />

      {/* Cargo items (steel coils, beams, equipment) */}
      {Array.from({ length: Math.min(itemCount, 5) }, (_, i) => {
        const cx = 35 + i * 28;
        const bob = Math.sin(waveOffset * 0.4 + i) * 1.5;
        return (
          <g key={i} transform={`translate(${cx}, ${30 + bob})`} opacity={fillPercent > i * 18 ? 0.8 : 0}>
            {/* Steel coil shape */}
            <ellipse cx="10" cy="10" rx="10" ry="12" fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1" />
            <ellipse cx="10" cy="10" rx="5" ry="7" fill="#1E293B" stroke="#D97706" strokeWidth="0.5" />
          </g>
        );
      })}

      {/* Tie-down straps */}
      {[40, 70, 100, 130].map((x, i) => (
        <line key={i} x1={x} y1="18" x2={x} y2="50" stroke="#EF4444" strokeWidth="0.8" strokeDasharray="2 2" opacity={fillPercent > 20 ? 0.5 : 0} />
      ))}

      {/* Quantity */}
      <text x={w / 2} y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {quantity > 0 ? quantity.toLocaleString() : "0"}
      </text>
      <text x={w / 2} y="39" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">{unit}</text>

      {/* Badge */}
      <g transform={`translate(${w / 2 - 22}, 68)`}>
        <rect width="44" height="18" rx="9" fill="#F59E0B" fillOpacity="0.2" />
        <text x="22" y="13" textAnchor="middle" fill="#FBBF24" fontSize="9" fontWeight="bold">Flatbed</text>
      </g>

      {/* Wheels */}
      <g transform="translate(0, 98)">
        {[50, 70, 110, 130].map((x, i) => (
          <g key={i}><circle cx={x} cy="0" r="6" fill="#374151" stroke="#6B7280" strokeWidth="1.5" /><circle cx={x} cy="0" r="2.5" fill="#6B7280" /></g>
        ))}
        <text x={w / 2} y="16" textAnchor="middle" fill="#9CA3AF" fontSize="9">Trailer-1</text>
      </g>
    </svg>
  );
}

// Map product type string to visualization type
function getVizType(productType: string): string {
  const t = productType.toLowerCase();
  if (t.includes("hazmat") || t.includes("hazardous") || t.includes("tanker") || t.includes("crude") || t.includes("flammable")) return "tanker";
  if (t.includes("reefer") || t.includes("refrigerat") || t.includes("frozen") || t.includes("cold")) return "reefer";
  if (t.includes("dry bulk") || t.includes("grain") || t.includes("sand") || t.includes("cement") || t.includes("hopper")) return "dry_bulk";
  if (t.includes("liquid") || t.includes("water") || t.includes("chemical") || t.includes("milk")) return "liquid_bulk";
  if (t.includes("gas") || t.includes("lpg") || t.includes("propane") || t.includes("compressed") || t.includes("cng") || t.includes("lng")) return "gas";
  if (t.includes("flatbed") || t.includes("steel") || t.includes("lumber") || t.includes("oversize") || t.includes("machinery")) return "flatbed";
  return "dry_van";
}

export default function LoadVisualization({
  productType,
  quantity,
  maxCapacity,
  unit = "gal",
  hazmatClass,
  productName,
  trailerCount = 1,
  className,
}: LoadVisualizationProps) {
  const fillPercent = maxCapacity > 0 ? Math.min((quantity / maxCapacity) * 100, 100) : 0;
  const vizType = getVizType(productType);
  const { waveOffset, amplitude } = useLiquidPhysics(fillPercent);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="text-slate-400 text-sm font-medium mb-2">Load Visualization</div>
      <div className="w-48 h-48 flex items-center justify-center">
        {vizType === "tanker" && (
          <TankerViz fillPercent={fillPercent} quantity={quantity} unit={unit}
            hazmatClass={hazmatClass} waveOffset={waveOffset} amplitude={amplitude} />
        )}
        {vizType === "reefer" && (
          <ReeferViz fillPercent={fillPercent} quantity={quantity} unit={unit} waveOffset={waveOffset} />
        )}
        {vizType === "dry_bulk" && (
          <DryBulkViz fillPercent={fillPercent} quantity={quantity} unit={unit} waveOffset={waveOffset} />
        )}
        {vizType === "liquid_bulk" && (
          <LiquidBulkViz fillPercent={fillPercent} quantity={quantity} unit={unit}
            waveOffset={waveOffset} amplitude={amplitude} />
        )}
        {vizType === "gas" && (
          <GasViz fillPercent={fillPercent} quantity={quantity} unit={unit} waveOffset={waveOffset} />
        )}
        {vizType === "dry_van" && (
          <DryVanViz fillPercent={fillPercent} quantity={quantity} unit={unit} waveOffset={waveOffset} />
        )}
        {vizType === "flatbed" && (
          <FlatbedViz fillPercent={fillPercent} quantity={quantity} unit={unit} waveOffset={waveOffset} />
        )}
      </div>
    </div>
  );
}
