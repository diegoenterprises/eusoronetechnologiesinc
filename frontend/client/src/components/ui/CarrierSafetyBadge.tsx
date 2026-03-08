/**
 * CARRIER SAFETY BADGE — Reusable risk indicator component
 * GAP-103: Color-coded risk tier + eligibility score with hover tooltip
 *
 * Usage:
 *   <CarrierSafetyBadge dotNumber="1234567" />
 *   <CarrierSafetyBadge dotNumber="1234567" size="lg" />
 *
 * Displays:
 *   - Color circle: green (LOW) / yellow (MODERATE) / orange (HIGH) / red (CRITICAL)
 *   - Risk score (0-100)
 *   - Hover tooltip: BASICs summary, OOS rate, crash count
 *
 * Data sources:
 *   - lightspeed.riskScore (cached, sub-1ms)
 *   - lightspeed.carrierProfile (for tooltip details)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface CarrierSafetyBadgeProps {
  dotNumber: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showLabel?: boolean;
}

const TIER_CONFIG = {
  LOW: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-500",
    label: "Low Risk",
    icon: CheckCircle,
  },
  MODERATE: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    ring: "ring-yellow-500/20",
    dot: "bg-yellow-500",
    label: "Moderate",
    icon: Shield,
  },
  HIGH: {
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    ring: "ring-orange-500/20",
    dot: "bg-orange-500",
    label: "High Risk",
    icon: AlertTriangle,
  },
  CRITICAL: {
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    ring: "ring-red-500/20",
    dot: "bg-red-500",
    label: "Critical",
    icon: XCircle,
  },
  UNKNOWN: {
    color: "text-slate-400",
    bg: "bg-slate-500/15",
    border: "border-slate-500/30",
    ring: "ring-slate-500/20",
    dot: "bg-slate-500",
    label: "Unknown",
    icon: Shield,
  },
} as const;

type RiskTier = keyof typeof TIER_CONFIG;

const SIZE_CONFIG = {
  sm: { dot: "w-2 h-2", text: "text-[10px]", badge: "px-1.5 py-0.5 gap-1", icon: 10 },
  md: { dot: "w-2.5 h-2.5", text: "text-xs", badge: "px-2 py-1 gap-1.5", icon: 12 },
  lg: { dot: "w-3 h-3", text: "text-sm", badge: "px-2.5 py-1.5 gap-2", icon: 14 },
};

export default function CarrierSafetyBadge({
  dotNumber,
  size = "sm",
  showScore = true,
  showLabel = false,
}: CarrierSafetyBadgeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const riskQuery = (trpc as any).lightspeed?.riskScore?.useQuery(
    { dotNumber },
    { enabled: !!dotNumber, staleTime: 60000, retry: false }
  );

  // Only fetch full profile when tooltip is hovered
  const profileQuery = (trpc as any).lightspeed?.carrierProfile?.useQuery(
    { dotNumber },
    { enabled: !!dotNumber && tooltipOpen, staleTime: 120000, retry: false }
  );

  const tier = ((riskQuery?.data?.tier || "UNKNOWN") as string).toUpperCase() as RiskTier;
  const score = riskQuery?.data?.score ?? 0;
  const config = TIER_CONFIG[tier] || TIER_CONFIG.UNKNOWN;
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  if (!dotNumber) return null;

  // Loading state
  if (riskQuery?.isLoading) {
    return (
      <span className={`inline-flex items-center ${sizeConfig.badge} rounded-full bg-slate-500/10 border border-slate-500/20 animate-pulse`}>
        <span className={`${sizeConfig.dot} rounded-full bg-slate-500/40`} />
        <span className={`${sizeConfig.text} text-slate-500`}>...</span>
      </span>
    );
  }

  const profile = profileQuery?.data;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setTooltipOpen(true)}
      onMouseLeave={() => setTooltipOpen(false)}
    >
      {/* Badge */}
      <span
        className={`inline-flex items-center ${sizeConfig.badge} rounded-full ${config.bg} border ${config.border} cursor-default transition-all hover:ring-2 ${config.ring}`}
      >
        <span className={`${sizeConfig.dot} rounded-full ${config.dot} flex-shrink-0`} />
        {showScore && (
          <span className={`${sizeConfig.text} font-bold ${config.color} tabular-nums`}>
            {score}
          </span>
        )}
        {showLabel && (
          <span className={`${sizeConfig.text} font-medium ${config.color}`}>
            {config.label}
          </span>
        )}
      </span>

      {/* Tooltip */}
      {tooltipOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 pointer-events-none">
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl p-3 text-xs">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/40">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className={`font-bold ${config.color}`}>{config.label}</span>
              <span className="ml-auto text-slate-400 tabular-nums">Score: {score}/100</span>
            </div>

            {profile ? (
              <>
                {/* BASICs Summary */}
                <div className="space-y-1 mb-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">BASICs Scores</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <BasicRow label="Unsafe Driving" value={profile.unsafeDrivingPercentile} alert={profile.unsafeDrivingAlert} />
                    <BasicRow label="HOS" value={profile.hosPercentile} alert={profile.hosAlert} />
                    <BasicRow label="Vehicle Maint." value={profile.vehicleMaintenancePercentile} alert={profile.vehicleMaintenanceAlert} />
                    <BasicRow label="Ctrl Substances" value={profile.controlledSubstancesPercentile} alert={profile.controlledSubstancesAlert} />
                    <BasicRow label="Driver Fitness" value={profile.driverFitnessPercentile} alert={profile.driverFitnessAlert} />
                    <BasicRow label="Crash Indicator" value={profile.crashIndicatorPercentile} alert={profile.crashIndicatorAlert} />
                    <BasicRow label="HazMat" value={profile.hazmatPercentile} alert={profile.hazmatAlert} />
                  </div>
                </div>

                {/* Safety Stats */}
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-700/40">
                  <span>OOS Rate: <strong className="text-slate-300">{profile.oosRateVehicle ?? "N/A"}%</strong></span>
                  <span>Crashes (24mo): <strong className="text-slate-300">{profile.totalCrashes24mo ?? "N/A"}</strong></span>
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-2">
                {profileQuery?.isLoading ? "Loading details..." : "DOT# " + dotNumber}
              </div>
            )}

            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700/60 rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </span>
  );
}

function BasicRow({ label, value, alert }: { label: string; value?: number | null; alert?: boolean }) {
  const displayVal = value != null ? `${Math.round(value)}%` : "N/A";
  const alertColor = alert ? "text-red-400 font-bold" : value != null && value > 65 ? "text-orange-400" : "text-slate-300";
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 truncate">{label}</span>
      <span className={`tabular-nums ${alertColor}`}>
        {alert && "⚠ "}{displayVal}
      </span>
    </div>
  );
}
