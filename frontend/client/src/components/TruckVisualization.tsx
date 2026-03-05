/**
 * ANIMATED TRUCK VISUALIZATION COMPONENT
 * Physics-based animations for liquid, gas, and solid materials
 * Gradient colors matching EusoTrip brand
 */

import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type MaterialType = "liquid" | "gas" | "refrigerated" | "solid" | "hazmat" | "livestock" | "bulk" | "vehicles" | "grain";

interface TruckVisualizationProps {
  materialType: MaterialType;
  fillPercentage: number;
  volume: number;
  unit: string;
  maxCapacity?: number;
  label?: string;
  trailerNumber?: number;
}

interface MultiTruckVisualizationProps {
  materialType: MaterialType;
  totalVolume: number;
  unit: string;
  maxCapacityPerTruck?: number;
}

const TruckVisualization: React.FC<TruckVisualizationProps> = ({
  materialType,
  fillPercentage,
  volume,
  unit,
  label = "Hazardous",
  trailerNumber = 1,
}) => {
  const [waveOffset, setWaveOffset] = useState(0);
  const [gasParticles, setGasParticles] = useState<Array<{ x: number; y: number; size: number; opacity: number }>>([]);
  
  const clampedFill = Math.min(100, Math.max(0, fillPercentage));

  useEffect(() => {
    if (materialType === "liquid" || materialType === "hazmat") {
      const interval = setInterval(() => {
        setWaveOffset((prev) => (prev + 2) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [materialType]);

  useEffect(() => {
    if (materialType === "gas") {
      const particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 4,
        opacity: Math.random() * 0.6 + 0.2,
      }));
      setGasParticles(particles);

      const interval = setInterval(() => {
        setGasParticles((prev) =>
          prev.map((p) => ({
            ...p,
            x: (p.x + (Math.random() - 0.5) * 3 + 100) % 100,
            y: (p.y - Math.random() * 2 + 100) % 100,
            opacity: Math.random() * 0.6 + 0.2,
          }))
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [materialType]);

  const getLabelColor = () => {
    switch (materialType) {
      case "liquid":
      case "hazmat":
        return "text-red-400";
      case "gas":
        return "text-yellow-400";
      case "refrigerated":
        return "text-cyan-400";
      case "livestock":
        return "text-green-400";
      case "bulk":
      case "grain":
        return "text-amber-400";
      case "vehicles":
        return "text-blue-400";
      case "solid":
      default:
        return "text-cyan-400";
    }
  };

  const getLabelText = () => {
    switch (materialType) {
      case "liquid":
      case "hazmat":
        return "Hazardous";
      case "gas":
        return "Gas";
      case "refrigerated":
        return "Refrigerated";
      case "livestock":
        return "Livestock";
      case "bulk":
        return "Dry Bulk";
      case "grain":
        return "Grain";
      case "vehicles":
        return "Vehicles";
      case "solid":
        return "Solid";
      default:
        return label;
    }
  };

  const renderTankContent = () => {
    if (materialType === "liquid" || materialType === "hazmat") {
      const waveHeight = 8;
      const wave1 = Math.sin((waveOffset * Math.PI) / 180) * waveHeight;
      const wave2 = Math.sin(((waveOffset + 120) * Math.PI) / 180) * waveHeight;
      const wave3 = Math.sin(((waveOffset + 240) * Math.PI) / 180) * waveHeight;
      
      const fillY = 100 - clampedFill;
      
      return (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`liquidGradient-${trailerNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id={`liquidSurface-${trailerNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
            </linearGradient>
            <clipPath id={`tankClip-${trailerNumber}`}>
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>
          
          <g clipPath={`url(#tankClip-${trailerNumber})`}>
            <path
              d={`
                M 0 ${fillY + wave1}
                Q 25 ${fillY + wave2}, 50 ${fillY + wave1}
                Q 75 ${fillY + wave3}, 100 ${fillY + wave2}
                L 100 100
                L 0 100
                Z
              `}
              fill={`url(#liquidGradient-${trailerNumber})`}
              className="transition-all duration-300"
            />
            <path
              d={`
                M 0 ${fillY + wave1}
                Q 25 ${fillY + wave2}, 50 ${fillY + wave1}
                Q 75 ${fillY + wave3}, 100 ${fillY + wave2}
              `}
              fill="none"
              stroke={`url(#liquidSurface-${trailerNumber})`}
              strokeWidth="3"
            />
          </g>
        </svg>
      );
    }

    if (materialType === "gas") {
      return (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`gasGradient-${trailerNumber}`}>
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
            </radialGradient>
            <clipPath id={`gasClip-${trailerNumber}`}>
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>
          
          <g clipPath={`url(#gasClip-${trailerNumber})`}>
            <rect x="0" y={100 - clampedFill} width="100" height={clampedFill} fill="rgba(139, 92, 246, 0.15)" />
            {gasParticles.map((particle, i) => (
              <circle
                key={i}
                cx={particle.x}
                cy={Math.max(100 - clampedFill, particle.y)}
                r={particle.size}
                fill={`url(#gasGradient-${trailerNumber})`}
                opacity={particle.opacity * (clampedFill / 100)}
                className="transition-all duration-100"
              />
            ))}
          </g>
        </svg>
      );
    }

    return null;
  };

  const renderBoxContent = () => {
    if (materialType === "livestock") return renderLivestockContent();
    if (materialType === "vehicles") return renderVehiclesContent();
    if (materialType === "bulk" || materialType === "grain") return renderBulkContent();

    const rows = 3;
    const cols = 4;
    const totalBlocks = rows * cols;
    const filledBlocks = Math.ceil((clampedFill / 100) * totalBlocks);

    return (
      <div className="absolute inset-2 grid grid-cols-4 grid-rows-3 gap-1">
        {Array.from({ length: totalBlocks }).map((_, i) => {
          const isFilled = i < filledBlocks;
          const isPartial = i === filledBlocks - 1 && clampedFill % (100 / totalBlocks) !== 0;
          
          return (
            <div
              key={i}
              className={cn(
                "rounded-sm transition-all duration-500",
                isFilled
                  ? "bg-gradient-to-br from-purple-400/80 to-indigo-500/80"
                  : "bg-slate-700/30 border border-slate-600/30"
              )}
              style={{
                opacity: isFilled ? (isPartial ? 0.6 : 1) : 0.3,
                transform: isFilled ? "scale(1)" : "scale(0.9)",
              }}
            />
          );
        })}
      </div>
    );
  };

  const renderLivestockContent = () => {
    const totalSlots = 10;
    const filledSlots = Math.ceil((clampedFill / 100) * totalSlots);
    return (
      <svg viewBox="0 0 144 112" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`lvGrad-${trailerNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {Array.from({ length: totalSlots }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const cx = 18 + col * 24;
          const cy = 28 + row * 40;
          const filled = i < filledSlots;
          return (
            <g key={i} opacity={filled ? 1 : 0.2}>
              <ellipse cx={cx} cy={cy + 8} rx={8} ry={5} fill={filled ? `url(#lvGrad-${trailerNumber})` : "#334155"} />
              <rect x={cx - 5} y={cy - 4} width={10} height={12} rx={3} fill={filled ? `url(#lvGrad-${trailerNumber})` : "#334155"} />
              <circle cx={cx} cy={cy - 8} r={4} fill={filled ? `url(#lvGrad-${trailerNumber})` : "#334155"} />
              {filled && <>
                <line x1={cx - 4} y1={cy - 12} x2={cx - 6} y2={cy - 16} stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                <line x1={cx + 4} y1={cy - 12} x2={cx + 6} y2={cy - 16} stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
              </>}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderVehiclesContent = () => {
    const totalSlots = 8;
    const filledSlots = Math.ceil((clampedFill / 100) * totalSlots);
    return (
      <div className="absolute inset-2 grid grid-cols-4 grid-rows-2 gap-1">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const filled = i < filledSlots;
          return (
            <div key={i} className={cn("rounded-sm flex items-center justify-center transition-all duration-500",
              filled ? "bg-gradient-to-br from-blue-400/80 to-sky-500/80" : "bg-slate-700/30 border border-slate-600/30")}
              style={{ opacity: filled ? 1 : 0.25 }}>
              <svg viewBox="0 0 24 14" className="w-[70%] h-[70%]" fill="none">
                <rect x="1" y="4" width="22" height="7" rx="2" fill={filled ? "#60a5fa" : "#475569"} opacity="0.6" />
                <rect x="3" y="2" width="8" height="5" rx="1" fill={filled ? "#93c5fd" : "#475569"} opacity="0.8" />
                <circle cx="6" cy="12" r="2" fill={filled ? "#3b82f6" : "#475569"} />
                <circle cx="18" cy="12" r="2" fill={filled ? "#3b82f6" : "#475569"} />
              </svg>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBulkContent = () => {
    const fillY = 100 - clampedFill;
    const isGrain = materialType === "grain";
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`bulkGrad-${trailerNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isGrain ? "#fbbf24" : "#f59e0b"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isGrain ? "#d97706" : "#b45309"} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path d={`M 0 ${fillY + 4} Q 20 ${fillY - 2}, 35 ${fillY + 3} Q 55 ${fillY + 8}, 70 ${fillY + 1} Q 85 ${fillY - 3}, 100 ${fillY + 2} L 100 100 L 0 100 Z`}
          fill={`url(#bulkGrad-${trailerNumber})`} />
        {clampedFill > 10 && Array.from({ length: 12 }).map((_, i) => (
          <circle key={i} cx={8 + (i % 6) * 16 + (Math.floor(i / 6) * 8)} cy={fillY + 10 + Math.floor(i / 6) * 18}
            r={isGrain ? 2.5 : 3.5} fill={isGrain ? "#fde68a" : "#fcd34d"} opacity="0.5" />
        ))}
      </svg>
    );
  };

  const isTank = materialType === "liquid" || materialType === "hazmat" || materialType === "gas";
  const isLivestock = materialType === "livestock";
  const isVehicles = materialType === "vehicles";
  const isBulk = materialType === "bulk" || materialType === "grain";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {isTank ? (
          <>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded-t-lg z-10" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-slate-400 rounded-full z-10" />
            
            <div
              className={cn(
                "relative w-32 h-32 rounded-full overflow-hidden",
                "bg-gradient-to-br from-slate-800 to-slate-900",
                "border-4",
                materialType === "hazmat" || materialType === "liquid"
                  ? "border-purple-500/50"
                  : materialType === "gas"
                  ? "border-yellow-500/50"
                  : "border-cyan-500/50"
              )}
            >
              {renderTankContent()}
              
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span className="text-white font-bold text-lg drop-shadow-lg">
                  {volume.toLocaleString()} {unit}
                </span>
              </div>
              
              <div className="absolute inset-0 rounded-full border-2 border-white/10 pointer-events-none" />
              <div className="absolute top-2 left-4 w-8 h-4 bg-white/10 rounded-full blur-sm" />
            </div>
            
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-16 bg-gradient-to-b from-slate-500 to-slate-600 rounded-l-lg" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-16 bg-gradient-to-b from-slate-500 to-slate-600 rounded-r-lg" />
          </>
        ) : (
          <div
            className={cn(
              "relative w-36 h-28 rounded-lg overflow-hidden",
              "bg-gradient-to-br from-slate-800 to-slate-900",
              "border-4",
              isLivestock ? "border-green-500/50" : isBulk ? "border-amber-500/50" : isVehicles ? "border-blue-500/50" : "border-cyan-500/50"
            )}
          >
            {renderBoxContent()}
            
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="text-white font-bold text-lg drop-shadow-lg">
                {volume.toLocaleString()} {unit}
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-2 px-4 py-1 rounded-lg text-sm font-bold",
          "bg-gradient-to-r",
          materialType === "hazmat" || materialType === "liquid"
                  ? "from-red-500/20 to-orange-500/20 border border-red-500/30"
                  : materialType === "gas"
                  ? "from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                  : materialType === "livestock"
                  ? "from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  : materialType === "bulk" || materialType === "grain"
                  ? "from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
                  : materialType === "vehicles"
                  ? "from-blue-500/20 to-sky-500/20 border border-blue-500/30"
                  : "from-cyan-500/20 to-blue-500/20 border border-cyan-500/30",
          getLabelColor()
        )}
      >
        {getLabelText()}
      </div>

      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-6 rounded-sm",
              "bg-gradient-to-b from-cyan-500/60 to-purple-500/60",
              "border border-cyan-400/30"
            )}
          />
        ))}
      </div>
      <span className="text-slate-400 text-xs mt-1">Trailer-{trailerNumber}</span>
    </div>
  );
};

export const MultiTruckVisualization: React.FC<MultiTruckVisualizationProps> = ({
  materialType,
  totalVolume,
  unit,
  maxCapacityPerTruck = 8500,
}) => {
  const trucks = useMemo(() => {
    if (totalVolume <= 0) return [];
    
    const numTrucks = Math.ceil(totalVolume / maxCapacityPerTruck);
    const trucksArray = [];
    let remainingVolume = totalVolume;

    for (let i = 0; i < numTrucks; i++) {
      const truckVolume = Math.min(remainingVolume, maxCapacityPerTruck);
      const fillPercentage = (truckVolume / maxCapacityPerTruck) * 100;
      
      trucksArray.push({
        volume: truckVolume,
        fillPercentage,
        trailerNumber: i + 1,
      });
      
      remainingVolume -= truckVolume;
    }

    return trucksArray;
  }, [totalVolume, maxCapacityPerTruck]);

  if (trucks.length === 0) {
    return (
      <div className="flex justify-center">
        <TruckVisualization
          materialType={materialType}
          fillPercentage={0}
          volume={0}
          unit={unit}
          trailerNumber={1}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {trucks.map((truck) => (
        <TruckVisualization
          key={truck.trailerNumber}
          materialType={materialType}
          fillPercentage={truck.fillPercentage}
          volume={Math.round(truck.volume)}
          unit={unit}
          trailerNumber={truck.trailerNumber}
        />
      ))}
    </div>
  );
};

export default TruckVisualization;
