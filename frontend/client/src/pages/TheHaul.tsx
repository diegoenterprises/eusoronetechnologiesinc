/**
 * THE HAUL — EusoTrip Gamification Hub
 * Digital Truck Stop: Live Lobby, Missions, Rewards, Leaderboard
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Zap, Clock, Users, TrendingUp, Award, Flame, ChevronRight, ChevronDown,
  MapPin, Truck, CheckCircle, Crown, RefreshCw, Package, XCircle, BrainCircuit,
  Activity, Radio, Wifi, Navigation, Sparkles, Timer, Hash,
  AlertTriangle, ArrowUp, ArrowDown, Minus, Circle, Box, Fuel,
  Medal, Gem, Swords, BarChart3, Eye, Volume2,
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

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
  TERMINAL_MANAGER: "text-pink-400", FACTORING: "text-emerald-400",
  COMPLIANCE_OFFICER: "text-red-400", SAFETY_MANAGER: "text-amber-400",
  ADMIN: "text-rose-400", SUPER_ADMIN: "text-rose-400",
};

const ROLE_BG: Record<string, string> = {
  SHIPPER: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CATALYST: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  BROKER: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  DRIVER: "bg-green-500/15 text-green-400 border-green-500/20",
  DISPATCH: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  ESCORT: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  TERMINAL_MANAGER: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  FACTORING: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  COMPLIANCE_OFFICER: "bg-red-500/15 text-red-400 border-red-500/20",
  SAFETY_MANAGER: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  ADMIN: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  SUPER_ADMIN: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const ROLE_AVATAR_GRADIENT: Record<string, string> = {
  SHIPPER: "from-blue-500 to-blue-700", CATALYST: "from-purple-500 to-purple-700",
  BROKER: "from-cyan-500 to-cyan-700", DRIVER: "from-green-500 to-green-700",
  DISPATCH: "from-yellow-500 to-yellow-700", ESCORT: "from-orange-500 to-orange-700",
  TERMINAL_MANAGER: "from-pink-500 to-pink-700", FACTORING: "from-emerald-500 to-emerald-700",
};

const ROLE_LABEL: Record<string, string> = {
  SHIPPER: "Shipper", CATALYST: "Carrier", BROKER: "Broker", DRIVER: "Driver",
  DISPATCH: "Dispatch", ESCORT: "Escort", TERMINAL_MANAGER: "Terminal",
  FACTORING: "Factoring", COMPLIANCE_OFFICER: "Compliance", SAFETY_MANAGER: "Safety",
  ADMIN: "Admin", SUPER_ADMIN: "Admin",
};

const DIFFICULTY_MAP: Record<string, { label: string; color: string; stars: number }> = {
  daily: { label: "Daily", color: "text-green-400 bg-green-500/15", stars: 1 },
  weekly: { label: "Weekly", color: "text-blue-400 bg-blue-500/15", stars: 2 },
  monthly: { label: "Monthly", color: "text-purple-400 bg-purple-500/15", stars: 3 },
  epic: { label: "Epic", color: "text-yellow-400 bg-yellow-500/15", stars: 4 },
  seasonal: { label: "Seasonal", color: "text-orange-400 bg-orange-500/15", stars: 4 },
};

const CRATE_COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-slate-400/30", bg: "bg-slate-500/10", text: "text-slate-300", glow: "" },
  uncommon: { border: "border-green-400/30", bg: "bg-green-500/10", text: "text-green-400", glow: "shadow-green-500/10" },
  rare: { border: "border-blue-400/30", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-blue-500/10" },
  epic: { border: "border-purple-400/30", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-purple-500/20" },
  legendary: { border: "border-yellow-400/30", bg: "bg-yellow-500/10", text: "text-yellow-400", glow: "shadow-yellow-500/20" },
  mythic: { border: "border-red-400/30", bg: "bg-red-500/10", text: "text-red-400", glow: "shadow-red-500/20" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatPill({ icon, value, label, color, isLight }: { icon: React.ReactNode; value: string | number; label: string; color: string; isLight: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/40")}>
      <div className={cn("p-1.5 rounded-lg", color)}>{icon}</div>
      <div>
        <p className={cn("text-sm font-bold leading-none", isLight ? "text-slate-800" : "text-white")}>{value}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function MissionCard({ m, isLight, onStart, onClaim, onCancel, startPending, claimPending }: {
  m: any; isLight: boolean; onStart?: () => void; onClaim?: () => void; onCancel?: () => void;
  startPending?: boolean; claimPending?: boolean;
}) {
  const pct = m.targetValue > 0 ? Math.min((m.currentProgress / m.targetValue) * 100, 100) : 0;
  const isActive = m.status === "in_progress" || m.status === "not_started";
  const isComplete = m.status === "completed";
  const diff = DIFFICULTY_MAP[m.type] || DIFFICULTY_MAP.weekly;

  return (
    <div className={cn(
      "group relative p-4 rounded-xl border transition-all",
      isActive && "ring-1 ring-yellow-500/20",
      isComplete && "ring-1 ring-green-500/20",
      isLight ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60",
    )}>
      {m.source === "esang_ai" && (
        <div className="absolute -top-px -right-px px-2 py-0.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-[9px] text-white font-semibold rounded-bl-lg rounded-tr-xl">
          <BrainCircuit className="w-2.5 h-2.5 inline mr-0.5" />AI
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm leading-tight", isLight ? "text-slate-800" : "text-white")}>{m.name}</p>
          <p className={cn("text-xs mt-1 line-clamp-2", isLight ? "text-slate-500" : "text-slate-400")}>{m.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-yellow-400">+{m.xpReward}<span className="text-[10px] font-normal ml-0.5">XP</span></p>
          <Badge className={cn("border text-[9px] mt-1", diff.color)}>{diff.label}</Badge>
        </div>
      </div>

      {/* Cargo / Hazmat badges */}
      {(m.cargoType || m.equipmentType || (m.category && /tanker|hazmat|liquid|bulk/i.test(m.category))) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {m.equipmentType && <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-[9px]"><Truck className="w-2.5 h-2.5 mr-0.5" />{(m.equipmentType || "").replace(/_/g, " ")}</Badge>}
          {m.cargoType && <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[9px]"><Package className="w-2.5 h-2.5 mr-0.5" />{m.cargoType}</Badge>}
          {m.category && /hazmat/i.test(m.category) && <Badge className="bg-red-500/10 text-red-300 border-red-500/20 text-[9px]"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Hazmat</Badge>}
        </div>
      )}

      {/* Progress bar for active missions */}
      {(isActive || isComplete) && m.targetValue > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">{m.currentProgress || 0} / {m.targetValue}</span>
            <span className={cn("text-[10px] font-semibold", pct >= 100 ? "text-green-400" : "text-blue-400")}>{Math.round(pct)}%</span>
          </div>
          <div className={cn("h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-slate-700/50")}>
            <div className={cn("h-full rounded-full transition-all duration-500", pct >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]")} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Category + action buttons */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <Badge className={cn("border text-[9px]", isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-slate-700/50 text-slate-400 border-slate-600/50")}>{m.category}</Badge>
          {m.hosCompliant && <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px]">HOS</Badge>}
        </div>
        <div className="flex items-center gap-1.5">
          {isComplete && onClaim && (
            <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white shadow-sm" onClick={onClaim} disabled={claimPending}>
              <Gift className="w-3 h-3 mr-1" />Claim
            </Button>
          )}
          {!isActive && !isComplete && onStart && typeof m.id === "number" && m.id > 0 && (
            <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white shadow-sm" onClick={onStart} disabled={startPending}>
              <Zap className="w-3 h-3 mr-1" />Accept
            </Button>
          )}
          {isActive && onCancel && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={onCancel}>
              <XCircle className="w-3 h-3 mr-1" />Drop
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TheHaul() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("lobby");
  const [lbScope, setLbScope] = useState<"own" | "all">("own");
  const [chatInput, setChatInput] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [missionFilter, setMissionFilter] = useState("all");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Shared card classes
  const cc = cn("rounded-xl border backdrop-blur-sm", isLight ? "bg-white/80 border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/40");

  // ─── Queries ──────────────────────────────────────────────────────────────

  const profileQ = (trpc as any).gamification?.getProfile?.useQuery?.({ userId: undefined }) || { data: null, isLoading: false };
  const missionsQ = (trpc as any).gamification?.getMissions?.useQuery?.({}) || { data: null, isLoading: false };
  const aiMissionsQ = (trpc as any).gamification?.getAIMissions?.useQuery?.() || { data: null, isLoading: false };
  const lobbyQ = (trpc as any).gamification?.getLobbyMessages?.useQuery?.({ limit: 80 }) || { data: null, isLoading: false };
  const rewardsQ = (trpc as any).gamification?.getRewardsCatalog?.useQuery?.() || { data: null };
  const cratesQ = (trpc as any).gamification?.getCrates?.useQuery?.() || { data: null };
  const seasonQ = (trpc as any).gamification?.getCurrentSeason?.useQuery?.() || { data: null };
  const statsQ = (trpc as any).gamification?.getStats?.useQuery?.() || { data: null };
  const leaderboardQ = (trpc as any).gamification?.getLeaderboard?.useQuery?.(
    { period: "month", category: "points", limit: 25, roleFilter: lbScope },
    { keepPreviousData: true }
  ) || { data: null, isLoading: false };
  const inventoryQ = (trpc as any).gamification?.getInventory?.useQuery?.() || { data: null };
  const badgesQ = (trpc as any).gamification?.getBadges?.useQuery?.() || { data: null };

  // ─── Mutations ────────────────────────────────────────────────────────────

  const postMut = (trpc as any).gamification?.postLobbyMessage?.useMutation?.({
    onSuccess: (d: any) => {
      if (d?.success) { setChatInput(""); lobbyQ.refetch?.(); setAutoScroll(true); }
      else if (d?.error) toast.error(d.error);
    },
    onError: () => toast.error("Failed to send"),
  }) || { mutate: () => {}, isPending: false };

  const startMut = (trpc as any).gamification?.startMission?.useMutation?.({
    onSuccess: (d: any) => {
      if (d?.success === false) { toast.error(d.message || "Could not start mission"); return; }
      toast.success("Mission accepted!", { description: "Complete the objective to earn rewards." });
      missionsQ.refetch?.(); profileQ.refetch?.();
    },
  }) || { mutate: () => {}, isPending: false };

  const claimMut = (trpc as any).gamification?.claimMissionReward?.useMutation?.({
    onSuccess: (d: any) => {
      if (d?.success) {
        toast.success(`+${d.reward?.xp || 0} XP earned!`, { description: `${d.reward?.type || "Reward"}: ${d.reward?.value || ""}` });
        missionsQ.refetch?.(); profileQ.refetch?.(); cratesQ.refetch?.();
      } else toast.error(d?.message || "Could not claim");
    },
  }) || { mutate: () => {}, isPending: false };

  const cancelMut = (trpc as any).gamification?.cancelMission?.useMutation?.({
    onSuccess: (d: any) => {
      if (d?.success) { toast.success("Mission dropped"); missionsQ.refetch?.(); profileQ.refetch?.(); }
      else toast.error(d?.message || "Could not cancel");
    },
  }) || { mutate: () => {}, isPending: false };

  const refreshMut = (trpc as any).gamification?.refreshMissions?.useMutation?.({
    onSuccess: (d: any) => {
      missionsQ.refetch?.(); aiMissionsQ.refetch?.();
      if (d?.created > 0) toast.success(`${d.created} new missions rotated in!`);
      else toast.success("Missions refreshed");
    },
    onError: () => toast.error("Could not rotate missions"),
  }) || { mutateAsync: async () => ({ created: 0 }), isPending: false };

  const openCrateMut = (trpc as any).gamification?.openCrate?.useMutation?.({
    onSuccess: (d: any) => {
      if (d?.success) {
        const contents = d.contents || [];
        const desc = contents.map((c: any) => `${c.name}: ${c.value}`).join(", ");
        toast.success("Crate opened!", { description: desc || "Rewards added to your account" });
        cratesQ.refetch?.(); profileQ.refetch?.();
      }
    },
    onError: () => toast.error("Could not open crate"),
  }) || { mutate: () => {}, isPending: false };

  const redeemMut = (trpc as any).gamification?.redeemReward?.useMutation?.({
    onSuccess: (d: any) => {
      toast.success("Reward redeemed!", { description: `${d.pointsDeducted} points spent. ${d.remainingPoints?.toLocaleString()} remaining.` });
      rewardsQ.refetch?.(); profileQ.refetch?.();
    },
    onError: (e: any) => toast.error("Redemption failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Auto-scroll chat on new messages
  useEffect(() => {
    if (autoScroll) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lobbyQ.data?.messages, autoScroll]);

  // Detect manual scroll-up to pause auto-scroll
  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
  }, []);

  // Poll lobby messages
  useEffect(() => {
    const iv = setInterval(() => lobbyQ.refetch?.(), 8000);
    return () => clearInterval(iv);
  }, []);

  // Poll missions when on missions tab
  useEffect(() => {
    if (activeTab !== "missions") return;
    const iv = setInterval(() => { missionsQ.refetch?.(); profileQ.refetch?.(); }, 15000);
    return () => clearInterval(iv);
  }, [activeTab]);

  // AI generated missions
  const [aiGenMissions, setAiGenMissions] = useState<any[]>([]);
  const [aiGenLoading, setAiGenLoading] = useState(false);

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const profile = profileQ.data;
  const msgs = lobbyQ.data?.messages || [];
  const dbM = missionsQ.data || { active: [], completed: [], available: [] };
  const aiM = aiMissionsQ.data || [];

  // Deduplicate available missions by name
  const seenNames = new Set<string>();
  const seenIds = new Set<number | string>();
  const allAvail = [...(dbM.available || []), ...aiM, ...aiGenMissions].filter(m => {
    const nameKey = (m.name || "").trim().toLowerCase();
    const idKey = m.id;
    if (seenNames.has(nameKey) || seenIds.has(idKey)) return false;
    seenNames.add(nameKey);
    seenIds.add(idKey);
    return true;
  });

  // Filter missions
  const filteredAvail = missionFilter === "all" ? allAvail : allAvail.filter(m => m.type === missionFilter || m.category === missionFilter);
  const activeM = dbM.active || [];
  const completedM = dbM.completed || [];
  const rewards = rewardsQ.data;
  const crates = cratesQ.data || [];
  const season = seasonQ.data;
  const xpPct = profile ? ((profile.currentXp || 0) / (profile.xpToNextLevel || 1000)) * 100 : 0;
  const displayBadges = badgesQ.data?.displayBadges || [];

  // Compute unique online users from recent messages (last hour)
  const recentUsers = new Map<number, { name: string; role: string }>();
  const oneHourAgo = Date.now() - 3600000;
  msgs.forEach((m: any) => {
    if (new Date(m.createdAt).getTime() > oneHourAgo) {
      recentUsers.set(m.userId, { name: m.userName, role: m.userRole });
    }
  });

  const sendMsg = () => {
    if (chatInput.trim()) {
      postMut.mutate({ message: chatInput.trim() });
    }
  };

  const handleAIGenerate = async () => {
    setAiGenLoading(true);
    try {
      const result = await (trpc as any).esang.generateMissions.mutate({
        level: profile?.level || 1,
        recentActivity: (completedM).slice(0, 3).map((m: any) => m.title || m.name || "mission"),
        completedMissions: (completedM).slice(0, 5).map((m: any) => m.title || m.name || ""),
      });
      const generated = (result.missions || []).map((m: any, i: number) => ({
        id: `ai-gen-${Date.now()}-${i}`, name: m.title, description: m.description,
        xpReward: m.xpReward || 100, difficulty: m.difficulty || "medium",
        category: m.category || "learning", type: "ai_generated", source: "esang-ai",
      }));
      if (generated.length > 0) {
        setAiGenMissions(generated);
        toast.success(`ESANG generated ${generated.length} personalized missions`);
      } else {
        await refreshMut.mutateAsync({});
      }
    } catch {
      try { await refreshMut.mutateAsync({}); } catch {}
    }
    setAiGenLoading(false);
  };

  const confirmCancel = (missionId: number) => {
    toast("Drop this mission?", {
      description: "All progress will be lost.",
      action: { label: "Drop Mission", onClick: () => cancelMut.mutate({ missionId }) },
      cancel: { label: "Keep", onClick: () => {} },
      duration: 6000,
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-5", isLight ? "bg-slate-50" : "")}>
      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] shadow-lg shadow-purple-500/20">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              The Haul
            </h1>
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
              Digital truck stop — chat, missions, rewards
              {season && <span className="ml-2 text-purple-400">· {season.name}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ STAT STRIP ═══ */}
      {profile && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatPill icon={<Sparkles className="w-4 h-4 text-yellow-400" />} value={`Lv.${profile.level}`} label="Level" color={isLight ? "bg-yellow-50" : "bg-yellow-500/10"} isLight={isLight} />
          <StatPill icon={<Zap className="w-4 h-4 text-cyan-400" />} value={(profile.totalPoints || 0).toLocaleString()} label="Total XP" color={isLight ? "bg-cyan-50" : "bg-cyan-500/10"} isLight={isLight} />
          <StatPill icon={<Crown className="w-4 h-4 text-purple-400" />} value={profile.rank ? `#${profile.rank}` : "—"} label="Rank" color={isLight ? "bg-purple-50" : "bg-purple-500/10"} isLight={isLight} />
          <StatPill icon={<Flame className="w-4 h-4 text-orange-400" />} value={profile.streaks?.current || 0} label="Day Streak" color={isLight ? "bg-orange-50" : "bg-orange-500/10"} isLight={isLight} />
          <StatPill icon={<Target className="w-4 h-4 text-green-400" />} value={activeM.length} label="Active" color={isLight ? "bg-green-50" : "bg-green-500/10"} isLight={isLight} />
          {displayBadges.length > 0 && (
            <div className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/40")}>
              {displayBadges.map((b: any) => (
                <div key={b.id} title={b.name} className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-yellow-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* XP Progress */}
      {profile && (
        <div className={cn("rounded-xl px-4 py-3", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50" : "bg-gradient-to-r from-[#1473FF]/8 to-[#BE01FF]/8 border border-slate-700/30")}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={cn("text-xs font-medium", isLight ? "text-slate-600" : "text-slate-300")}>Level {profile.level} → {profile.level + 1}</span>
            <span className="text-[11px] text-slate-400">{(profile.currentXp || 0).toLocaleString()} / {(profile.xpToNextLevel || 1000).toLocaleString()} XP</span>
          </div>
          <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-blue-100" : "bg-slate-700/50")}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] transition-all duration-700" style={{ width: `${Math.min(xpPct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("rounded-xl p-1 h-auto flex-wrap", isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-800/60 border border-slate-700/30")}>
          <TabsTrigger value="lobby" className="rounded-lg text-sm gap-1.5 data-[state=active]:shadow-sm">
            <MessageCircle className="w-4 h-4" />Lobby
            {msgs.length > 0 && <span className={cn("text-[9px] px-1.5 py-0 rounded-full font-semibold", isLight ? "bg-green-100 text-green-600" : "bg-green-500/20 text-green-400")}>{recentUsers.size}</span>}
          </TabsTrigger>
          <TabsTrigger value="missions" className="rounded-lg text-sm gap-1.5 data-[state=active]:shadow-sm">
            <Target className="w-4 h-4" />Missions
            {activeM.length > 0 && <span className={cn("text-[9px] px-1.5 py-0 rounded-full font-semibold", isLight ? "bg-yellow-100 text-yellow-600" : "bg-yellow-500/20 text-yellow-400")}>{activeM.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="rewards" className="rounded-lg text-sm gap-1.5 data-[state=active]:shadow-sm">
            <Gift className="w-4 h-4" />Rewards
            {crates.length > 0 && <span className={cn("text-[9px] px-1.5 py-0 rounded-full font-semibold", isLight ? "bg-purple-100 text-purple-600" : "bg-purple-500/20 text-purple-400")}>{crates.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-lg text-sm gap-1.5 data-[state=active]:shadow-sm">
            <Trophy className="w-4 h-4" />Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ LOBBY TAB ═══════════ */}
        <TabsContent value="lobby" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Chat Main */}
            <div className="lg:col-span-3 space-y-3">
              {/* Guidelines */}
              <button onClick={() => setShowRules(!showRules)} className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-left",
                isLight ? "bg-amber-50 border-amber-200 hover:bg-amber-100/80" : "bg-amber-500/5 border-amber-500/15 hover:bg-amber-500/10"
              )}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className={cn("text-xs font-medium", isLight ? "text-amber-700" : "text-amber-400")}>Community Guidelines</span>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-amber-400 transition-transform", showRules && "rotate-180")} />
              </button>
              {showRules && (
                <div className={cn("px-4 py-3 rounded-xl border space-y-1.5", isLight ? "bg-amber-50/50 border-amber-200/60" : "bg-amber-500/5 border-amber-500/10")}>
                  {LOBBY_RULES.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-amber-400 font-bold mt-px">{i + 1}.</span>
                      <span className={isLight ? "text-amber-800" : "text-amber-300/80"}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Card */}
              <Card className={cn(cc, "overflow-hidden")}>
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        The Haul Lobby
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] text-green-400 font-medium">{recentUsers.size} active</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { lobbyQ.refetch?.(); setAutoScroll(true); }} className="text-slate-400 h-7 w-7 p-0">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    onScroll={handleChatScroll}
                    className={cn("h-[480px] overflow-y-auto px-4 py-3 space-y-1", isLight ? "bg-slate-50/50" : "bg-slate-900/20")}
                  >
                    {lobbyQ.isLoading ? (
                      <div className="space-y-3 py-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                    ) : msgs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className={cn("p-5 rounded-2xl mb-4", isLight ? "bg-slate-100" : "bg-slate-800/50")}>
                          <MessageCircle className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Welcome to The Haul</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                          The digital truck stop for the freight industry. Talk shop, share tips, and connect with haulers across the network.
                        </p>
                      </div>
                    ) : (
                      <>
                        {msgs.map((m: any, idx: number) => {
                          const prev = idx > 0 ? msgs[idx - 1] : null;
                          const sameUser = prev?.userId === m.userId;
                          const showDate = !prev || new Date(m.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
                          const isSystem = m.messageType === "system" || m.messageType === "achievement" || m.messageType === "mission_alert";

                          return (
                            <React.Fragment key={m.id}>
                              {showDate && (
                                <div className="flex items-center gap-3 py-3">
                                  <div className={cn("flex-1 h-px", isLight ? "bg-slate-200" : "bg-slate-700/50")} />
                                  <span className="text-[10px] text-slate-500 font-medium">{new Date(m.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                                  <div className={cn("flex-1 h-px", isLight ? "bg-slate-200" : "bg-slate-700/50")} />
                                </div>
                              )}
                              {isSystem ? (
                                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg my-1", isLight ? "bg-purple-50" : "bg-purple-500/5")}>
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                  <p className="text-xs text-purple-400">{m.message}</p>
                                </div>
                              ) : (
                                <div className={cn("flex gap-3 py-1.5 px-2 rounded-lg transition-colors", !sameUser && "mt-2", isLight ? "hover:bg-white" : "hover:bg-slate-800/30")}>
                                  {/* Avatar */}
                                  {!sameUser ? (
                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white bg-gradient-to-br shadow-sm", ROLE_AVATAR_GRADIENT[m.userRole] || "from-slate-500 to-slate-700")}>
                                      {(m.userName || "?")[0].toUpperCase()}
                                    </div>
                                  ) : (
                                    <div className="w-9 flex-shrink-0" />
                                  )}

                                  <div className="flex-1 min-w-0">
                                    {!sameUser && (
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className={cn("text-sm font-semibold", ROLE_COLORS[m.userRole] || "text-slate-300")}>{m.userName}</span>
                                        <Badge className={cn("border text-[8px] px-1 py-0 font-semibold", ROLE_BG[m.userRole] || "bg-slate-500/15 text-slate-400 border-slate-500/20")}>
                                          {ROLE_LABEL[m.userRole] || m.userRole}
                                        </Badge>
                                        <span className="text-[10px] text-slate-500">{formatTime(m.createdAt)}</span>
                                      </div>
                                    )}
                                    <p className={cn("text-[13px] leading-relaxed break-words", isLight ? "text-slate-700" : "text-slate-200")}>{m.message}</p>
                                  </div>

                                  {sameUser && (
                                    <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 self-center flex-shrink-0">{formatTime(m.createdAt)}</span>
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </>
                    )}

                    {/* Scroll to bottom indicator */}
                    {!autoScroll && msgs.length > 0 && (
                      <button
                        onClick={() => { setAutoScroll(true); chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                        className={cn("sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg z-10 flex items-center gap-1.5", isLight ? "bg-white text-slate-600 border border-slate-200" : "bg-slate-700 text-slate-200 border border-slate-600")}
                      >
                        <ChevronDown className="w-3 h-3" />New messages
                      </button>
                    )}
                  </div>

                  {/* Input */}
                  <div className={cn("px-4 py-3 border-t flex gap-2", isLight ? "border-slate-200 bg-white" : "border-slate-700/30 bg-slate-800/30")}>
                    <Input
                      ref={inputRef}
                      value={chatInput}
                      onChange={(e: any) => setChatInput(e.target.value)}
                      onKeyDown={(e: any) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                      placeholder="Message The Haul..."
                      maxLength={500}
                      className={cn("rounded-xl flex-1 h-10", isLight ? "bg-slate-50 border-slate-200 focus:bg-white" : "bg-slate-900/30 border-slate-700/50 focus:bg-slate-800/50")}
                    />
                    <Button
                      onClick={sendMsg}
                      disabled={!chatInput.trim() || postMut.isPending}
                      className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-xl px-4 h-10 shadow-sm shadow-purple-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar — Who's Active */}
            <div className="space-y-3">
              <Card className={cc}>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-200")}>
                    <Users className="w-4 h-4 text-green-400" />
                    Active Now
                    <span className="text-[10px] text-slate-400 font-normal">({recentUsers.size})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {recentUsers.size === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No recent activity</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {Array.from(recentUsers.entries()).map(([userId, u]) => (
                        <div key={userId} className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30")}>
                          <div className="relative">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br", ROLE_AVATAR_GRADIENT[u.role] || "from-slate-500 to-slate-700")}>
                              {(u.name || "?")[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-slate-800" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-xs font-medium truncate", isLight ? "text-slate-700" : "text-slate-200")}>{u.name}</p>
                            <p className={cn("text-[10px]", ROLE_COLORS[u.role] || "text-slate-400")}>{ROLE_LABEL[u.role] || u.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {statsQ.data && (
                <Card className={cc}>
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-200")}>
                      <BarChart3 className="w-4 h-4 text-cyan-400" />Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {[
                      { label: "Missions Done", value: statsQ.data.earned || 0, icon: <CheckCircle className="w-3.5 h-3.5 text-green-400" /> },
                      { label: "In Progress", value: statsQ.data.inProgress || 0, icon: <Clock className="w-3.5 h-3.5 text-yellow-400" /> },
                      { label: "Badges Earned", value: statsQ.data.totalBadges || 0, icon: <Award className="w-3.5 h-3.5 text-purple-400" /> },
                      { label: "Total Points", value: (statsQ.data.points || 0).toLocaleString(), icon: <Zap className="w-3.5 h-3.5 text-cyan-400" /> },
                    ].map(s => (
                      <div key={s.label} className={cn("flex items-center justify-between px-2.5 py-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/20")}>
                        <div className="flex items-center gap-2">
                          {s.icon}
                          <span className="text-[11px] text-slate-400">{s.label}</span>
                        </div>
                        <span className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-white")}>{s.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════ MISSIONS TAB ═══════════ */}
        <TabsContent value="missions" className="space-y-4 mt-4">
          {/* Mission toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                { key: "all", label: "All" },
                { key: "daily", label: "Daily" },
                { key: "weekly", label: "Weekly" },
                { key: "monthly", label: "Monthly" },
                { key: "epic", label: "Epic" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setMissionFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    missionFilter === f.key
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm"
                      : isLight ? "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:bg-slate-700/50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn("rounded-xl gap-1.5", isLight ? "border-slate-200" : "border-slate-600/50")}
              disabled={aiGenLoading || refreshMut.isPending}
              onClick={handleAIGenerate}
            >
              <BrainCircuit className={cn("w-4 h-4", aiGenLoading && "animate-spin")} />
              {aiGenLoading ? "Generating..." : "AI Missions"}
            </Button>
          </div>

          {/* Active Missions */}
          {activeM.length > 0 && (
            <div>
              <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-200")}>
                <Zap className="w-4 h-4 text-yellow-400" />
                Active Missions
                <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px]">{activeM.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeM.map((m: any) => (
                  <MissionCard
                    key={m.id} m={m} isLight={isLight}
                    onClaim={() => claimMut.mutate({ missionId: m.id })}
                    onCancel={() => confirmCancel(m.id)}
                    claimPending={claimMut.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Missions */}
          <div>
            <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-200")}>
              <Target className="w-4 h-4 text-cyan-400" />
              Available Missions
              <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/20 text-[10px]">{filteredAvail.length}</Badge>
            </h3>
            {missionsQ.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
            ) : filteredAvail.length === 0 ? (
              <div className={cn("text-center py-12 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/30 border-slate-700/40")}>
                <Target className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No missions available</p>
                <p className="text-xs text-slate-500 mt-1">Try a different filter or generate AI missions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAvail.map((m: any, i: number) => (
                  <MissionCard
                    key={m.id || i} m={m} isLight={isLight}
                    onStart={() => startMut.mutate({ missionId: Number(m.id) })}
                    startPending={startMut.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed Missions (collapsed by default) */}
          {completedM.length > 0 && (
            <details className="group">
              <summary className={cn("text-sm font-semibold flex items-center gap-2 cursor-pointer select-none", isLight ? "text-slate-500" : "text-slate-400")}>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                Completed ({completedM.length})
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {completedM.slice(0, 6).map((m: any) => (
                  <div key={m.id} className={cn("p-3 rounded-xl border opacity-60", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/20 border-slate-700/30")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className={cn("text-sm font-medium", isLight ? "text-slate-600" : "text-slate-300")}>{m.name}</span>
                      </div>
                      <span className="text-xs text-yellow-400 font-bold">+{m.xpReward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </TabsContent>

        {/* ═══════════ REWARDS TAB ═══════════ */}
        <TabsContent value="rewards" className="space-y-4 mt-4">
          {/* Points summary */}
          {rewards && (
            <div className={cn("p-5 rounded-xl border", isLight ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200/50" : "bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border-yellow-500/15")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-yellow-500/15">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>{(rewards.availablePoints || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Available Points</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crates */}
          {crates.length > 0 && (
            <div>
              <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-200")}>
                <Package className="w-4 h-4 text-yellow-400" />
                Reward Crates
                <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px]">{crates.length}</Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {crates.map((c: any) => {
                  const style = CRATE_COLORS[c.crateType] || CRATE_COLORS.common;
                  return (
                    <div key={c.id} className={cn("p-4 rounded-xl border text-center transition-all hover:scale-[1.02] cursor-pointer", style.border, style.bg, style.glow && `shadow-lg ${style.glow}`)}>
                      <Box className={cn("w-8 h-8 mx-auto mb-2", style.text)} />
                      <p className={cn("text-sm font-semibold capitalize", style.text)}>{c.crateType}</p>
                      <p className="text-[10px] text-slate-500 capitalize mt-0.5">{c.source?.replace(/_/g, " ")}</p>
                      <Button
                        size="sm"
                        className="mt-2 h-7 text-[10px] w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white"
                        onClick={() => openCrateMut.mutate({ crateId: c.id })}
                        disabled={openCrateMut.isPending}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />Open
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rewards Catalog */}
          <div>
            <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", isLight ? "text-slate-700" : "text-slate-200")}>
              <Gift className="w-4 h-4 text-purple-400" />
              Rewards Catalog
            </h3>
            {!rewards ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(rewards.rewards || []).map((r: any) => {
                  const canAfford = (rewards.availablePoints || 0) >= (r.pointsCost || r.cost || 0);
                  return (
                    <div key={r.id} className={cn("p-4 rounded-xl border transition-all", isLight ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{r.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{r.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                            {(r.pointsCost || r.cost || 0).toLocaleString()}
                          </p>
                          <p className="text-[9px] text-slate-500">points</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Badge className={cn("border text-[9px]", isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-slate-700/50 text-slate-400 border-slate-600/40")}>{r.category}</Badge>
                        <Button
                          size="sm"
                          className={cn("h-7 text-[10px]", canAfford ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white" : "")}
                          variant={canAfford ? "default" : "outline"}
                          disabled={!canAfford || redeemMut.isPending}
                          onClick={() => redeemMut.mutate({ rewardId: r.id })}
                        >
                          {canAfford ? <><Gift className="w-3 h-3 mr-1" />Redeem</> : "Not enough pts"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inventory */}
          {inventoryQ.data && inventoryQ.data.length > 0 && (
            <details className="group">
              <summary className={cn("text-sm font-semibold flex items-center gap-2 cursor-pointer select-none", isLight ? "text-slate-500" : "text-slate-400")}>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                My Inventory ({inventoryQ.data.length})
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {inventoryQ.data.map((item: any) => (
                  <div key={item.id} className={cn("p-3 rounded-xl border", isLight ? "bg-green-50 border-green-200/50" : "bg-green-500/5 border-green-500/15")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{item.name}</p>
                        <p className="text-[10px] text-slate-500">{timeAgo(item.purchasedAt || item.createdAt)}</p>
                      </div>
                      <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[9px]">{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </TabsContent>

        {/* ═══════════ LEADERBOARD TAB ═══════════ */}
        <TabsContent value="leaderboard" className="space-y-4 mt-4">
          {/* Scope toggle */}
          <div className="flex items-center justify-between">
            <h3 className={cn("text-base font-semibold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Trophy className="w-5 h-5 text-yellow-400" />
              {lbScope === "own" ? `${ROLE_LABEL[(leaderboardQ.data?.role || "DRIVER")] || "Role"} Rankings` : "Platform Rankings"}
            </h3>
            <div className="flex gap-1">
              {(["own", "all"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setLbScope(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    lbScope === s
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm"
                      : isLight ? "bg-white text-slate-500 border border-slate-200" : "bg-slate-800/50 text-slate-400 border border-slate-700/30"
                  )}
                >
                  {s === "own" ? "My Role" : "All Roles"}
                </button>
              ))}
            </div>
          </div>

          {/* My position card */}
          {profile && (
            <div className={cn("p-5 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50" : "bg-gradient-to-r from-[#1473FF]/8 to-[#BE01FF]/8 border-slate-700/30")}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-yellow-500/15">
                    <Crown className="w-7 h-7 text-yellow-400" />
                  </div>
                  <div>
                    <p className={cn("font-bold text-lg", isLight ? "text-slate-800" : "text-white")}>{profile.name}</p>
                    <p className="text-xs text-slate-400">Your Ranking</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">#{profile.rank || "—"}</p>
                    <p className="text-[10px] text-slate-400">Rank</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{(profile.totalPoints || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">XP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">Top {Math.max(1, Math.round(100 - (profile.percentile || 0)))}%</p>
                    <p className="text-[10px] text-slate-400">Percentile</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Podium */}
          {!leaderboardQ.isLoading && (leaderboardQ.data?.leaders || []).length >= 3 && (
            <div className="grid grid-cols-3 gap-3">
              {[1, 0, 2].map(idx => {
                const l = (leaderboardQ.data?.leaders || [])[idx];
                if (!l) return null;
                const isFirst = idx === 0;
                const rankColors = [
                  "from-yellow-500/15 to-yellow-600/15 border-yellow-500/30",
                  "from-slate-300/10 to-slate-400/10 border-slate-400/20",
                  "from-orange-500/10 to-orange-600/10 border-orange-500/20",
                ];
                const textColors = ["text-yellow-400", "text-slate-300", "text-orange-400"];
                return (
                  <div key={l.userId} className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    isFirst && "md:-mt-2",
                    isLight ? "bg-white shadow-sm" : `bg-gradient-to-b ${rankColors[idx]}`,
                  )}>
                    <div className={cn("w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-gradient-to-br text-white font-bold", ROLE_AVATAR_GRADIENT[l.role] || "from-slate-500 to-slate-700")}>
                      {(l.name || "?")[0].toUpperCase()}
                    </div>
                    <div className={cn("text-lg font-bold mb-0.5", textColors[idx])}>
                      {idx === 0 ? <Crown className="w-5 h-5 inline text-yellow-400" /> : null}
                      #{l.rank}
                    </div>
                    <p className={cn("text-sm font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>{l.name}</p>
                    <Badge className={cn("border text-[8px] mt-1", ROLE_BG[l.role] || "bg-slate-500/15 text-slate-400 border-slate-500/20")}>{ROLE_LABEL[l.role] || l.role}</Badge>
                    <p className="text-xs font-bold text-yellow-400 mt-2">{(l.totalXp || 0).toLocaleString()} XP</p>
                    <p className="text-[10px] text-slate-500">Lv.{l.level}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Rankings */}
          <Card className={cc}>
            <CardContent className="p-0">
              {leaderboardQ.isLoading ? (
                <div className="space-y-2 p-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : (leaderboardQ.data?.leaders || []).length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>Leaderboard updates weekly</p>
                  <p className="text-xs text-slate-500 mt-1">Complete missions and earn XP to climb the ranks</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/20">
                  {(leaderboardQ.data?.leaders || []).map((l: any) => {
                    const isYou = profile && l.userId === profile.userId;
                    return (
                      <div key={l.userId} className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        isYou && (isLight ? "bg-blue-50/50" : "bg-[#1473FF]/5"),
                        !isYou && (isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/30"),
                      )}>
                        {/* Rank */}
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0",
                          l.rank === 1 ? "bg-yellow-500/15 text-yellow-400" :
                          l.rank === 2 ? "bg-slate-300/15 text-slate-300" :
                          l.rank === 3 ? "bg-orange-500/15 text-orange-400" :
                          isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800/50 text-slate-400"
                        )}>
                          {l.rank <= 3 ? <Medal className="w-4 h-4" /> : l.rank}
                        </div>

                        {/* Avatar */}
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br flex-shrink-0", ROLE_AVATAR_GRADIENT[l.role] || "from-slate-500 to-slate-700")}>
                          {(l.name || "?")[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium truncate", isLight ? "text-slate-800" : "text-white")}>{l.name}</p>
                            {isYou && <Badge className="bg-[#1473FF]/15 text-[#1473FF] border-[#1473FF]/20 text-[8px]">You</Badge>}
                            <Badge className={cn("border text-[8px]", ROLE_BG[l.role] || "bg-slate-500/15 text-slate-400 border-slate-500/20")}>{ROLE_LABEL[l.role] || l.role}</Badge>
                          </div>
                          <p className="text-[10px] text-slate-500">Lv.{l.level} · {l.missionsCompleted || 0} missions</p>
                        </div>

                        {/* XP */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-yellow-400">{(l.totalXp || 0).toLocaleString()}</p>
                          <p className="text-[9px] text-slate-500">XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {leaderboardQ.data?.totalParticipants > 0 && (
            <p className="text-center text-[10px] text-slate-500">{leaderboardQ.data.totalParticipants} total participants</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
