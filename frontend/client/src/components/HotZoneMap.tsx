import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ZoomIn, ZoomOut, Maximize2, Crosshair, Layers,
  TrendingUp, Truck, Flame, X, Navigation, MapPin,
} from "lucide-react";

interface HotZoneMapProps {
  zones: any[];
  coldZones: any[];
  roleCtx: any;
  selectedZone: string | null;
  onSelectZone: (id: string | null) => void;
  isLight: boolean;
  activeLayers: string[];
}

// Projection: lng/lat → SVG coordinates aligned with state outline paths
function proj(lng: number, lat: number): [number, number] {
  const x = ((lng + 124.5) / 57.6) * 656 + 72;
  const y = ((49 - lat) / 24.5) * 296 + 2;
  return [x, y];
}

// ── ROLE-ADAPTIVE VISUAL CONFIG ──
// Each role sees the map differently: different colors, sizing, primary metric, emphasis
interface RoleViz {
  dotLabel: (z: any) => string;       // what shows inside the dot
  sizeMetric: (z: any) => number;     // what drives dot size
  critColor: string; highColor: string; elevColor: string;
  glowColor: string;                  // dominant glow tint
  subtitle: string;                   // map subtitle
  emphasis: string;                   // what aspect matters most
}

function getRoleViz(perspective: string | undefined): RoleViz {
  // sizeMetric MUST return values in 6-14 range (clamped downstream)
  switch (perspective) {
    case "carrier_availability": // SHIPPER — sees truck availability, green tones
      return {
        dotLabel: z => `${z.liveTrucks || 0}T`,
        sizeMetric: z => 7 + Math.min(7, (z.liveTrucks || 80) / 60),
        critColor: "#4ADE80", highColor: "#60A5FA", elevColor: "#C084FC",
        glowColor: "#4ADE80",
        subtitle: "Where carriers are available for your loads",
        emphasis: "carrier_count",
      };
    case "spread_opportunity": // BROKER — sees margin, emerald tones
      return {
        dotLabel: z => `+${((z.liveRate || 2) * (z.liveRatio || 1) * 0.15).toFixed(1)}`,
        sizeMetric: z => 7 + Math.min(7, ((z.liveRate || 2) * (z.liveRatio || 1) * 0.15) * 2),
        critColor: "#34D399", highColor: "#FBBF24", elevColor: "#818CF8",
        glowColor: "#34D399",
        subtitle: "Best arbitrage & margin zones",
        emphasis: "margin",
      };
    case "driver_opportunity": // DRIVER — sees earnings, amber/orange tones
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(1)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRate || 2) * 1.8),
        critColor: "#FBBF24", highColor: "#FB923C", elevColor: "#60A5FA",
        glowColor: "#FBBF24",
        subtitle: "Best loads and earning opportunities near you",
        emphasis: "earnings",
      };
    case "oversized_demand": // ESCORT — sees oversized corridors, purple tones
      return {
        dotLabel: z => z.oversizedFrequency === "VERY_HIGH" ? "OVS!" : z.oversizedFrequency === "HIGH" ? "OVS" : `$${Number(z.liveRate || 0).toFixed(1)}`,
        sizeMetric: z => z.oversizedFrequency === "VERY_HIGH" ? 14 : z.oversizedFrequency === "HIGH" ? 11 : 8,
        critColor: "#A78BFA", highColor: "#818CF8", elevColor: "#C4B5FD",
        glowColor: "#A78BFA",
        subtitle: "Oversized/overweight escort demand corridors",
        emphasis: "oversized",
      };
    case "dispatch_intelligence": // CATALYST — sees L:T ratio, red/orange tones
      return {
        dotLabel: z => `${z.liveLoads || 0}/${z.liveTrucks || 0}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRatio || 1) * 2.5),
        critColor: "#F87171", highColor: "#FB923C", elevColor: "#22D3EE",
        glowColor: "#FB923C",
        subtitle: "Fleet positions + demand for optimal dispatch",
        emphasis: "ratio",
      };
    case "facility_throughput": // TERMINAL_MANAGER — sees volume, cyan tones
      return {
        dotLabel: z => `${z.liveLoads || 0}L`,
        sizeMetric: z => 7 + Math.min(7, (z.liveLoads || 100) / 100),
        critColor: "#22D3EE", highColor: "#60A5FA", elevColor: "#A78BFA",
        glowColor: "#22D3EE",
        subtitle: "Freight throughput near your facilities",
        emphasis: "volume",
      };
    case "invoice_intelligence": // FACTORING — sees invoice volume, orange tones
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(1)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveLoads || 100) / 80),
        critColor: "#FB923C", highColor: "#FBBF24", elevColor: "#4ADE80",
        glowColor: "#FB923C",
        subtitle: "Invoice volume & credit risk by geography",
        emphasis: "invoice_volume",
      };
    case "compliance_risk": // COMPLIANCE_OFFICER — sees risk scores, red tones
      return {
        dotLabel: z => { const sc = z.complianceRiskScore ?? Math.round(((z.weatherAlerts?.length || 0) * 20) + ((z.hazmatClasses?.length || 0) * 15)); return `R${sc}`; },
        sizeMetric: z => 7 + Math.min(7, (z.complianceRiskScore ?? 30) / 15),
        critColor: "#F87171", highColor: "#FBBF24", elevColor: "#4ADE80",
        glowColor: "#F87171",
        subtitle: "Regulatory compliance risk zones",
        emphasis: "compliance",
      };
    case "safety_risk": // SAFETY_MANAGER — sees safety scores, red/cyan tones
      return {
        dotLabel: z => { const ss = Math.max(0, 100 - Math.round(((z.weatherAlerts?.length || 0) * 15) + ((z.hazmatClasses?.length || 0) * 10))); return `S${ss}`; },
        sizeMetric: z => 7 + Math.min(7, ((z.hazmatClasses?.length || 0) + (z.weatherAlerts?.length || 0)) * 1.5),
        critColor: "#F87171", highColor: "#FBBF24", elevColor: "#22D3EE",
        glowColor: "#F87171",
        subtitle: "Safety risk zones & incident hotspots",
        emphasis: "safety",
      };
    case "platform_health": // ADMIN
    case "executive_intelligence": // SUPER_ADMIN
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRatio || 1) * 2.5),
        critColor: "#F87171", highColor: "#FB923C", elevColor: "#FBBF24",
        glowColor: "#1473FF",
        subtitle: "Platform-wide operational intelligence",
        emphasis: "overview",
      };
    default: // CARRIER / default freight view
      return {
        dotLabel: z => `$${Number(z.liveRate || 0).toFixed(2)}`,
        sizeMetric: z => 7 + Math.min(7, (z.liveRatio || 1) * 2.5),
        critColor: "#F87171", highColor: "#FB923C", elevColor: "#FBBF24",
        glowColor: "#EF4444",
        subtitle: "Where freight demand is highest",
        emphasis: "demand",
      };
  }
}

// ── US STATE OUTLINES (simplified SVG paths for contiguous 48) ──
const STATES: { id: string; d: string }[] = [
  { id:"WA", d:"M108,22L152,28L156,58L118,56L105,42Z" },
  { id:"OR", d:"M105,42L118,56L156,58L154,92L100,88L95,55Z" },
  { id:"CA", d:"M95,55L100,88L108,132L122,180L100,192L78,164L72,115L82,68Z" },
  { id:"NV", d:"M118,56L156,58L152,92L142,132L108,132L100,88Z" },
  { id:"ID", d:"M156,24L182,22L188,58L174,88L152,92L156,58Z" },
  { id:"MT", d:"M182,22L282,16L286,56L188,58Z" },
  { id:"WY", d:"M188,58L286,56L286,98L188,98Z" },
  { id:"UT", d:"M152,92L188,98L188,142L142,132Z" },
  { id:"CO", d:"M188,98L286,98L286,142L188,142Z" },
  { id:"AZ", d:"M108,132L142,132L152,192L100,192Z" },
  { id:"NM", d:"M142,132L188,142L198,202L152,192Z" },
  { id:"ND", d:"M282,16L368,14L368,48L286,48Z" },
  { id:"SD", d:"M286,48L368,48L368,78L286,78Z" },
  { id:"NE", d:"M286,78L368,78L378,106L286,98Z" },
  { id:"KS", d:"M286,106L378,106L378,138L286,138Z" },
  { id:"OK", d:"M286,138L378,138L388,168L262,168L262,152L286,142Z" },
  { id:"TX", d:"M198,202L262,168L388,168L398,202L388,248L342,268L282,258L232,232Z" },
  { id:"MN", d:"M368,14L438,18L442,68L368,62Z" },
  { id:"IA", d:"M368,62L442,68L446,100L378,96Z" },
  { id:"MO", d:"M378,96L446,100L456,142L388,138Z" },
  { id:"AR", d:"M388,138L456,142L462,178L392,172Z" },
  { id:"LA", d:"M392,172L462,178L468,218L428,228L398,208Z" },
  { id:"WI", d:"M438,18L498,22L494,68L442,68Z" },
  { id:"IL", d:"M456,68L494,68L498,132L456,142Z" },
  { id:"MS", d:"M462,142L498,142L502,202L468,218Z" },
  { id:"MI", d:"M492,18L538,14L542,72L494,68Z" },
  { id:"IN", d:"M498,68L534,68L538,124L498,132Z" },
  { id:"OH", d:"M538,58L582,54L588,106L538,114Z" },
  { id:"KY", d:"M498,114L588,106L602,134L494,142Z" },
  { id:"TN", d:"M494,142L602,134L612,158L486,162Z" },
  { id:"AL", d:"M494,162L534,158L538,212L498,218Z" },
  { id:"GA", d:"M538,158L592,152L602,212L538,218Z" },
  { id:"FL", d:"M538,218L602,212L622,232L642,282L602,298L564,262L542,232Z" },
  { id:"SC", d:"M592,148L632,138L642,168L602,174Z" },
  { id:"NC", d:"M592,124L672,114L682,142L632,148L592,148Z" },
  { id:"VA", d:"M588,98L672,88L682,118L602,126Z" },
  { id:"WV", d:"M588,84L622,78L622,108L588,106Z" },
  { id:"PA", d:"M582,54L662,46L668,76L588,82Z" },
  { id:"NY", d:"M592,22L672,18L678,48L662,46L582,54L588,28Z" },
  { id:"VT", d:"M662,12L682,10L684,34L668,34Z" },
  { id:"NH", d:"M682,10L698,8L700,36L684,34Z" },
  { id:"ME", d:"M698,2L722,2L728,34L700,36L698,8Z" },
  { id:"MA", d:"M678,36L712,34L714,46L680,48Z" },
  { id:"CT", d:"M680,48L702,46L704,58L682,60Z" },
  { id:"NJ", d:"M668,52L682,50L688,76L672,74Z" },
  { id:"DE", d:"M672,74L684,72L686,88L674,86Z" },
  { id:"MD", d:"M622,78L672,74L674,92L628,96Z" },
];

// ── INTERSTATE HIGHWAYS ──
const HWY: { id: string; d: string }[] = [
  { id:"I-10", d:"M82,178 L152,192 L232,202 L342,192 L398,178 L462,178 L538,218 L602,212" },
  { id:"I-20", d:"M232,202 L286,188 L388,178 L456,168 L534,168 L602,168" },
  { id:"I-40", d:"M82,138 L142,142 L198,148 L286,142 L378,142 L456,148 L498,148 L602,148" },
  { id:"I-70", d:"M152,100 L188,100 L286,100 L378,100 L446,100 L498,96 L588,88" },
  { id:"I-80", d:"M82,72 L156,68 L188,68 L286,68 L368,68 L442,68 L498,62 L582,54 L662,48" },
  { id:"I-90", d:"M105,42 L188,38 L286,38 L368,38 L438,38 L498,38 L542,34 L592,28 L672,22" },
  { id:"I-95", d:"M602,298 L602,212 L602,168 L632,148 L672,114 L672,88 L668,76 L672,48 L678,34 L698,18" },
  { id:"I-35", d:"M348,258 L358,202 L368,168 L372,138 L368,106 L368,78 L368,48 L368,18" },
  { id:"I-65", d:"M498,218 L498,168 L498,142 L498,114 L494,68 L488,28" },
  { id:"I-75", d:"M602,292 L602,212 L538,168 L538,124 L542,72 L528,22" },
];

// ── MAJOR CITIES ──
const CITIES: { n: string; lat: number; lng: number }[] = [
  { n:"Los Angeles", lat:34.05, lng:-118.24 },
  { n:"Chicago", lat:41.88, lng:-87.63 },
  { n:"Houston", lat:29.76, lng:-95.37 },
  { n:"Dallas", lat:32.78, lng:-96.80 },
  { n:"Atlanta", lat:33.75, lng:-84.39 },
  { n:"New York", lat:40.71, lng:-74.01 },
  { n:"Miami", lat:25.76, lng:-80.19 },
  { n:"Denver", lat:39.74, lng:-104.99 },
  { n:"Phoenix", lat:33.45, lng:-112.07 },
  { n:"Seattle", lat:47.61, lng:-122.33 },
  { n:"Memphis", lat:35.15, lng:-90.05 },
  { n:"Kansas City", lat:39.10, lng:-94.58 },
  { n:"Nashville", lat:36.16, lng:-86.78 },
  { n:"Indianapolis", lat:39.77, lng:-86.16 },
  { n:"Detroit", lat:42.33, lng:-83.05 },
  { n:"Minneapolis", lat:44.98, lng:-93.27 },
  { n:"St. Louis", lat:38.63, lng:-90.20 },
  { n:"Charlotte", lat:35.23, lng:-80.84 },
  { n:"Jacksonville", lat:30.33, lng:-81.66 },
  { n:"San Antonio", lat:29.42, lng:-98.49 },
  { n:"El Paso", lat:31.76, lng:-106.44 },
  { n:"Laredo", lat:27.51, lng:-99.51 },
  { n:"New Orleans", lat:29.95, lng:-90.07 },
  { n:"Oklahoma City", lat:35.47, lng:-97.52 },
  { n:"Portland", lat:45.52, lng:-122.68 },
  { n:"Salt Lake City", lat:40.76, lng:-111.89 },
  { n:"Albuquerque", lat:35.08, lng:-106.65 },
  { n:"Omaha", lat:41.26, lng:-95.94 },
  { n:"Louisville", lat:38.25, lng:-85.76 },
  { n:"Pittsburgh", lat:40.44, lng:-79.99 },
  { n:"Columbus", lat:39.96, lng:-82.99 },
  { n:"Richmond", lat:37.54, lng:-77.44 },
  { n:"Savannah", lat:32.08, lng:-81.09 },
];

export default function HotZoneMap({ zones, coldZones, roleCtx, selectedZone, onSelectZone, isLight, activeLayers }: HotZoneMapProps) {
  const cRef = useRef<HTMLDivElement>(null);
  const [vb, setVb] = useState({ x: 0, y: 0, w: 800, h: 380 });
  const [panning, setPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ mx: 0, my: 0, vx: 0, vy: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<{ px: number; py: number; z: any } | null>(null);
  const [showHwy, setShowHwy] = useState(true);
  const [showCities, setShowCities] = useState(true);

  const zoomPct = useMemo(() => Math.round((800 / vb.w) * 100), [vb.w]);
  const detail = vb.w <= 250 ? "hi" : vb.w <= 450 ? "med" : "lo";
  const rv = useMemo(() => getRoleViz(roleCtx?.perspective), [roleCtx?.perspective]);

  // clamp helper
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  // ── ZOOM ──
  const doZoom = useCallback((factor: number, cx?: number, cy?: number) => {
    setVb(p => {
      const pcx = cx ?? p.x + p.w / 2;
      const pcy = cy ?? p.y + p.h / 2;
      const nw = clamp(p.w / factor, 80, 800);
      const nh = nw * (380 / 800);
      return { x: clamp(pcx - nw / 2, -60, 860 - nw), y: clamp(pcy - nh / 2, -30, 410 - nh), w: nw, h: nh };
    });
  }, []);

  const resetView = useCallback(() => setVb({ x: 0, y: 0, w: 800, h: 380 }), []);

  const zoomToZone = useCallback((zone: any) => {
    const [zx, zy] = proj(zone.center?.lng || -95, zone.center?.lat || 38);
    const nw = 250, nh = nw * (380 / 800);
    setVb({ x: clamp(zx - nw / 2, -60, 640), y: clamp(zy - nh / 2, -30, 310), w: nw, h: nh });
    onSelectZone(zone.zoneId);
  }, [onSelectZone]);

  // ── WHEEL ZOOM ──
  useEffect(() => {
    const el = cRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * vb.w + vb.x;
      const my = ((e.clientY - r.top) / r.height) * vb.h + vb.y;
      doZoom(e.deltaY < 0 ? 1.12 : 0.89, mx, my);
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [vb, doZoom]);

  // ── TOUCH PINCH ZOOM ──
  const lastPinchDist = useRef<number | null>(null);
  useEffect(() => {
    const el = cRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist.current !== null) {
          const factor = dist / lastPinchDist.current;
          doZoom(factor);
        }
        lastPinchDist.current = dist;
      }
    };
    const onTouchEnd = () => { lastPinchDist.current = null; };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => { el.removeEventListener("touchmove", onTouchMove); el.removeEventListener("touchend", onTouchEnd); };
  }, [doZoom]);

  // ── PAN ──
  const onPD = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    setPanOrigin({ mx: e.clientX, my: e.clientY, vx: vb.x, vy: vb.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [vb.x, vb.y]);

  const onPM = useCallback((e: React.PointerEvent) => {
    if (!panning || !cRef.current) return;
    const r = cRef.current.getBoundingClientRect();
    const dx = ((e.clientX - panOrigin.mx) / r.width) * vb.w;
    const dy = ((e.clientY - panOrigin.my) / r.height) * vb.h;
    setVb(p => ({ ...p, x: clamp(panOrigin.vx - dx, -100, 900), y: clamp(panOrigin.vy - dy, -50, 430) }));
  }, [panning, panOrigin, vb.w, vb.h]);

  const onPU = useCallback(() => setPanning(false), []);

  // ── TOOLTIP ──
  const showTip = useCallback((e: React.MouseEvent, z: any) => {
    if (!cRef.current) return;
    const r = cRef.current.getBoundingClientRect();
    setTip({ px: e.clientX - r.left, py: e.clientY - r.top - 12, z });
    setHovered(z.zoneId);
  }, []);

  // scale helper for zoom-dependent sizes
  const s = useCallback((base: number) => Math.max(base * 0.4, base * (800 / vb.w) * 0.5), [vb.w]);

  return (
    <div className="relative" style={{ height: 440 }}>
      {/* ── SVG MAP CONTAINER ── */}
      <div
        ref={cRef}
        className={`relative w-full h-full rounded-2xl border overflow-hidden select-none ${panning ? "cursor-grabbing" : "cursor-grab"} ${
          isLight ? "bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 border-slate-200/80" : "bg-gradient-to-br from-[#0a0a14] via-[#0e0e1c] to-[#0c1020] border-white/[0.06]"
        }`}
        onPointerDown={onPD}
        onPointerMove={onPM}
        onPointerUp={onPU}
        onPointerLeave={() => { onPU(); setTip(null); setHovered(null); }}
      >
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="gz-crit"><stop offset="0%" stopColor={rv.critColor} stopOpacity="0.55" /><stop offset="100%" stopColor={rv.critColor} stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-high"><stop offset="0%" stopColor={rv.highColor} stopOpacity="0.4" /><stop offset="100%" stopColor={rv.highColor} stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-elev"><stop offset="0%" stopColor={rv.elevColor} stopOpacity="0.3" /><stop offset="100%" stopColor={rv.elevColor} stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-cold"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" /><stop offset="100%" stopColor="#3B82F6" stopOpacity="0" /></radialGradient>
            <radialGradient id="gz-sel"><stop offset="0%" stopColor="#1473FF" stopOpacity="0.5" /><stop offset="100%" stopColor="#BE01FF" stopOpacity="0" /></radialGradient>
            <filter id="mapGlow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* State outlines */}
          {STATES.map(st => (
            <path key={st.id} d={st.d} fill={isLight ? "#e8ecf0" : "#161628"} stroke={isLight ? "#c8d0da" : "#252540"} strokeWidth={s(0.5)} opacity={0.8}>
              <title>{st.id}</title>
            </path>
          ))}

          {/* State labels at high zoom */}
          {detail === "hi" && STATES.map(st => {
            const m = st.d.match(/M([\d.]+),([\d.]+)/);
            if (!m) return null;
            return (
              <text key={`lbl-${st.id}`} x={Number(m[1]) + 15} y={Number(m[2]) + 18} fontSize={s(5)} fill={isLight ? "#94a3b8" : "#3a3a5a"} className="select-none pointer-events-none" textAnchor="middle">
                {st.id}
              </text>
            );
          })}

          {/* Interstate highways */}
          {showHwy && HWY.map(h => (
            <g key={h.id}>
              <path d={h.d} fill="none" stroke={isLight ? "#a0aec0" : "#2d2d4a"} strokeWidth={s(detail === "hi" ? 1.2 : 0.7)} strokeLinecap="round" opacity={0.5} />
              {detail !== "lo" && (() => {
                const m = h.d.match(/L([\d.]+),([\d.]+)/g);
                if (!m || m.length < 2) return null;
                const mid = m[Math.floor(m.length / 2)].match(/([\d.]+),([\d.]+)/);
                if (!mid) return null;
                return (
                  <text x={Number(mid[1])} y={Number(mid[2]) - 3} fontSize={s(4)} fill={isLight ? "#64748b" : "#4a4a6a"} opacity={0.5} textAnchor="middle" className="select-none pointer-events-none">
                    {h.id}
                  </text>
                );
              })()}
            </g>
          ))}

          {/* City markers */}
          {showCities && CITIES.map(c => {
            const [cx, cy] = proj(c.lng, c.lat);
            const major = ["Los Angeles","Chicago","Houston","New York","Dallas","Atlanta","Miami","Denver","Seattle","Detroit","Minneapolis"].includes(c.n);
            const showLbl = detail === "hi" || (detail === "med" && major) || (detail === "lo" && ["Los Angeles","Chicago","Houston","New York","Dallas","Atlanta"].includes(c.n));
            return (
              <g key={c.n}>
                <circle cx={cx} cy={cy} r={s(major ? 2 : 1.2)} fill={isLight ? "#64748b" : "#4a4a6a"} opacity={0.5} />
                {showLbl && (
                  <text x={cx + s(3)} y={cy - s(2)} fontSize={s(detail === "hi" ? 5.5 : 4.5)} fill={isLight ? "#475569" : "#7a7a9a"} opacity={detail === "hi" ? 0.85 : 0.6} className="select-none pointer-events-none" fontWeight={major ? "600" : "400"}>
                    {c.n}
                  </text>
                )}
              </g>
            );
          })}

          {/* Cold zones */}
          {coldZones.map((cz: any) => {
            const [cx, cy] = proj(cz.center?.lng || -95, cz.center?.lat || 38);
            return (
              <g key={cz.id}>
                <circle cx={cx} cy={cy} r={s(18)} fill="url(#gz-cold)" />
                <circle cx={cx} cy={cy} r={s(4)} fill={isLight ? "#93C5FD" : "#3B82F6"} opacity={0.4} />
                {detail !== "lo" && (
                  <text x={cx} y={cy - s(6)} textAnchor="middle" fontSize={s(5)} fill={isLight ? "#3B82F6" : "#60A5FA"} opacity={0.55} className="select-none pointer-events-none">
                    {cz.zoneName?.split(",")[0] || cz.id}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── HOT ZONES ── */}
          {zones.map((z: any) => {
            const [zx, zy] = proj(z.center?.lng || -95, z.center?.lat || 38);
            const ratio = Number(z.liveRatio) || 2;
            const r = s(Math.max(6, Math.min(14, rv.sizeMetric(z))));
            const isSel = selectedZone === z.zoneId;
            const isHov = hovered === z.zoneId;
            const dCol = z.demandLevel === "CRITICAL" ? rv.critColor : z.demandLevel === "HIGH" ? rv.highColor : rv.elevColor;
            const gId = z.demandLevel === "CRITICAL" ? "gz-crit" : z.demandLevel === "HIGH" ? "gz-high" : "gz-elev";
            return (
              <g
                key={z.zoneId}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); if (isSel) onSelectZone(null); else zoomToZone(z); }}
                onMouseMove={(e) => showTip(e, z)}
                onMouseLeave={() => { setTip(null); setHovered(null); }}
              >
                {/* Outer glow */}
                <circle cx={zx} cy={zy} r={r * 3.5} fill={isSel ? "url(#gz-sel)" : `url(#${gId})`}>
                  {z.demandLevel === "CRITICAL" && <animate attributeName="r" values={`${r*3};${r*4};${r*3}`} dur="2.5s" repeatCount="indefinite" />}
                </circle>
                {/* Selection ring */}
                {isSel && (
                  <circle cx={zx} cy={zy} r={r + s(5)} fill="none" stroke="#1473FF" strokeWidth={s(1.2)} opacity={0.7}>
                    <animate attributeName="r" values={`${r+s(4)};${r+s(7)};${r+s(4)}`} dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Hover ring */}
                {isHov && !isSel && (
                  <circle cx={zx} cy={zy} r={r + s(3)} fill="none" stroke={dCol} strokeWidth={s(0.8)} opacity={0.5} />
                )}
                {/* Main dot */}
                <circle cx={zx} cy={zy} r={r} fill={dCol} opacity={isHov || isSel ? 1 : 0.85} stroke={isSel ? "#1473FF" : isHov ? "#fff" : "none"} strokeWidth={isSel ? s(1.5) : s(0.8)} filter={z.demandLevel === "CRITICAL" ? "url(#mapGlow)" : undefined} />
                {/* Primary metric label inside dot — role-adaptive */}
                <text x={zx} y={zy + s(2.2)} textAnchor="middle" fontSize={s(5)} fill="white" fontWeight="700" className="select-none pointer-events-none">
                  {rv.dotLabel(z)}
                </text>
                {/* Zone name above */}
                <text x={zx} y={zy - r - s(3)} textAnchor="middle" fontSize={s(detail === "hi" ? 6 : 5)} fill={isLight ? "#1e293b" : "#e2e8f0"} fontWeight="600" opacity={isSel || isHov ? 1 : 0.7} className="select-none pointer-events-none">
                  {z.zoneName?.split("/")[0]?.split(",")[0]?.trim()}
                </text>
                {/* Demand badge below at high zoom */}
                {detail !== "lo" && (
                  <text x={zx} y={zy + r + s(8)} textAnchor="middle" fontSize={s(4)} fill={dCol} fontWeight="600" opacity={0.8} className="select-none pointer-events-none">
                    {z.demandLevel} {z.liveLoads}L/{z.liveTrucks}T
                  </text>
                )}
                {/* Equipment tags at highest zoom */}
                {detail === "hi" && (z.topEquipment?.length > 0) && (
                  <text x={zx} y={zy + r + s(14)} textAnchor="middle" fontSize={s(3.5)} fill={isLight ? "#64748b" : "#6a6a8a"} opacity={0.6} className="select-none pointer-events-none">
                    {(z.topEquipment || []).slice(0, 3).join(" · ")}
                  </text>
                )}

                {/* ── LAYER OVERLAYS ── */}
                {/* Fuel Prices layer */}
                {activeLayers.includes("fuel_prices") && z.fuelPrice != null && (
                  <g className="select-none pointer-events-none">
                    <rect x={zx + r + s(2)} y={zy - s(8)} width={s(28)} height={s(10)} rx={s(3)} fill={isLight ? "#FEF3C7" : "#78350F"} opacity={0.9} stroke="#A16207" strokeWidth={s(0.4)} />
                    <text x={zx + r + s(16)} y={zy - s(1.5)} textAnchor="middle" fontSize={s(5)} fill={isLight ? "#92400E" : "#FCD34D"} fontWeight="700">
                      ⛽ ${Number(z.fuelPrice).toFixed(2)}
                    </text>
                  </g>
                )}
                {/* Weather Risk layer */}
                {activeLayers.includes("weather_risk") && (z.weatherAlerts?.length > 0 || z.weatherRiskLevel === "HIGH") && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx - r - s(5)} cy={zy - r - s(2)} r={s(5)} fill={z.weatherRiskLevel === "HIGH" ? "#DC2626" : "#F59E0B"} opacity={0.85} />
                    <text x={zx - r - s(5)} y={zy - r + s(1.5)} textAnchor="middle" fontSize={s(5)} fill="white" fontWeight="700">⚡</text>
                    {detail !== "lo" && (
                      <text x={zx - r - s(5)} y={zy - r - s(9)} textAnchor="middle" fontSize={s(3.5)} fill={z.weatherRiskLevel === "HIGH" ? "#FCA5A5" : "#FCD34D"} fontWeight="600">
                        {z.weatherAlerts?.length || 0} alert{(z.weatherAlerts?.length || 0) !== 1 ? "s" : ""}
                      </text>
                    )}
                  </g>
                )}
                {/* Carrier Capacity layer */}
                {activeLayers.includes("carrier_capacity") && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx} cy={zy} r={r + s(6)} fill="none" stroke="#22C55E" strokeWidth={s(0.8)} strokeDasharray={`${s(3)} ${s(2)}`} opacity={0.6} />
                    <rect x={zx + r + s(2)} y={zy + s(2)} width={s(24)} height={s(9)} rx={s(3)} fill={isLight ? "#DCFCE7" : "#14532D"} opacity={0.9} stroke="#22C55E" strokeWidth={s(0.4)} />
                    <text x={zx + r + s(14)} y={zy + s(8.5)} textAnchor="middle" fontSize={s(4.5)} fill={isLight ? "#166534" : "#86EFAC"} fontWeight="700">
                      🚛 {z.liveTrucks || 0}
                    </text>
                  </g>
                )}
                {/* Compliance Risk layer */}
                {activeLayers.includes("compliance_risk") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const score = z.complianceRiskScore ?? Math.round(((z.weatherAlerts?.length || 0) * 20) + ((z.hazmatClasses?.length || 0) * 15) + (ratio > 2.5 ? 20 : 0));
                      const cCol = score > 50 ? "#EF4444" : score > 25 ? "#F59E0B" : "#22C55E";
                      return (
                        <>
                          <rect x={zx - r - s(28)} y={zy + s(2)} width={s(24)} height={s(9)} rx={s(3)} fill={isLight ? "#FFF7ED" : "#431407"} opacity={0.9} stroke={cCol} strokeWidth={s(0.4)} />
                          <text x={zx - r - s(16)} y={zy + s(8.5)} textAnchor="middle" fontSize={s(4.5)} fill={cCol} fontWeight="700">
                            ⚠ {score}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
                {/* Rate Intelligence layer — color intensity ring */}
                {activeLayers.includes("rate_heat") && (
                  <circle cx={zx} cy={zy} r={r + s(8)} fill="none" stroke="#F59E0B" strokeWidth={s(Math.min(2, (z.liveRate || 2) / 2))} opacity={0.3} className="pointer-events-none" />
                )}
                {/* Safety Score layer */}
                {activeLayers.includes("safety_score") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const ss = Math.max(0, 100 - Math.round(((z.weatherAlerts?.length || 0) * 15) + ((z.hazmatClasses?.length || 0) * 10)));
                      const ssCol = ss > 70 ? "#22D3EE" : ss > 40 ? "#F59E0B" : "#EF4444";
                      return detail !== "lo" ? (
                        <text x={zx + r + s(3)} y={zy - r + s(2)} fontSize={s(4.5)} fill={ssCol} fontWeight="700" className="select-none pointer-events-none">
                          🛡{ss}
                        </text>
                      ) : null;
                    })()}
                  </g>
                )}
                {/* Incident History layer */}
                {activeLayers.includes("incident_history") && (z.hazmatClasses?.length || 0) > 0 && (
                  <g className="select-none pointer-events-none">
                    <circle cx={zx + r + s(3)} cy={zy + r + s(3)} r={s(4)} fill="#7C3AED" opacity={0.7} />
                    <text x={zx + r + s(3)} y={zy + r + s(5.2)} textAnchor="middle" fontSize={s(4)} fill="white" fontWeight="700">
                      {z.hazmatClasses?.length || 0}
                    </text>
                  </g>
                )}
                {/* Freight Demand layer — load count badge */}
                {activeLayers.includes("freight_demand") && detail !== "lo" && (
                  <text x={zx} y={zy + r + s(detail === "hi" ? 20 : 14)} textAnchor="middle" fontSize={s(4)} fill="#EF4444" fontWeight="600" opacity={0.7} className="select-none pointer-events-none">
                    📦 {z.liveLoads || 0} loads
                  </text>
                )}
                {/* Spread/Margin Opportunity layer */}
                {activeLayers.includes("spread_opportunity") && (
                  <g className="select-none pointer-events-none">
                    {(() => {
                      const margin = Number(((z.liveRate || 2) * (z.liveRatio || 1) * 0.15).toFixed(2));
                      return detail !== "lo" ? (
                        <text x={zx - r - s(3)} y={zy + r + s(8)} textAnchor="end" fontSize={s(4.5)} fill="#10B981" fontWeight="700">
                          +${margin}/mi
                        </text>
                      ) : null;
                    })()}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── TOOLTIP ── */}
        <AnimatePresence>
          {tip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`absolute z-50 pointer-events-none rounded-xl border px-3 py-2.5 shadow-2xl ${
                isLight ? "bg-white/95 border-slate-200 shadow-slate-200/50" : "bg-[#12122a]/95 border-white/10 shadow-black/40"
              }`}
              style={{ left: Math.min(tip.px, (cRef.current?.clientWidth || 600) - 220), top: Math.max(8, tip.py - 90), minWidth: 180, backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-2 h-2 rounded-full ${tip.z.demandLevel === "CRITICAL" ? "bg-red-500" : tip.z.demandLevel === "HIGH" ? "bg-orange-500" : "bg-amber-500"}`} />
                <span className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.zoneName}</span>
              </div>
              <div className={`grid grid-cols-3 gap-x-3 gap-y-1 text-[10px] ${isLight ? "text-slate-500" : "text-white/50"}`}>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Rate</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>${Number(tip.z.liveRate || 0).toFixed(2)}/mi</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Loads</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.liveLoads}</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Trucks</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.liveTrucks}</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">L:T Ratio</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{Number(tip.z.liveRatio || 0).toFixed(2)}x</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Surge</span><span className={`font-bold ${(tip.z.liveSurge || 1) > 1.2 ? "text-red-400" : isLight ? "text-slate-800" : "text-white"}`}>{Number(tip.z.liveSurge || 1).toFixed(2)}x</span></div>
                <div><span className="block font-semibold text-[9px] uppercase tracking-wider opacity-60">Demand</span><span className={`font-bold ${tip.z.demandLevel === "CRITICAL" ? "text-red-400" : tip.z.demandLevel === "HIGH" ? "text-orange-400" : "text-amber-400"}`}>{tip.z.demandLevel}</span></div>
              </div>
              {/* Layer-specific tooltip rows */}
              {activeLayers.length > 0 && (
                <div className={`mt-1.5 pt-1.5 border-t space-y-0.5 text-[10px] ${isLight ? "border-slate-100" : "border-white/5"}`}>
                  {activeLayers.includes("fuel_prices") && tip.z.fuelPrice != null && (
                    <div className="flex justify-between"><span className="text-amber-500">⛽ Diesel</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>${Number(tip.z.fuelPrice).toFixed(2)}/gal</span></div>
                  )}
                  {activeLayers.includes("weather_risk") && (tip.z.weatherAlerts?.length || 0) > 0 && (
                    <div className="flex justify-between"><span className="text-blue-400">🌧 Weather</span><span className="font-bold text-amber-400">{tip.z.weatherAlerts.length} alert{tip.z.weatherAlerts.length !== 1 ? "s" : ""}</span></div>
                  )}
                  {activeLayers.includes("carrier_capacity") && (
                    <div className="flex justify-between"><span className="text-emerald-400">🚛 Trucks</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.liveTrucks || 0} available</span></div>
                  )}
                  {activeLayers.includes("compliance_risk") && (
                    <div className="flex justify-between"><span className="text-orange-400">⚠ Compliance</span><span className={`font-bold ${(tip.z.complianceRiskScore || 0) > 50 ? "text-red-400" : "text-emerald-400"}`}>{tip.z.complianceRiskScore ?? "N/A"}</span></div>
                  )}
                  {activeLayers.includes("freight_demand") && (
                    <div className="flex justify-between"><span className="text-red-400">📦 Demand</span><span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{tip.z.liveLoads || 0} loads</span></div>
                  )}
                </div>
              )}
              {tip.z.peakHours && <div className={`mt-1.5 pt-1 border-t text-[9px] ${isLight ? "border-slate-100 text-slate-400" : "border-white/5 text-white/30"}`}>Peak: {tip.z.peakHours}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ZOOM CONTROLS ── */}
        <div className={`absolute top-3 right-3 flex flex-col gap-1 ${isLight ? "" : ""}`}>
          {[
            { icon: ZoomIn, action: () => doZoom(1.25), tip: "Zoom in" },
            { icon: ZoomOut, action: () => doZoom(0.8), tip: "Zoom out" },
            { icon: Maximize2, action: resetView, tip: "Reset view" },
          ].map(({ icon: Ic, action, tip: t }) => (
            <button key={t} onClick={action} title={t}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                isLight ? "bg-white/90 hover:bg-white text-slate-600 shadow-sm border border-slate-200/60" : "bg-white/[0.08] hover:bg-white/[0.14] text-white/60 border border-white/[0.06]"
              }`}>
              <Ic className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* ── ZOOM LEVEL ── */}
        <div className={`absolute top-3 right-14 px-2 py-1 rounded-lg text-[10px] font-bold tabular-nums ${
          isLight ? "bg-white/90 text-slate-600 border border-slate-200/60" : "bg-white/[0.08] text-white/50 border border-white/[0.06]"
        }`}>
          {zoomPct}%
        </div>

        {/* ── MAP LAYER TOGGLES ── */}
        <div className={`absolute bottom-3 right-3 flex items-center gap-1.5`}>
          {[
            { label: "Highways", on: showHwy, toggle: () => setShowHwy(p => !p) },
            { label: "Cities", on: showCities, toggle: () => setShowCities(p => !p) },
          ].map(({ label, on, toggle }) => (
            <button key={label} onClick={toggle}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${on
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm"
                : isLight ? "bg-white/80 text-slate-400 border border-slate-200/60" : "bg-white/[0.06] text-white/30 border border-white/[0.06]"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ROLE BADGE + SUBTITLE ── */}
        <div className={`absolute top-3 left-3 px-2.5 py-1.5 rounded-lg backdrop-blur-md ${
          isLight ? "bg-white/90 border border-slate-200/60" : "bg-white/[0.08] border border-white/[0.06]"
        }`}>
          <div className={`text-[10px] font-semibold ${isLight ? "text-slate-600" : "text-white/50"}`}>
            {roleCtx?.perspective?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Demand View"}
          </div>
          <div className={`text-[8px] mt-0.5 ${isLight ? "text-slate-400" : "text-white/25"}`}>
            {rv.subtitle}
          </div>
        </div>

        {/* ── LEGEND ── */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-3 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-[9px] font-medium ${
          isLight ? "bg-white/90 text-slate-500 border border-slate-200/60" : "bg-white/[0.08] text-white/40 border border-white/[0.06]"
        }`}>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: rv.critColor }} />Critical</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: rv.highColor }} />High</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: rv.elevColor }} />Elevated</div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-50" />Cold</div>
        </div>

        {/* ── MINIMAP ── */}
        {zoomPct > 120 && (
          <div className={`absolute bottom-14 left-3 w-24 h-12 rounded-lg border overflow-hidden ${
            isLight ? "bg-white/80 border-slate-200/60" : "bg-[#0a0a14]/80 border-white/[0.08]"
          }`}>
            <svg viewBox="0 0 800 380" className="w-full h-full">
              {STATES.map(st => <path key={st.id} d={st.d} fill={isLight ? "#e0e5eb" : "#1a1a2e"} stroke={isLight ? "#d0d5dd" : "#222238"} strokeWidth="1" />)}
              {zones.map((z: any) => { const [zx,zy] = proj(z.center?.lng||-95, z.center?.lat||38); return <circle key={z.zoneId} cx={zx} cy={zy} r={4} fill={z.demandLevel==="CRITICAL"?rv.critColor:z.demandLevel==="HIGH"?rv.highColor:rv.elevColor} opacity={0.7} />; })}
              <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="none" stroke="#1473FF" strokeWidth="3" rx="2" opacity={0.8} />
            </svg>
          </div>
        )}

        {/* ── INSTRUCTIONS ── */}
        <div className={`absolute top-12 left-3 text-[9px] ${isLight ? "text-slate-400" : "text-white/20"}`}>
          Scroll to zoom · Drag to pan · Click zone to focus
        </div>
      </div>
    </div>
  );
}
