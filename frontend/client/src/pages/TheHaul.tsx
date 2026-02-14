/**
 * THE HAUL — EusoTrip Gamification Hub
 * Digital Truck Stop: Lobby chat, Missions, Rewards, Leaderboard
 */
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Trophy, Target, Gift, MessageCircle, Send, Shield, Star,
  Zap, Clock, Users, TrendingUp, Award, Flame, ChevronRight,
  MapPin, Truck, CheckCircle, Crown, RefreshCw, Package, XCircle, BrainCircuit,
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const LOBBY_RULES = [
  "Be professional and respectful at all times",
  "No profanity, slurs, or hate speech",
  "No solicitation, spam, or scams",
  "No harassment, threats, or doxxing",
  "Keep conversations relevant to freight, logistics & business",
  "This is a professional digital truck stop — act accordingly",
];

const ROLE_COLORS: Record<string, string> = {
  SHIPPER: "text-blue-400", CATALYST: "text-purple-400", BROKER: "text-cyan-400",
  DRIVER: "text-green-400", DISPATCH: "text-yellow-400", ESCORT: "text-orange-400",
};
const ROLE_BG: Record<string, string> = {
  SHIPPER: "bg-blue-500/20 text-blue-400", CATALYST: "bg-purple-500/20 text-purple-400",
  BROKER: "bg-cyan-500/20 text-cyan-400", DRIVER: "bg-green-500/20 text-green-400",
  DISPATCH: "bg-yellow-500/20 text-yellow-400", ESCORT: "bg-orange-500/20 text-orange-400",
};

