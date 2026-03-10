/**
 * ADVANCED GAMIFICATION HUB
 * Full gamification experience: guilds, prestige, store, events,
 * tournaments, achievements, quests, and driver profile customization.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Star, Award, Target, Shield, Crown, Flame, Users,
  Swords, Gift, Calendar, Clock, ChevronRight, Plus, Zap,
  ShoppingCart, Package, Truck, Heart, TrendingUp, Lock,
  CheckCircle, Diamond, Medal, Sparkles, MapPin, Timer,
  ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../contexts/ThemeContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, color, loading, isLight = false }: {
  icon: React.ElementType; label: string; value: string | number; color: string; loading?: boolean; isLight?: boolean;
}) {
  return (
    <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-full", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            {loading ? <Skeleton className="h-7 w-14" /> : (
              <p className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{value}</p>
            )}
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Package className="w-12 h-12 mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300 border-slate-500",
  uncommon: "text-green-400 border-green-500",
  rare: "text-blue-400 border-blue-500",
  epic: "text-purple-400 border-purple-500",
  legendary: "text-amber-400 border-amber-500",
};

const RARITY_BG: Record<string, string> = {
  common: "bg-slate-500/20",
  uncommon: "bg-green-500/20",
  rare: "bg-blue-500/20",
  epic: "bg-purple-500/20",
  legendary: "bg-amber-500/20",
};

// ---------------------------------------------------------------------------
// TAB: Guilds
// ---------------------------------------------------------------------------

function GuildsTab({ isLight = false }: { isLight?: boolean }) {
  const guildsQ = (trpc as any).advancedGamification.getGuilds.useQuery();
  const leaderboardQ = (trpc as any).advancedGamification.getGuildLeaderboard.useQuery();
  const challengesQ = (trpc as any).advancedGamification.getGuildChallenges.useQuery();
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const detailsQ = (trpc as any).advancedGamification.getGuildDetails.useQuery(
    { guildId: selectedGuild },
    { enabled: !!selectedGuild }
  );

  if (guildsQ.isLoading) return <SectionLoading />;
  const guilds = guildsQ.data || [];
  const challenges = challengesQ.data || [];

  if (selectedGuild && detailsQ.data) {
    const g = detailsQ.data;
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="text-slate-400" onClick={() => setSelectedGuild(null)}>
          &larr; Back to Guilds
        </Button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">[{g.tag}] {g.name}</h2>
            <p className="text-slate-400 text-sm italic">"{g.motto}"</p>
          </div>
          <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/50">Rank #{g.rank}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Members" value={g.memberCount} color="bg-blue-500/20 text-blue-400" />
          <StatCard icon={Star} label="Level" value={g.level} color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={Zap} label="Weekly XP" value={(g.weeklyXp || 0).toLocaleString()} color="bg-emerald-500/20 text-emerald-400" />
          <StatCard icon={Trophy} label="Treasury" value={(g.treasury?.totalPoints || 0).toLocaleString()} color="bg-purple-500/20 text-purple-400" />
        </div>

        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader><CardTitle className="text-white text-lg">Members</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(g.members || []).map((m: any) => (
              <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                    {m.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.role} &middot; {m.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-semibold text-sm">Lvl {m.level}</p>
                  <p className="text-xs text-slate-400">{(m.xp || 0).toLocaleString()} XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader><CardTitle className="text-white text-lg">Guild Achievements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(g.achievements || []).map((a: any) => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                {a.earnedAt ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Target className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.description}</p>
                  {!a.earnedAt && <Progress value={a.progress} className="mt-1.5 h-1.5" />}
                </div>
                {a.earnedAt && <Badge variant="outline" className="text-emerald-400 border-emerald-500/50 text-xs">Earned</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guild Challenges / Wars */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-400" /> Active Guild Wars
          </h3>
          {challenges.map((c: any) => (
            <Card key={c.id} className="bg-gradient-to-r from-red-500/10 via-slate-800/50 to-blue-500/10 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <p className="text-white font-semibold mb-1">{c.title}</p>
                <p className="text-xs text-slate-400 mb-3">{c.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-red-400 font-bold">{c.guild1.name}</p>
                    <p className="text-2xl font-bold text-white">{typeof c.guild1.score === "number" ? c.guild1.score.toLocaleString() : c.guild1.score}</p>
                  </div>
                  <div className="px-4">
                    <Badge variant="outline" className="text-slate-300 border-slate-500">VS</Badge>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-blue-400 font-bold">{c.guild2.name}</p>
                    <p className="text-2xl font-bold text-white">{typeof c.guild2.score === "number" ? c.guild2.score.toLocaleString() : c.guild2.score}</p>
                  </div>
                </div>
                <p className="text-xs text-amber-400 mt-2 text-center">Reward: {c.reward}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Guild List */}
      <h3 className="text-lg font-semibold text-white">All Guilds</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {guilds.map((g: any) => (
          <Card
            key={g.id}
            className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors`}
            onClick={() => setSelectedGuild(g.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">[{g.tag}]</Badge>
                  <p className="text-white font-semibold">{g.name}</p>
                </div>
                <Badge className={cn("text-xs", g.isRecruiting ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600/30 text-slate-400")}>
                  {g.isRecruiting ? "Recruiting" : "Full"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 italic mb-3">"{g.motto}"</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span><Users className="w-3 h-3 inline mr-1" />{g.memberCount} members</span>
                <span><Star className="w-3 h-3 inline mr-1" />Level {g.level}</span>
                <span><Trophy className="w-3 h-3 inline mr-1" />Rank #{g.rank}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Prestige
// ---------------------------------------------------------------------------

function PrestigeTab({ isLight = false }: { isLight?: boolean }) {
  const prestigeQ = (trpc as any).advancedGamification.getPrestigeSystem.useQuery();
  const rewardsQ = (trpc as any).advancedGamification.getPrestigeRewards.useQuery();

  if (prestigeQ.isLoading) return <SectionLoading />;
  const p = prestigeQ.data;
  if (!p) return <EmptyState message="Prestige data unavailable" />;

  return (
    <div className="space-y-6">
      {/* Current Prestige */}
      <Card className="bg-gradient-to-br from-purple-500/20 via-slate-800/50 to-purple-900/20 border-purple-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                style={{ borderColor: p.currentLevel?.color || "#c0c0c0" }}>
                <Crown className="w-8 h-8" style={{ color: p.currentLevel?.color || "#c0c0c0" }} />
              </div>
              <Badge className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1.5">
                P{p.currentPrestige}
              </Badge>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{p.currentLevel?.name}</h2>
              <p className="text-purple-300 text-sm">Prestige Level {p.currentPrestige}</p>
              <p className="text-xs text-slate-400 mt-1">
                {p.totalXp.toLocaleString()} / {p.nextLevel?.requiredXp?.toLocaleString() || "MAX"} XP
              </p>
            </div>
          </div>
          <Progress value={p.progressPercent} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{p.currentLevel?.name}</span>
            <span>{p.progressPercent}%</span>
            <span>{p.nextLevel?.name || "MAX"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Active Bonuses */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Active Prestige Bonuses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(p.activeBonuses || []).map((b: string, i: number) => (
              <Badge key={i} className="bg-purple-500/20 text-purple-300 border-purple-500/40">{b}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Prestige Levels */}
      <h3 className="text-lg font-semibold text-white">Prestige Roadmap</h3>
      <div className="space-y-3">
        {(p.allLevels || []).map((level: any) => {
          const isUnlocked = level.level <= p.currentPrestige;
          const isCurrent = level.level === p.currentPrestige;
          return (
            <Card
              key={level.level}
              className={cn(
                "rounded-xl transition-all",
                isCurrent
                  ? "bg-purple-500/15 border-purple-500/50"
                  : isUnlocked
                    ? "bg-slate-800/50 border-emerald-500/30"
                    : "bg-slate-800/30 border-slate-700/30 opacity-70"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: level.color }}
                >
                  {isUnlocked ? (
                    <CheckCircle className="w-5 h-5" style={{ color: level.color }} />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{level.name}</p>
                    {isCurrent && <Badge className="bg-purple-600 text-white text-xs">Current</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">{level.requiredXp.toLocaleString()} XP required</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {level.bonuses.map((b: string, i: number) => (
                      <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Store
// ---------------------------------------------------------------------------

function StoreTab({ isLight = false }: { isLight?: boolean }) {
  const [category, setCategory] = useState("all");
  const storeQ = (trpc as any).advancedGamification.getRewardsStore.useQuery({ category });
  const historyQ = (trpc as any).advancedGamification.getRewardsPurchaseHistory.useQuery();

  if (storeQ.isLoading) return <SectionLoading />;
  const store = storeQ.data;
  if (!store) return <EmptyState message="Store unavailable" />;

  return (
    <div className="space-y-6">
      {/* Points Balance */}
      <Card className="bg-gradient-to-r from-amber-500/20 via-slate-800/50 to-amber-600/10 border-amber-500/30 rounded-xl">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-500/20">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Your Balance</p>
              <p className="text-3xl font-bold text-amber-400">{(store.userPoints || 0).toLocaleString()}</p>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
            Prestige {store.userPrestige}
          </Badge>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {(store.categories || []).map((cat: any) => (
          <Button
            key={cat.id}
            size="sm"
            variant={category === cat.id ? "default" : "outline"}
            className={cn(
              "rounded-full text-xs",
              category === cat.id
                ? "bg-amber-500 text-black hover:bg-amber-600"
                : "border-slate-600 text-slate-300 hover:border-amber-500/50"
            )}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name} ({cat.count})
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(store.items || []).map((item: any) => {
          const canAfford = store.userPoints >= item.cost;
          const canBuy = canAfford && item.inStock && store.userPrestige >= item.prestigeRequired;
          return (
            <Card key={item.id} className={cn(
              "rounded-xl transition-all",
              item.featured
                ? "bg-gradient-to-br from-amber-500/15 to-slate-800/50 border-amber-500/40"
                : isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-400" />
                    <p className="text-white font-semibold text-sm">{item.name}</p>
                  </div>
                  {item.featured && <Badge className="bg-amber-500 text-black text-xs">Featured</Badge>}
                </div>
                <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("font-bold", canAfford ? "text-amber-400" : "text-red-400")}>
                      {item.cost.toLocaleString()} pts
                    </p>
                    {item.prestigeRequired > 0 && (
                      <p className="text-xs text-purple-400">Prestige {item.prestigeRequired}+</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={!canBuy}
                    className={cn(
                      "rounded-lg text-xs",
                      canBuy ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-slate-700 text-slate-400"
                    )}
                  >
                    {!item.inStock ? "Out of Stock" : !canAfford ? "Not Enough" : "Redeem"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Purchase History */}
      {(historyQ.data || []).length > 0 && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader><CardTitle className="text-white text-lg">Purchase History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(historyQ.data || []).map((h: any) => (
              <div key={h.id} className={`flex items-center justify-between p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                <div>
                  <p className="text-white text-sm font-medium">{h.itemName}</p>
                  <p className="text-xs text-slate-400">{new Date(h.purchasedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 text-sm font-semibold">-{h.cost.toLocaleString()} pts</p>
                  <Badge variant="outline" className={cn("text-xs",
                    h.status === "fulfilled" ? "text-emerald-400 border-emerald-500/50" :
                    h.status === "shipped" ? "text-blue-400 border-blue-500/50" :
                    "text-slate-400 border-slate-500/50"
                  )}>
                    {h.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Events
// ---------------------------------------------------------------------------

function EventsTab({ isLight = false }: { isLight?: boolean }) {
  const eventsQ = (trpc as any).advancedGamification.getSeasonalEvents.useQuery();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const progressQ = (trpc as any).advancedGamification.getSeasonalProgress.useQuery(
    { eventId: selectedEvent! },
    { enabled: !!selectedEvent }
  );

  if (eventsQ.isLoading) return <SectionLoading />;
  const events = eventsQ.data || [];

  return (
    <div className="space-y-6">
      {events.map((evt: any) => (
        <Card
          key={evt.id}
          className={cn(
            "rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors",
            evt.status === "active"
              ? "bg-gradient-to-br from-emerald-500/15 via-slate-800/50 to-emerald-900/10 border-emerald-500/30"
              : "bg-slate-800/30 border-slate-700/30"
          )}
          onClick={() => setSelectedEvent(evt.id === selectedEvent ? null : evt.id)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full" style={{ backgroundColor: `${evt.themeColor}20` }}>
                  <Calendar className="w-5 h-5" style={{ color: evt.themeColor }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{evt.name}</h3>
                  <p className="text-xs text-slate-400">{evt.description}</p>
                </div>
              </div>
              <Badge className={cn("text-xs",
                evt.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600/30 text-slate-400"
              )}>
                {evt.status === "active" ? `${evt.daysRemaining}d left` : `Starts in ${evt.daysUntilStart}d`}
              </Badge>
            </div>

            {/* Rewards preview */}
            <div className="flex gap-2 mt-3">
              {evt.rewards.map((r: any, i: number) => (
                <Badge key={i} variant="outline" className={cn("text-xs",
                  r.tier === "gold" ? "text-amber-400 border-amber-500/50" :
                  r.tier === "silver" ? "text-slate-300 border-slate-400/50" :
                  "text-orange-300 border-orange-500/50"
                )}>
                  {r.tier}: {r.threshold}
                </Badge>
              ))}
            </div>

            {/* Progress detail if expanded */}
            {selectedEvent === evt.id && progressQ.data && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Your Progress</span>
                  <span className="text-white font-semibold">{progressQ.data.currentProgress} completed</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Rank</span>
                  <span className="text-amber-400 font-semibold">#{progressQ.data.rank} of {progressQ.data.totalParticipants}</span>
                </div>
                {progressQ.data.rewards.map((r: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={r.achieved ? "text-emerald-400" : "text-slate-400"}>
                        {r.achieved && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {r.tier.toUpperCase()}: {r.reward}
                      </span>
                      <span className="text-slate-400">{r.progress}%</span>
                    </div>
                    <Progress value={r.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Tournaments
// ---------------------------------------------------------------------------

function TournamentsTab({ isLight = false }: { isLight?: boolean }) {
  const tournamentsQ = (trpc as any).advancedGamification.getTournaments.useQuery();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const bracketQ = (trpc as any).advancedGamification.getTournamentBracket.useQuery(
    { tournamentId: selectedTournament! },
    { enabled: !!selectedTournament }
  );

  if (tournamentsQ.isLoading) return <SectionLoading />;
  const tournaments = tournamentsQ.data || [];

  return (
    <div className="space-y-6">
      {/* Tournament Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {tournaments.map((t: any) => (
          <Card
            key={t.id}
            className={cn(
              "rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors",
              t.status === "active"
                ? "bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-red-500/10 border-amber-500/30"
                : "bg-slate-800/30 border-slate-700/30"
            )}
            onClick={() => setSelectedTournament(t.id === selectedTournament ? null : t.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-bold">{t.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">{t.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="text-xs text-slate-300 border-slate-500">{t.type}</Badge>
                <Badge className={cn("text-xs",
                  t.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                )}>
                  {t.status === "active" ? "Active" : "Upcoming"}
                </Badge>
                {t.entryFee > 0 && (
                  <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/50">
                    {t.entryFee} pts entry
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span><Users className="w-3 h-3 inline mr-1" />{t.currentParticipants}/{t.maxParticipants}</span>
                <span className="text-amber-400 font-semibold">{t.prizePool}</span>
              </div>
              {t.spotsRemaining <= 10 && t.status !== "active" && (
                <p className="text-xs text-red-400 mt-2">Only {t.spotsRemaining} spots left!</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bracket View */}
      {selectedTournament && bracketQ.data && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {bracketQ.data.tournamentName} - Bracket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bracketQ.data.rounds.map((round: any) => (
              <div key={round.round}>
                <p className="text-sm font-semibold text-amber-400 mb-2">Round {round.round}</p>
                <div className="space-y-2">
                  {round.matchups.map((match: any) => (
                    <div key={match.id} className={`flex items-center gap-2 p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                      <div className={cn("flex-1 text-sm",
                        match.winner === match.player1.name ? "text-emerald-400 font-semibold" : "text-slate-300"
                      )}>
                        {match.player1.name}
                        {match.player1.score != null && <span className="text-xs text-slate-400 ml-2">({match.player1.score.toLocaleString()})</span>}
                      </div>
                      <span className="text-xs text-slate-500">vs</span>
                      <div className={cn("flex-1 text-sm text-right",
                        match.winner === match.player2.name ? "text-emerald-400 font-semibold" : "text-slate-300"
                      )}>
                        {match.player2.name}
                        {match.player2.score != null && <span className="text-xs text-slate-400 mr-2">({match.player2.score.toLocaleString()})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Achievements
// ---------------------------------------------------------------------------

function AchievementsTab({ isLight = false }: { isLight?: boolean }) {
  const [achCategory, setAchCategory] = useState("all");
  const [achRarity, setAchRarity] = useState("all");
  const [achStatus, setAchStatus] = useState("all");
  const achievementsQ = (trpc as any).advancedGamification.getAchievements.useQuery({
    category: achCategory,
    rarity: achRarity,
    status: achStatus,
  });
  const rareQ = (trpc as any).advancedGamification.getRareAchievements.useQuery();

  if (achievementsQ.isLoading) return <SectionLoading />;
  const data = achievementsQ.data;
  if (!data) return <EmptyState message="Achievements unavailable" />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Unlocked" value={data.unlocked} color="bg-amber-500/20 text-amber-400" />
        <StatCard icon={Target} label="Total" value={data.total} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Zap} label="Completion" value={`${data.completionPercent}%`} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={Diamond} label="Rare+" value={(rareQ.data || []).filter((a: any) => a.unlocked).length} color="bg-purple-500/20 text-purple-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={achCategory === "all" ? "default" : "outline"}
          className={cn("rounded-full text-xs", achCategory === "all" ? "bg-emerald-500 text-black" : "border-slate-600 text-slate-300")}
          onClick={() => setAchCategory("all")}
        >
          All
        </Button>
        {(data.categories || []).map((cat: any) => (
          <Button
            key={cat.id}
            size="sm"
            variant={achCategory === cat.id ? "default" : "outline"}
            className={cn("rounded-full text-xs", achCategory === cat.id ? "bg-emerald-500 text-black" : "border-slate-600 text-slate-300")}
            onClick={() => setAchCategory(cat.id)}
          >
            {cat.name} ({cat.unlockedCount}/{cat.count})
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        {["all", "unlocked", "locked"].map(s => (
          <Button
            key={s}
            size="sm"
            variant={achStatus === s ? "default" : "outline"}
            className={cn("rounded-full text-xs", achStatus === s ? "bg-slate-600 text-white" : "border-slate-600 text-slate-400")}
            onClick={() => setAchStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Rare Achievements Highlight */}
      {achCategory === "all" && achStatus !== "unlocked" && (rareQ.data || []).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" /> Rarest Achievements
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {(rareQ.data || []).slice(0, 6).map((ach: any) => (
              <Card key={ach.id} className={cn(
                "rounded-xl",
                ach.rarity === "legendary"
                  ? "bg-gradient-to-br from-amber-500/15 to-slate-800/50 border-amber-500/30"
                  : "bg-gradient-to-br from-purple-500/10 to-slate-800/50 border-purple-500/30"
              )}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", RARITY_BG[ach.rarity])}>
                    {ach.unlocked ? (
                      <CheckCircle className={cn("w-5 h-5", RARITY_COLORS[ach.rarity]?.split(" ")[0])} />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", RARITY_COLORS[ach.rarity]?.split(" ")[0] || "text-white")}>
                      {ach.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{ach.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-xs", RARITY_COLORS[ach.rarity])}>
                        {ach.rarity}
                      </Badge>
                      <span className="text-xs text-slate-500">{ach.unlockPercentage}% unlocked</span>
                    </div>
                  </div>
                  <p className="text-amber-400 font-semibold text-sm shrink-0">{ach.xpReward.toLocaleString()} XP</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Full Achievement Grid */}
      <div className="grid gap-2">
        {(data.achievements || []).slice(0, 50).map((ach: any) => (
          <div
            key={ach.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              ach.unlocked ? "bg-slate-700/40" : "bg-slate-800/30"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", RARITY_BG[ach.rarity])}>
              {ach.unlocked ? (
                <CheckCircle className={cn("w-4 h-4", RARITY_COLORS[ach.rarity]?.split(" ")[0])} />
              ) : (
                <Lock className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", ach.unlocked ? "text-white" : "text-slate-400")}>
                {ach.name}
              </p>
              {!ach.unlocked && (
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={(ach.progress / ach.maxProgress) * 100} className="h-1 flex-1" />
                  <span className="text-xs text-slate-500">{ach.progress}/{ach.maxProgress}</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className={cn("text-xs shrink-0", RARITY_COLORS[ach.rarity])}>
              {ach.xpReward.toLocaleString()} XP
            </Badge>
          </div>
        ))}
        {data.achievements.length > 50 && (
          <p className="text-center text-slate-400 text-sm py-4">
            Showing 50 of {data.achievements.length} achievements
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Quests
// ---------------------------------------------------------------------------

function QuestsTab({ isLight = false }: { isLight?: boolean }) {
  const dailyQ = (trpc as any).advancedGamification.getDailyQuests.useQuery();
  const weeklyQ = (trpc as any).advancedGamification.getWeeklyMissions.useQuery();
  const streakQ = (trpc as any).advancedGamification.getStreakTracker.useQuery();

  if (dailyQ.isLoading) return <SectionLoading />;

  const daily = dailyQ.data;
  const weekly = weeklyQ.data;
  const streak = streakQ.data;

  return (
    <div className="space-y-6">
      {/* Streak Tracker */}
      {streak && (
        <Card className="bg-gradient-to-r from-orange-500/15 via-slate-800/50 to-red-500/10 border-orange-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" /> Streak Tracker
              </h3>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                {streak.currentMultiplier}x Multiplier
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{streak.dailyStreak}</p>
                <p className="text-xs text-slate-400">Daily Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{streak.weeklyStreak}</p>
                <p className="text-xs text-slate-400">Weekly Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-300">{streak.bestDailyStreak}</p>
                <p className="text-xs text-slate-400">Best Daily</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-300">{streak.bestWeeklyStreak}</p>
                <p className="text-xs text-slate-400">Best Weekly</p>
              </div>
            </div>
            <div className="flex gap-1 justify-center mt-4">
              {(streak.streakHistory || []).map((d: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    d.completed ? "bg-orange-500/30 text-orange-400" : "bg-slate-700/50 text-slate-500"
                  )}
                >
                  {d.completed ? <Flame className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Quests */}
      {daily && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" /> Daily Quests
              </CardTitle>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/50">
                {daily.completedCount}/{daily.totalCount}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(daily.quests || []).map((q: any) => (
              <div key={q.id} className={cn(
                "p-3 rounded-lg flex items-center gap-3",
                q.completed ? "bg-emerald-500/10" : "bg-slate-700/30"
              )}>
                {q.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-500 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", q.completed ? "text-emerald-300 line-through" : "text-white")}>
                    {q.name}
                  </p>
                  <p className="text-xs text-slate-400">{q.description}</p>
                  {!q.completed && (
                    <Progress value={(q.progress / q.maxProgress) * 100} className="h-1.5 mt-1.5" />
                  )}
                </div>
                <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs shrink-0">
                  +{q.xpReward} XP
                </Badge>
              </div>
            ))}
            {daily.allCompleted && (
              <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                <p className="text-amber-400 font-semibold text-sm">All Quests Complete! +{daily.bonusXpForAll} Bonus XP</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Missions */}
      {weekly && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-blue-400" /> Weekly Missions
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-400 border-blue-500/50">
                  {weekly.completedCount}/{weekly.totalCount}
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Ends {new Date(weekly.weekEndsAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(weekly.missions || []).map((m: any) => (
              <div key={m.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-medium text-sm">{m.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/50">
                      Chain {m.chain}/{m.maxChain}
                    </Badge>
                    <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
                      +{m.xpReward} XP
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-2">{m.description}</p>
                <div className="flex items-center gap-2">
                  <Progress value={(m.progress / m.maxProgress) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs text-slate-400">{m.progress}/{m.maxProgress}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB: Profile
// ---------------------------------------------------------------------------

function ProfileTab({ isLight = false }: { isLight?: boolean }) {
  const profileQ = (trpc as any).advancedGamification.getDriverProfile.useQuery({});
  const customQ = (trpc as any).advancedGamification.getCustomizationOptions.useQuery();
  const milestonesQ = (trpc as any).advancedGamification.getMilestones.useQuery();
  const historyQ = (trpc as any).advancedGamification.getLeaderboardHistory.useQuery();

  if (profileQ.isLoading) return <SectionLoading />;
  const profile = profileQ.data;
  if (!profile) return <EmptyState message="Profile unavailable" />;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-blue-500/15 via-slate-800/50 to-purple-500/10 border-blue-500/20 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                {(profile.name || "D").charAt(0)}
              </div>
              <Badge className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs">
                Lvl {profile.level}
              </Badge>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">{profile.prestigeName}</Badge>
              </div>
              <p className="text-amber-400 text-sm font-medium">{profile.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {profile.guildName && <><Shield className="w-3 h-3 inline mr-1" />{profile.guildName} ({profile.guildRole})</>}
              </p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Level {profile.level}</span>
              <span>{profile.xp?.toLocaleString()} / {profile.xpToNextLevel?.toLocaleString()} XP</span>
              <span>Level {profile.level + 1}</span>
            </div>
            <Progress value={(profile.xp / profile.xpToNextLevel) * 100} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Truck} label="Total Miles" value={(profile.stats?.totalMiles || 0).toLocaleString()} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Package} label="Loads" value={profile.stats?.totalLoads || 0} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={Clock} label="On-Time" value={`${profile.stats?.onTimeRate || 0}%`} color="bg-amber-500/20 text-amber-400" />
        <StatCard icon={Shield} label="Safety" value={profile.stats?.safetyScore || 0} color="bg-purple-500/20 text-purple-400" />
      </div>

      {/* Badges */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader><CardTitle className="text-white text-lg">Badges</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(profile.badges || []).map((b: any) => (
              <Badge key={b.id} className={cn("text-sm py-1 px-3", RARITY_COLORS[b.rarity])}>
                {b.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      {milestonesQ.data && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" /> Career Milestones
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/50 ml-auto text-xs">
                {milestonesQ.data.achievedCount}/{milestonesQ.data.totalCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(milestonesQ.data.milestones || []).map((m: any) => (
              <div key={m.id} className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                m.achieved ? "bg-emerald-500/10" : "bg-slate-700/30"
              )}>
                {m.achieved ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Target className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", m.achieved ? "text-white" : "text-slate-400")}>
                    {m.name}
                  </p>
                  <p className="text-xs text-slate-500">{m.description}</p>
                </div>
                {m.achieved && m.achievedAt && (
                  <span className="text-xs text-slate-400">{new Date(m.achievedAt).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard History */}
      {historyQ.data && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Rank History
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-400 border-blue-500/50 text-xs">
                  Current: #{historyQ.data.currentRank}
                </Badge>
                <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
                  Best: #{historyQ.data.bestRank}
                </Badge>
                <Badge className={cn("text-xs",
                  historyQ.data.trend === "improving" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                  {historyQ.data.trend === "improving" ? <ArrowUp className="w-3 h-3 inline mr-1" /> : <ArrowDown className="w-3 h-3 inline mr-1" />}
                  {historyQ.data.trend}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {(historyQ.data.history || []).map((w: any, i: number) => {
                const maxRank = 50;
                const height = Math.max(10, ((maxRank - w.rank) / maxRank) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-blue-500/40 rounded-t transition-all group-hover:bg-blue-500/70"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-slate-500 mt-1 hidden md:block">
                      {new Date(w.week).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customization Options */}
      {customQ.data && (
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader><CardTitle className="text-white text-lg">Customization</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(["avatars", "frames", "titles"] as const).map(section => (
              <div key={section}>
                <p className="text-sm font-semibold text-slate-300 mb-2 capitalize">{section}</p>
                <div className="flex flex-wrap gap-2">
                  {(customQ.data[section] || []).map((item: any) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-2 rounded-lg border text-center min-w-[80px]",
                        item.equipped
                          ? "border-amber-500 bg-amber-500/10"
                          : item.owned
                            ? "border-slate-600 bg-slate-700/30 hover:border-blue-500/50 cursor-pointer"
                            : "border-slate-700 bg-slate-800/30 opacity-50"
                      )}
                    >
                      <p className="text-xs font-medium text-white">{item.name}</p>
                      {!item.owned && (
                        <p className="text-xs text-amber-400">{item.cost.toLocaleString()} pts</p>
                      )}
                      {item.equipped && <p className="text-xs text-amber-400">Equipped</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

export default function AdvancedGamification() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
          The Haul — Gamification Hub
        </h1>
        <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
          Guilds, prestige, rewards, events, tournaments, achievements, and more
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="guilds" className="w-full">
        <TabsList className={`${isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-800/70 border border-slate-700/50"} flex flex-wrap h-auto gap-1 p-1 rounded-xl`}>
          <TabsTrigger value="guilds" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg text-xs">
            <Shield className="w-3.5 h-3.5 mr-1" /> Guilds
          </TabsTrigger>
          <TabsTrigger value="prestige" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 rounded-lg text-xs">
            <Crown className="w-3.5 h-3.5 mr-1" /> Prestige
          </TabsTrigger>
          <TabsTrigger value="store" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg text-xs">
            <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Store
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 mr-1" /> Events
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg text-xs">
            <Swords className="w-3.5 h-3.5 mr-1" /> Tournaments
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-xs">
            <Trophy className="w-3.5 h-3.5 mr-1" /> Achievements
          </TabsTrigger>
          <TabsTrigger value="quests" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 rounded-lg text-xs">
            <Target className="w-3.5 h-3.5 mr-1" /> Quests
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg text-xs">
            <Users className="w-3.5 h-3.5 mr-1" /> Profile
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="guilds"><GuildsTab isLight={isLight} /></TabsContent>
          <TabsContent value="prestige"><PrestigeTab isLight={isLight} /></TabsContent>
          <TabsContent value="store"><StoreTab isLight={isLight} /></TabsContent>
          <TabsContent value="events"><EventsTab isLight={isLight} /></TabsContent>
          <TabsContent value="tournaments"><TournamentsTab isLight={isLight} /></TabsContent>
          <TabsContent value="achievements"><AchievementsTab isLight={isLight} /></TabsContent>
          <TabsContent value="quests"><QuestsTab isLight={isLight} /></TabsContent>
          <TabsContent value="profile"><ProfileTab isLight={isLight} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
