/**
 * MISSIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, mission cards with progress, rewards display
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Target, Clock, Calendar, Star, Trophy, Gift,
  ChevronRight, Zap, Award, TrendingUp, Package
} from "lucide-react";

export default function Missions() {
  const [activeTab, setActiveTab] = useState("available");
  const [selectedType, setSelectedType] = useState<string>("all");

  const missionsQuery = trpc.gamification.getMissions.useQuery({ type: selectedType as any });
  const profileQuery = trpc.gamification.getProfile.useQuery({});
  const cratesQuery = trpc.gamification.getCrates.useQuery();
  const seasonQuery = trpc.gamification.getCurrentSeason.useQuery();

  const startMissionMutation = trpc.gamification.startMission.useMutation({
    onSuccess: () => missionsQuery.refetch(),
  });

  const claimRewardMutation = trpc.gamification.claimMissionReward.useMutation({
    onSuccess: () => {
      missionsQuery.refetch();
      profileQuery.refetch();
    },
  });

  const openCrateMutation = trpc.gamification.openCrate.useMutation({
    onSuccess: () => {
      cratesQuery.refetch();
      profileQuery.refetch();
    },
  });

  const profile = profileQuery.data;
  const missions = missionsQuery.data;
  const crates = cratesQuery.data || [];
  const season = seasonQuery.data;

  const missionTypes = [
    { value: "all", label: "All", icon: Target },
    { value: "daily", label: "Daily", icon: Clock },
    { value: "weekly", label: "Weekly", icon: Calendar },
    { value: "monthly", label: "Monthly", icon: Star },
    { value: "epic", label: "Epic", icon: Trophy },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Missions
          </h1>
          <p className="text-slate-400 text-sm mt-1">Complete missions to earn rewards and XP</p>
        </div>
        <div className="flex items-center gap-4">
          {profileQuery.isLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{profile?.totalPoints || 0} XP</span>
            </div>
          )}
        </div>
      </div>

      {/* Season Banner */}
      {season && (
        <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/30 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-purple-500/30 text-purple-300 mb-2">Current Season</Badge>
                <h2 className="text-2xl font-bold text-white">{season.name}</h2>
                <p className="text-slate-300 text-sm mt-1">{season.description}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Ends in</p>
                <p className="text-xl font-bold text-purple-300">
                  {season.endsAt ? Math.ceil((new Date(season.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {missions?.active?.length || 0}
                </p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {missions?.completed?.length || 0}
                </p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Gift className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {missions?.available?.length || 0}
                </p>
                <p className="text-xs text-slate-400">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Package className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {crates.length}
                </p>
                <p className="text-xs text-slate-400">Crates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {missionTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              size="sm"
              className={selectedType === type.value 
                ? "bg-purple-600 hover:bg-purple-500" 
                : "border-slate-600 text-slate-300 hover:bg-slate-700"}
              onClick={() => setSelectedType(type.value)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {type.label}
            </Button>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="available" className="data-[state=active]:bg-slate-700">
            Available
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-slate-700">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-slate-700">
            Completed
          </TabsTrigger>
          <TabsTrigger value="crates" className="data-[state=active]:bg-slate-700">
            Crates ({crates.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Missions */}
        <TabsContent value="available">
          {missionsQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(missions?.available || []).map((mission: any) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onStart={() => startMissionMutation.mutate({ missionId: mission.id })}
                  isStarting={startMissionMutation.isPending}
                />
              ))}
              {(missions?.available || []).length === 0 && (
                <div className="col-span-2 text-center text-slate-500 py-12">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No available missions. Check back later!</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Active Missions */}
        <TabsContent value="active">
          {missionsQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(missions?.active || []).map((mission: any) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClaim={mission.status === "completed" ? () => claimRewardMutation.mutate({ missionId: mission.id }) : undefined}
                  isClaiming={claimRewardMutation.isPending}
                  showProgress
                />
              ))}
              {(missions?.active || []).length === 0 && (
                <div className="col-span-2 text-center text-slate-500 py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active missions. Start one from the Available tab!</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Completed Missions */}
        <TabsContent value="completed">
          {missionsQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(missions?.completed || []).map((mission: any) => (
                <MissionCard key={mission.id} mission={mission} completed />
              ))}
              {(missions?.completed || []).length === 0 && (
                <div className="col-span-2 text-center text-slate-500 py-12">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No completed missions yet. Keep going!</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Crates */}
        <TabsContent value="crates">
          <div className="grid md:grid-cols-3 gap-4">
            {crates.map((crate: any) => (
              <CrateCard
                key={crate.id}
                crate={crate}
                onOpen={() => openCrateMutation.mutate({ crateId: crate.id })}
                isOpening={openCrateMutation.isPending}
              />
            ))}
            {crates.length === 0 && (
              <div className="col-span-3 text-center text-slate-500 py-12">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No crates to open. Complete missions to earn crates!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MissionCard({ 
  mission, 
  onStart, 
  onClaim, 
  isStarting, 
  isClaiming,
  showProgress,
  completed 
}: { 
  mission: any; 
  onStart?: () => void;
  onClaim?: () => void;
  isStarting?: boolean;
  isClaiming?: boolean;
  showProgress?: boolean;
  completed?: boolean;
}) {
  const progress = mission.targetValue > 0 
    ? Math.min(100, (mission.currentProgress / mission.targetValue) * 100) 
    : 0;

  const typeColors: Record<string, string> = {
    daily: "bg-blue-500/20 text-blue-400",
    weekly: "bg-purple-500/20 text-purple-400",
    monthly: "bg-emerald-500/20 text-emerald-400",
    epic: "bg-yellow-500/20 text-yellow-400",
    seasonal: "bg-pink-500/20 text-pink-400",
  };

  const rewardIcons: Record<string, any> = {
    miles: TrendingUp,
    cash: Award,
    xp: Zap,
    crate: Package,
    badge: Trophy,
  };

  const RewardIcon = rewardIcons[mission.rewardType] || Gift;

  return (
    <Card className={`bg-slate-800/50 border-slate-700/50 rounded-xl ${completed ? "opacity-75" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge className={typeColors[mission.type] || "bg-slate-600 text-slate-300"}>
              {mission.type}
            </Badge>
            <h3 className="text-lg font-semibold text-slate-200 mt-2">{mission.name}</h3>
            <p className="text-slate-400 text-sm mt-1">{mission.description}</p>
          </div>
        </div>

        {showProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Progress</span>
              <span className="text-slate-300">
                {mission.currentProgress || 0}/{mission.targetValue} {mission.targetUnit || ""}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-700" />
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <RewardIcon className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-400 font-semibold">{mission.rewardValue} {mission.rewardType}</p>
              {mission.xpReward > 0 && (
                <p className="text-slate-500 text-xs">+{mission.xpReward} XP</p>
              )}
            </div>
          </div>

          {!completed && onStart && mission.status !== "in_progress" && mission.status !== "completed" && (
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-500"
              onClick={onStart}
              disabled={isStarting}
            >
              {isStarting ? "Starting..." : "Start"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {mission.status === "completed" && onClaim && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={onClaim}
              disabled={isClaiming}
            >
              {isClaiming ? "Claiming..." : "Claim Reward"}
            </Button>
          )}

          {completed && (
            <Badge className="bg-emerald-500/20 text-emerald-400">
              Claimed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CrateCard({ crate, onOpen, isOpening }: { crate: any; onOpen: () => void; isOpening: boolean }) {
  const crateColors: Record<string, { bg: string; border: string; text: string }> = {
    common: { bg: "bg-slate-600/30", border: "border-slate-500", text: "text-slate-300" },
    uncommon: { bg: "bg-green-600/30", border: "border-green-500", text: "text-green-300" },
    rare: { bg: "bg-blue-600/30", border: "border-blue-500", text: "text-blue-300" },
    epic: { bg: "bg-purple-600/30", border: "border-purple-500", text: "text-purple-300" },
    legendary: { bg: "bg-yellow-600/30", border: "border-yellow-500", text: "text-yellow-300" },
    mythic: { bg: "bg-red-600/30", border: "border-red-500", text: "text-red-300" },
  };

  const colors = crateColors[crate.crateType] || crateColors.common;

  return (
    <Card className={`${colors.bg} ${colors.border} border rounded-xl`}>
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <Package className={`w-16 h-16 mx-auto ${colors.text}`} />
        </div>
        <h3 className={`text-lg font-bold capitalize ${colors.text}`}>{crate.crateType} Crate</h3>
        <p className="text-slate-400 text-sm mb-4">Source: {crate.source}</p>
        <Button 
          className="w-full bg-slate-700 hover:bg-slate-600"
          onClick={onOpen}
          disabled={isOpening}
        >
          {isOpening ? "Opening..." : "Open Crate"}
        </Button>
      </CardContent>
    </Card>
  );
}