export default function TheHaul() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("lobby");
  const [chatInput, setChatInput] = useState("");
  const [showRules, setShowRules] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  const profileQ = (trpc as any).gamification?.getProfile?.useQuery?.({ userId: undefined }) || { data: null, isLoading: false };
  const missionsQ = (trpc as any).gamification?.getMissions?.useQuery?.({}) || { data: null, isLoading: false };
  const aiMissionsQ = (trpc as any).gamification?.getAIMissions?.useQuery?.() || { data: null, isLoading: false };
  const lobbyQ = (trpc as any).gamification?.getLobbyMessages?.useQuery?.({ limit: 50 }) || { data: null, isLoading: false };
  const rewardsQ = (trpc as any).gamification?.getRewardsCatalog?.useQuery?.() || { data: null };
  const cratesQ = (trpc as any).gamification?.getCrates?.useQuery?.() || { data: null };
  const seasonQ = (trpc as any).gamification?.getCurrentSeason?.useQuery?.() || { data: null };
  const statsQ = (trpc as any).gamification?.getStats?.useQuery?.() || { data: null };
  const leaderboardQ = (trpc as any).gamification?.getLeaderboard?.useQuery?.({ period: "month", category: "points", limit: 20 }) || { data: null, isLoading: false };

  const postMut = (trpc as any).gamification?.postLobbyMessage?.useMutation?.({
    onSuccess: (d: any) => { if (d?.success) { setChatInput(""); lobbyQ.refetch?.(); } else if (d?.error) toast.error(d.error); },
    onError: () => toast.error("Failed to send"),
  }) || { mutate: () => {}, isPending: false };

  const startMut = (trpc as any).gamification?.startMission?.useMutation?.({
    onSuccess: (d: any, vars: any) => {
      if (d?.success === false) { toast.error(d.message || "Could not start mission"); return; }
      toast.success("Mission accepted! Complete the objective to earn rewards.", { duration: 4000 });
      missionsQ.refetch?.();
      profileQ.refetch?.();
    },
  }) || { mutate: () => {}, isPending: false };

  const claimMut = (trpc as any).gamification?.claimMissionReward?.useMutation?.({
    onSuccess: (d: any) => { if (d?.success) { toast.success(`+${d.reward?.xp || 0} XP earned!`); missionsQ.refetch?.(); profileQ.refetch?.(); } else { toast.error(d?.message || "Could not claim"); } },
  }) || { mutate: () => {}, isPending: false };

  const cancelMut = (trpc as any).gamification?.cancelMission?.useMutation?.({
    onSuccess: (d: any) => {
      if (d?.success) { toast.success(d.message || "Mission cancelled"); missionsQ.refetch?.(); profileQ.refetch?.(); }
      else { toast.error(d?.message || "Could not cancel mission"); }
    },
  }) || { mutate: () => {}, isPending: false };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lobbyQ.data?.messages]);
  useEffect(() => { const iv = setInterval(() => lobbyQ.refetch?.(), 10000); return () => clearInterval(iv); }, []);
  // Auto-refetch missions & profile when on the missions tab to show progress updates
  useEffect(() => {
    if (activeTab !== "missions") return;
    const iv = setInterval(() => { missionsQ.refetch?.(); profileQ.refetch?.(); }, 15000);
    return () => clearInterval(iv);
  }, [activeTab]);

  const [aiGenMissions, setAiGenMissions] = useState<any[]>([]);
  const [aiGenLoading, setAiGenLoading] = useState(false);

  const profile = profileQ.data;
  const msgs = lobbyQ.data?.messages || [];
  const dbM = missionsQ.data || { active: [], completed: [], available: [] };
  const aiM = aiMissionsQ.data || [];
  const allAvail = [...(dbM.available || []), ...aiM, ...aiGenMissions];
  const activeM = dbM.active || [];
  const rewards = rewardsQ.data;
  const crates = cratesQ.data || [];
  const season = seasonQ.data;
  const xpPct = profile ? ((profile.currentXp || 0) / (profile.xpToNextLevel || 1000)) * 100 : 0;

  const sendMsg = () => { if (chatInput.trim()) postMut.mutate({ message: chatInput.trim() }); };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF]"><Truck className="w-6 h-6 text-white" /></div>
            The Haul
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Your digital truck stop — find work, complete missions, earn rewards</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-600/50 hover:bg-slate-700")}
          disabled={aiGenLoading}
          onClick={async () => {
            setAiGenLoading(true);
            try {
              const result = await (trpc as any).esang.generateMissions.mutate({
                level: profile?.level || 1,
                recentActivity: (dbM.completed || []).slice(0, 3).map((m: any) => m.title || m.name || "mission"),
                completedMissions: (dbM.completed || []).slice(0, 5).map((m: any) => m.title || m.name || ""),
              });
              const generated = (result.missions || []).map((m: any, i: number) => ({
                id: `ai-gen-${Date.now()}-${i}`, title: m.title, description: m.description,
                xpReward: m.xpReward || 100, difficulty: m.difficulty || "medium",
                category: m.category || "learning", type: "ai_generated", source: "esang-ai",
              }));
              setAiGenMissions(generated);
              toast.success(`ESANG AI generated ${generated.length} personalized missions!`);
            } catch { toast.error("Mission generation unavailable"); }
            setAiGenLoading(false);
          }}
        >
          <BrainCircuit className={`w-4 h-4 mr-1.5 ${aiGenLoading ? 'animate-spin' : ''}`} />
          {aiGenLoading ? "Generating..." : "AI Missions"}
        </Button>
        {profile && (
          <div className={cn("flex items-center gap-4 px-4 py-2 rounded-xl", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-800/50 border border-slate-700/50")}>
            <div className="text-center"><p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Lv.{profile.level}</p><p className="text-[10px] text-slate-400">Level</p></div>
            <div className="w-px h-8 bg-slate-700/50" />
            <div className="text-center"><p className="text-lg font-bold text-yellow-400">{(profile.totalPoints || 0).toLocaleString()}</p><p className="text-[10px] text-slate-400">XP</p></div>
            <div className="w-px h-8 bg-slate-700/50" />
            <div className="text-center"><p className="text-lg font-bold text-cyan-400">#{profile.rank || "—"}</p><p className="text-[10px] text-slate-400">Rank</p></div>
          </div>
        )}
      </div>

      {/* XP Bar */}
      {profile && (
        <div className={cn("rounded-xl p-4", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-slate-700/50")}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Level {profile.level} Progress</span>
            <span className="text-xs text-slate-400">{profile.currentXp || 0} / {profile.xpToNextLevel || 1000} XP</span>
          </div>
          <Progress value={xpPct} className="h-2.5" />
          {season && <div className="flex items-center gap-2 mt-2"><EsangIcon className="w-3 h-3 text-purple-400" /><span className="text-[11px] text-purple-400">Season: {season.name}</span></div>}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("rounded-xl p-1", isLight ? "bg-slate-100" : "bg-slate-800/50")}>
          <TabsTrigger value="lobby" className="rounded-lg text-sm gap-1.5"><MessageCircle className="w-4 h-4" /> Lobby</TabsTrigger>
          <TabsTrigger value="missions" className="rounded-lg text-sm gap-1.5"><Target className="w-4 h-4" /> Missions</TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-lg text-sm gap-1.5"><Gift className="w-4 h-4" /> Rewards</TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-lg text-sm gap-1.5"><Trophy className="w-4 h-4" /> Leaderboard</TabsTrigger>
        </TabsList>

        {/* LOBBY */}
        <TabsContent value="lobby" className="space-y-4 mt-4">
          <div className={cn("rounded-xl border p-3", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/5 border-amber-500/20")}>
            <button onClick={() => setShowRules(!showRules)} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400" /><span className={cn("text-sm font-medium", isLight ? "text-amber-700" : "text-amber-400")}>Community Guidelines</span></div>
              <ChevronRight className={cn("w-4 h-4 text-amber-400 transition-transform", showRules && "rotate-90")} />
            </button>
            {showRules && <div className="mt-3 space-y-1.5">{LOBBY_RULES.map((r, i) => <div key={i} className="flex items-start gap-2 text-xs"><CheckCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" /><span className={isLight ? "text-amber-800" : "text-amber-300/80"}>{r}</span></div>)}</div>}
          </div>
          <Card className={cc}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><MessageCircle className="w-5 h-5 text-purple-400" />The Haul Lobby<Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Live</Badge></CardTitle>
                <Button variant="ghost" size="sm" onClick={() => lobbyQ.refetch?.()} className="text-slate-400 h-7"><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={cn("h-[400px] overflow-y-auto p-4 space-y-3", isLight ? "bg-slate-50" : "bg-slate-900/30")}>
                {lobbyQ.isLoading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                : msgs.length === 0 ? <div className="text-center py-16"><MessageCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" /><p className="text-slate-400 font-medium">Welcome to The Haul Lobby</p><p className="text-xs text-slate-500 mt-1">Be the first to start the conversation.</p></div>
                : msgs.map((m: any) => (
                  <div key={m.id} className={cn("flex gap-3 p-2.5 rounded-lg", isLight ? "hover:bg-white" : "hover:bg-slate-800/30")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold", ROLE_BG[m.userRole] || "bg-slate-500/20 text-slate-400")}>{(m.userName || "?")[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", ROLE_COLORS[m.userRole] || "text-slate-300")}>{m.userName}</span>
                        <Badge className={cn("border-0 text-[9px] px-1.5 py-0", ROLE_BG[m.userRole] || "bg-slate-500/20 text-slate-400")}>{m.userRole}</Badge>
                        <span className="text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                      <p className={cn("text-sm mt-0.5", isLight ? "text-slate-600" : "text-slate-300")}>{m.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className={cn("p-3 border-t flex gap-2", isLight ? "border-slate-200 bg-white" : "border-slate-700/50")}>
                <Input value={chatInput} onChange={(e: any) => setChatInput(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && sendMsg()} placeholder="Type a message... (keep it professional)" maxLength={500} className={cn("rounded-lg flex-1", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/50")} />
                <Button onClick={sendMsg} disabled={!chatInput.trim() || postMut.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg px-4"><Send className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MISSIONS */}
        <TabsContent value="missions" className="space-y-4 mt-4">
          {activeM.length > 0 && (
            <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Zap className="w-5 h-5 text-yellow-400" />Active Missions</CardTitle></CardHeader>
              <CardContent className="space-y-3">{activeM.map((m: any) => { const pct = m.targetValue > 0 ? (m.currentProgress / m.targetValue) * 100 : 0; return (
                <div key={m.id} className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/50")}>
                  <div className="flex items-start justify-between mb-2"><div><p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{m.name}</p><p className="text-xs text-slate-400 mt-0.5">{m.description}</p></div><div className="text-right"><p className="text-sm font-bold text-yellow-400">+{m.xpReward} XP</p><Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px]">{m.type}</Badge></div></div>
                  <div className="flex items-center gap-3"><Progress value={pct} className="flex-1 h-2" /><span className="text-xs text-slate-400">{Math.round(pct)}%</span></div>
                  <div className="flex items-center gap-2 mt-2">
                    {m.status === "completed" && <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs h-7" onClick={() => claimMut.mutate({ missionId: m.id })}><Gift className="w-3 h-3 mr-1" />Claim</Button>}
                    {(m.status === "in_progress" || m.status === "not_started") && <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7" onClick={() => { toast("Cancel this mission?", { description: "All progress will be lost.", action: { label: "Cancel Mission", onClick: () => cancelMut.mutate({ missionId: m.id }) }, cancel: { label: "Keep", onClick: () => {} }, duration: 8000 }); }}><XCircle className="w-3 h-3 mr-1" />Cancel</Button>}
                  </div>
                </div>); })}</CardContent></Card>)}

          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Target className="w-5 h-5 text-cyan-400" />Available Missions<Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px]"><EsangIcon className="w-2.5 h-2.5 mr-0.5" />AI + Shipper</Badge></CardTitle></CardHeader>
            <CardContent>{missionsQ.isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
              : allAvail.length === 0 ? <div className="text-center py-8"><Target className="w-10 h-10 text-slate-500 mx-auto mb-2" /><p className="text-slate-400">No missions available</p></div>
              : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{allAvail.map((m: any, i: number) => (
                <div key={m.id || i} className={cn("p-4 rounded-xl border relative", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/50")}>
                  {m.source === "esang_ai" && <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-[9px] text-white font-medium rounded-bl-lg">AI</div>}
                  <p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{m.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2"><Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-[10px]">{m.category}</Badge><Badge className="bg-slate-500/20 text-slate-400 border-0 text-[10px]">{m.type}</Badge>{m.hosCompliant && <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">HOS</Badge>}</div>
                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-yellow-400">+{m.xpReward} XP</span>
                      {typeof m.id === "number" && <Button size="sm" className="h-6 text-[10px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" onClick={() => startMut.mutate({ missionId: m.id })}>Start</Button>}
                    </div>
                  </div>
                </div>))}</div>}</CardContent></Card>
        </TabsContent>

        {/* REWARDS */}
        <TabsContent value="rewards" className="space-y-4 mt-4">
          {crates.length > 0 && (
            <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Package className="w-5 h-5 text-yellow-400" />Reward Crates ({crates.length})</CardTitle></CardHeader>
              <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{crates.map((c: any) => (
                <div key={c.id} className={cn("p-4 rounded-xl border text-center", isLight ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/5 border-yellow-500/20")}>
                  <Package className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className={cn("text-sm font-medium capitalize", isLight ? "text-slate-800" : "text-white")}>{c.crateType} Crate</p>
                  <p className="text-[10px] text-slate-400">{c.source}</p>
                </div>))}</div></CardContent></Card>)}

          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Gift className="w-5 h-5 text-purple-400" />Rewards Catalog</CardTitle></CardHeader>
            <CardContent>{!rewards ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{(rewards.rewards || []).map((r: any) => (
                <div key={r.id} className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/50")}>
                  <div className="flex items-start justify-between"><div><p className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{r.name}</p><p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p></div><Star className="w-4 h-4 text-yellow-400 flex-shrink-0" /></div>
                  <div className="flex items-center justify-between mt-3"><Badge className="bg-purple-500/20 text-purple-400 border-0 text-[10px]">{r.category}</Badge><span className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{r.pointsCost?.toLocaleString()} pts</span></div>
                </div>))}</div>}</CardContent></Card>
        </TabsContent>

        {/* LEADERBOARD */}
        <TabsContent value="leaderboard" className="space-y-4 mt-4">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Trophy className="w-5 h-5 text-yellow-400" />Platform Leaderboard</CardTitle></CardHeader>
            <CardContent>
              {profile ? (
                <div className={cn("p-4 rounded-xl border mb-4", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-slate-700/50")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Crown className="w-6 h-6 text-yellow-400" /><div><p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{profile.name}</p><p className="text-xs text-slate-400">Your Position</p></div></div>
                    <div className="flex items-center gap-6">
                      <div className="text-center"><p className="text-xl font-bold text-cyan-400">#{profile.rank || "—"}</p><p className="text-[10px] text-slate-400">Rank</p></div>
                      <div className="text-center"><p className="text-xl font-bold text-yellow-400">{(profile.totalPoints || 0).toLocaleString()}</p><p className="text-[10px] text-slate-400">XP</p></div>
                      <div className="text-center"><p className="text-xl font-bold text-purple-400">Top {Math.round(100 - (profile.percentile || 0))}%</p><p className="text-[10px] text-slate-400">Percentile</p></div>
                    </div>
                  </div>
                </div>
              ) : null}
              {leaderboardQ.isLoading ? <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
              : (leaderboardQ.data?.leaders || []).length === 0 ? <div className="text-center py-8"><Users className="w-10 h-10 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 font-medium">Leaderboard updates weekly</p><p className="text-xs text-slate-500 mt-1">Complete missions and earn XP to climb the ranks</p></div>
              : <div className="space-y-2">{(leaderboardQ.data?.leaders || []).map((l: any) => (
                <div key={l.userId} className={cn("flex items-center gap-3 p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/50")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", l.rank === 1 ? "bg-yellow-500/20 text-yellow-400" : l.rank === 2 ? "bg-slate-300/20 text-slate-300" : l.rank === 3 ? "bg-orange-500/20 text-orange-400" : "bg-slate-500/10 text-slate-400")}>{l.rank <= 3 ? ["1st","2nd","3rd"][l.rank-1] : `#${l.rank}`}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className={cn("font-medium text-sm truncate", isLight ? "text-slate-800" : "text-white")}>{l.name}</p><Badge className={cn("border-0 text-[9px] px-1.5 py-0", ROLE_BG[l.role] || "bg-slate-500/20 text-slate-400")}>{l.role}</Badge></div>
                    <p className="text-[10px] text-slate-400">Lv.{l.level} · {l.missionsCompleted} missions</p>
                  </div>
                  <div className="text-right"><p className="text-sm font-bold text-yellow-400">{(l.totalXp || 0).toLocaleString()}</p><p className="text-[10px] text-slate-400">XP</p></div>
                </div>))}</div>}
              {leaderboardQ.data?.totalParticipants > 0 && <p className="text-center text-[10px] text-slate-500 mt-3">{leaderboardQ.data.totalParticipants} total participants</p>}
            </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
