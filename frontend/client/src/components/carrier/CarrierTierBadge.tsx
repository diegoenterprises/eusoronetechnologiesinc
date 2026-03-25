/**
 * CARRIER TIER BADGE (GAP-063)
 * Reusable badge component showing Gold/Silver/Bronze/Standard tier.
 * Can be embedded in carrier cards, bid lists, load boards, etc.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Award, Medal, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface CarrierTierBadgeProps {
  carrierId?: number;
  tier?: "gold" | "silver" | "bronze" | "standard";
  score?: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

const TIER_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
  gradient: string;
}> = {
  gold: {
    label: "Gold",
    icon: <Crown className="w-3 h-3" />,
    bgClass: "bg-yellow-500/15",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-500/30",
    gradient: "from-yellow-500/20 to-amber-500/20",
  },
  silver: {
    label: "Silver",
    icon: <Award className="w-3 h-3" />,
    bgClass: "bg-slate-300/15",
    textClass: "text-slate-300",
    borderClass: "border-slate-400/30",
    gradient: "from-slate-300/20 to-slate-400/20",
  },
  bronze: {
    label: "Bronze",
    icon: <Medal className="w-3 h-3" />,
    bgClass: "bg-orange-500/15",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/30",
    gradient: "from-orange-500/20 to-amber-600/20",
  },
  standard: {
    label: "Standard",
    icon: <Truck className="w-3 h-3" />,
    bgClass: "bg-slate-600/15",
    textClass: "text-slate-500",
    borderClass: "border-slate-600/30",
    gradient: "from-slate-600/20 to-slate-700/20",
  },
};

export default function CarrierTierBadge({
  carrierId, tier: propTier, score: propScore, size = "sm", showScore = false, className,
}: CarrierTierBadgeProps) {
  // If no tier provided, fetch it
  const tierQuery = (trpc as any).carrierTier?.getCarrierTier?.useQuery?.(
    { carrierId: carrierId! },
    { enabled: !!carrierId && !propTier, staleTime: 300_000 }
  ) || { data: null };

  const tier = propTier || tierQuery.data?.tier || "standard";
  const score = propScore ?? tierQuery.data?.compositeScore;
  const config = TIER_CONFIG[tier] || TIER_CONFIG.standard;

  if (tier === "standard" && !showScore) return null; // Don't show badge for standard unless explicitly requested

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-semibold",
      config.bgClass, config.textClass, config.borderClass,
      sizeClasses[size],
      className,
    )}>
      {config.icon}
      <span>{config.label}</span>
      {showScore && score != null && (
        <span className="opacity-70 font-mono">{score}</span>
      )}
    </span>
  );
}

export { TIER_CONFIG };
