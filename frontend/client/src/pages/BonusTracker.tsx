/**
 * BONUS TRACKER PAGE
 * Driver-facing bonus and incentive tracking screen.
 * Shows active bonuses, milestone progress, safety bonuses,
 * referral rewards, and seasonal incentives.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Award, DollarSign, Target, TrendingUp, Star,
  RefreshCw, Gift, Shield, Truck, Users, Zap, Clock
} from "lucide-react";

type BonusItem = {
  id: string;
  name: string;
  description: string;
  amount: number;
  progress: number;
  target: number;
  status: "active" | "earned" | "expired" | "locked";
  category: "milestone" | "safety" | "referral" | "seasonal" | "performance";
  expiresAt?: string;
};

const SAMPLE_BONUSES: BonusItem[] = [
  { id: "1", name: "First 10 Loads", description: "Complete your first 10 deliveries", amount: 500, progress: 0, target: 10, status: "active", category: "milestone" },
  { id: "2", name: "Safety Champion", description: "30 consecutive days with zero incidents", amount: 250, progress: 0, target: 30, status: "active", category: "safety" },
  { id: "3", name: "Hazmat Premium", description: "Complete 5 hazmat loads this month", amount: 300, progress: 0, target: 5, status: "active", category: "performance" },
  { id: "4", name: "Refer a Driver", description: "$200 for each driver referral who completes onboarding", amount: 200, progress: 0, target: 1, status: "active", category: "referral" },
  { id: "5", name: "Peak Season Bonus", description: "Extra $0.05/mile during Q4 peak season", amount: 0, progress: 0, target: 1, status: "active", category: "seasonal" },
  { id: "6", name: "On-Time Delivery Streak", description: "15 consecutive on-time deliveries", amount: 150, progress: 0, target: 15, status: "active", category: "performance" },
];

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  milestone: { icon: <Target className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/15", label: "Milestone" },
  safety: { icon: <Shield className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-500/15", label: "Safety" },
  referral: { icon: <Users className="w-4 h-4" />, color: "text-purple-400", bg: "bg-purple-500/15", label: "Referral" },
  seasonal: { icon: <Zap className="w-4 h-4" />, color: "text-orange-400", bg: "bg-orange-500/15", label: "Seasonal" },
  performance: { icon: <TrendingUp className="w-4 h-4" />, color: "text-cyan-400", bg: "bg-cyan-500/15", label: "Performance" },
};

export default function BonusTracker() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const rewardsQuery = (trpc as any).gamification?.getRewards?.useQuery?.() ||
    (trpc as any).rewards?.getDriverRewards?.useQuery?.() ||
    { data: null, isLoading: false, refetch: () => {} };

  const profileQuery = (trpc as any).drivers?.getProfile?.useQuery?.() || { data: null, isLoading: false };

  const rewardsData = rewardsQuery.data;
  const profile = profileQuery.data;
  const isLoading = rewardsQuery.isLoading;

  // Merge real data with sample structure
  const bonuses: BonusItem[] = Array.isArray(rewardsData?.bonuses) ? rewardsData.bonuses :
    Array.isArray(rewardsData) ? rewardsData : SAMPLE_BONUSES;

  const totalEarned = bonuses.filter((b) => b.status === "earned").reduce((sum, b) => sum + b.amount, 0);
  const totalAvailable = bonuses.filter((b) => b.status === "active").reduce((sum, b) => sum + b.amount, 0);
  const activeBonuses = bonuses.filter((b) => b.status === "active");
  const earnedBonuses = bonuses.filter((b) => b.status === "earned");

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Bonus Tracker
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Earn rewards for milestones, safety, and performance
          </p>
        </div>
        <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => rewardsQuery.refetch?.()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <DollarSign className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: `$${totalEarned.toLocaleString()}`, label: "Total Earned", color: "text-green-400" },
              { icon: <Gift className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: `$${totalAvailable.toLocaleString()}`, label: "Available", color: "text-purple-400" },
              { icon: <Target className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(activeBonuses.length), label: "Active Bonuses", color: "text-blue-400" },
              { icon: <Award className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: String(earnedBonuses.length), label: "Completed", color: "text-yellow-400" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                    <div>
                      <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active Bonuses */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Zap className="w-5 h-5 text-[#1473FF]" />
                Active Bonuses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeBonuses.length === 0 ? (
                <div className="text-center py-10">
                  <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                    <Gift className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No active bonuses</p>
                  <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Check back soon for new bonus opportunities</p>
                </div>
              ) : (
                activeBonuses.map((bonus) => {
                  const cat = CATEGORY_CONFIG[bonus.category] || CATEGORY_CONFIG.performance;
                  const progressPct = bonus.target > 0 ? Math.min(100, (bonus.progress / bonus.target) * 100) : 0;
                  return (
                    <div key={bonus.id} className={cn(
                      "p-4 rounded-xl border transition-colors",
                      isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2.5 rounded-lg flex-shrink-0", cat.bg, cat.color)}>
                            {cat.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{bonus.name}</p>
                              <Badge className={cn("text-[9px] border", cat.bg, cat.color, "border-current/20")}>{cat.label}</Badge>
                            </div>
                            <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{bonus.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                            {bonus.amount > 0 ? `$${bonus.amount}` : "Active"}
                          </p>
                        </div>
                      </div>

                      {bonus.target > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                              {bonus.progress} / {bonus.target}
                            </p>
                            <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
                              {Math.round(progressPct)}%
                            </p>
                          </div>
                          <Progress value={progressPct} className="h-2 rounded-full" />
                        </div>
                      )}

                      {bonus.expiresAt && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                            Expires {new Date(bonus.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Earned Bonuses */}
          {earnedBonuses.length > 0 && (
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Award className="w-5 h-5 text-yellow-500" />
                  Earned Bonuses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {earnedBonuses.map((bonus) => {
                  const cat = CATEGORY_CONFIG[bonus.category] || CATEGORY_CONFIG.performance;
                  return (
                    <div key={bonus.id} className={cn(
                      "flex items-center justify-between p-3 rounded-xl border",
                      isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", cat.bg, cat.color)}>{cat.icon}</div>
                        <div>
                          <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{bonus.name}</p>
                          <p className={cn("text-xs", isLight ? "text-green-600" : "text-green-400")}>Completed</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-green-500">+${bonus.amount}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
