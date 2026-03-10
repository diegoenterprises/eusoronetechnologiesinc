/**
 * COMMUNICATION HUB
 * Multi-channel communication dashboard, unified inbox, dispatch radio,
 * broadcast composer, notification rules, templates, escalation workflows,
 * analytics, translation toggle, and voice call log.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bell, BellRing, BookTemplate,
  CheckCircle, ChevronRight, Clock, FileText, Filter, Globe, Hash,
  Inbox, Languages, Mail, Megaphone, MessageCircle, MessageSquare, Mic,
  Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, Plus,
  Radio, RefreshCw, Search, Send, Settings, Shield, Smartphone,
  Timer, TrendingUp, Users, Volume2, Wifi, XCircle, Zap,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | "dashboard"
  | "inbox"
  | "dispatch"
  | "broadcast"
  | "rules"
  | "templates"
  | "escalation"
  | "analytics"
  | "calls"
  | "preferences";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  in_app: { label: "In-App", icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/20" },
  sms: { label: "SMS", icon: Smartphone, color: "text-green-400", bg: "bg-green-500/20" },
  email: { label: "Email", icon: Mail, color: "text-purple-400", bg: "bg-purple-500/20" },
  push: { label: "Push", icon: Bell, color: "text-orange-400", bg: "bg-orange-500/20" },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: "text-slate-400", bg: "bg-slate-500/20" },
  normal: { color: "text-blue-400", bg: "bg-blue-500/20" },
  high: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  urgent: { color: "text-orange-400", bg: "bg-orange-500/20" },
  emergency: { color: "text-red-400", bg: "bg-red-500/20" },
};

const CONV_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  direct: { label: "Direct", color: "text-blue-400" },
  group: { label: "Group", color: "text-indigo-400" },
  dispatch: { label: "Dispatch", color: "text-amber-400" },
  load_linked: { label: "Load", color: "text-green-400" },
  support: { label: "Support", color: "text-purple-400" },
  broadcast: { label: "Broadcast", color: "text-red-400" },
};

function ChannelBadge({ channel }: { channel: string }) {
  const cfg = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.in_app;
  const Icon = cfg.icon;
  return (
    <Badge className={cn("gap-1 border-0 text-xs", cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  return (
    <Badge className={cn("border-0 text-xs", cfg.bg, cfg.color)}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color = "text-blue-400", bg = "bg-blue-500/10", isLight = false }: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType; color?: string; bg?: string; isLight?: boolean;
}) {
  return (
    <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-1`}>{title}</p>
            <p className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{value}</p>
            {subtitle && <p className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"} mt-1`}>{subtitle}</p>}
          </div>
          <div className={cn("p-2 rounded-lg", bg)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-24 w-full bg-slate-800" />
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────────

function DashboardTab({ isLight = false }: { isLight?: boolean }) {
  const { data, isLoading } = trpc.communicationHub.getCommunicationDashboard.useQuery();

  if (isLoading || !data) return <LoadingState />;

  const { summary, channelBreakdown, recentActivity, urgentItems } = data;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Unread Messages" value={summary.totalUnread} icon={Inbox} color="text-red-400" bg="bg-red-500/10" />
        <StatCard title="Active Chats" value={summary.activeChats} icon={MessageSquare} />
        <StatCard title="Broadcasts" value={summary.recentBroadcasts} subtitle="This week" icon={Megaphone} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard title="Active Escalations" value={summary.activeEscalations} icon={AlertTriangle} color="text-orange-400" bg="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Rules" value={summary.activeRules} icon={Zap} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard title="Templates" value={summary.totalTemplates} icon={FileText} color="text-indigo-400" bg="bg-indigo-500/10" />
        <StatCard title="Scheduled" value={summary.scheduledMessages} icon={Clock} color="text-cyan-400" bg="bg-cyan-500/10" />
        <StatCard title="Voice Calls" value={summary.totalVoiceCalls} icon={Phone} color="text-green-400" bg="bg-green-500/10" />
      </div>

      {/* Channel Breakdown */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Channel Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(channelBreakdown).map(([ch, count]) => {
              const cfg = CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.in_app;
              const Icon = cfg.icon;
              return (
                <div key={ch} className={`text-center p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                  <Icon className={cn("w-6 h-6 mx-auto mb-2", cfg.color)} />
                  <p className="text-lg font-bold text-white">{count as number}</p>
                  <p className="text-xs text-slate-400">{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Urgent Items */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Urgent Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No urgent items</p>
            ) : (
              <div className="space-y-2">
                {urgentItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    {item.type === "emergency_broadcast" ? (
                      <Megaphone className="w-4 h-4 text-red-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-400">{timeAgo(item.createdAt)}</p>
                    </div>
                    <PriorityBadge priority={item.priority} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((msg: any) => (
                <div key={msg.id} className={`flex items-center gap-3 p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                  <ChannelBadge channel={msg.channel} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      <span className="text-slate-300 font-medium">{msg.senderName}:</span> {msg.preview}
                    </p>
                    <p className="text-xs text-slate-500">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Inbox Tab ───────────────────────────────────────────────────────────────

function InboxTab({ isLight = false }: { isLight?: boolean }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { data: inbox, isLoading } = trpc.communicationHub.getMultiChannelInbox.useQuery({
    search: search || undefined,
    type: (typeFilter || undefined) as any,
    page: 1,
    limit: 20,
  });

  const { data: thread } = trpc.communicationHub.getConversationThreads.useQuery(
    { conversationId: selectedConvo!, page: 1, limit: 50 },
    { enabled: !!selectedConvo }
  );

  if (isLoading) return <LoadingState />;

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      {/* Conversation List */}
      <div className="md:col-span-1 flex flex-col bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="p-3 border-b border-slate-700/50 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {["", "direct", "dispatch", "group", "load_linked", "support"].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "text-xs px-2 py-1 rounded-md transition-colors",
                  typeFilter === t
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {t ? (CONV_TYPE_CONFIG[t]?.label || t) : "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inbox?.conversations.map((conv: any) => {
            const typeCfg = CONV_TYPE_CONFIG[conv.type] || { label: conv.type, color: "text-slate-400" };
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvo(conv.id)}
                className={cn(
                  "w-full text-left p-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors",
                  selectedConvo === conv.id && "bg-slate-800/80 border-l-2 border-l-blue-500"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs font-medium", typeCfg.color)}>{typeCfg.label}</span>
                  {conv.isPinned && <span className="text-xs text-yellow-400">Pinned</span>}
                  {conv.unreadCount > 0 && (
                    <Badge className="ml-auto bg-blue-600 text-white text-xs border-0 h-5 min-w-[20px] flex items-center justify-center">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{conv.title}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMessagePreview}</p>
                <p className="text-xs text-slate-500 mt-1">{timeAgo(conv.lastMessageAt)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Thread */}
      <div className="md:col-span-2 flex flex-col bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
        {selectedConvo && thread ? (
          <>
            <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">{thread.conversation?.title}</h3>
                <p className="text-xs text-slate-400">
                  {thread.conversation?.participants.length} participants
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={cn("gap-1 text-xs", showTranslation ? "text-green-400" : "text-slate-400")}
                >
                  <Languages className="w-3.5 h-3.5" />
                  {showTranslation ? "ES" : "EN"}
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400">
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.messages.map((msg: any) => {
                const isOwn = msg.senderId === 1;
                return (
                  <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-lg p-3",
                      isOwn ? "bg-blue-600/20 border border-blue-500/30" : "bg-slate-800 border border-slate-700"
                    )}>
                      {!isOwn && (
                        <p className="text-xs font-medium text-indigo-400 mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-sm text-white">
                        {showTranslation && msg.translatedContent ? msg.translatedContent : msg.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-slate-500">{timeAgo(msg.createdAt)}</span>
                        <ChannelBadge channel={msg.channel} />
                        {msg.priority !== "normal" && <PriorityBadge priority={msg.priority} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dispatch Radio Tab ──────────────────────────────────────────────────────

function DispatchRadioTab({ isLight = false }: { isLight?: boolean }) {
  const { data, isLoading } = trpc.communicationHub.getDispatchRadio.useQuery();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Fleet Groups */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            Fleet Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.fleetGroups.map((g: any) => (
              <div key={g.id} className={`p-3 rounded-lg ${isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-800/50 border border-slate-700/50"} hover:border-amber-500/30 transition-colors cursor-pointer`}>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">{g.name}</span>
                </div>
                <p className="text-xs text-slate-400">{g.memberCount} members</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dispatch Channels */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-400" />
            Active Dispatch Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dispatchChannels.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No active dispatch channels</p>
          ) : (
            <div className="space-y-2">
              {data.dispatchChannels.map((ch: any) => (
                <div key={ch.id} className={`flex items-center gap-3 p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{ch.title}</p>
                    <p className="text-xs text-slate-400">{ch.participantCount} participants</p>
                  </div>
                  {ch.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white border-0 text-xs">{ch.unreadCount}</Badge>
                  )}
                  <span className="text-xs text-slate-500">{timeAgo(ch.lastActivity)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Broadcasts */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-red-400" />
            Recent Broadcasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.broadcasts.map((b: any) => (
              <div key={b.id} className={cn(
                "p-4 rounded-lg border",
                b.isEmergency
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-slate-800/50 border-slate-700/50"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {b.isEmergency && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  <h4 className="text-sm font-medium text-white">{b.title}</h4>
                  <PriorityBadge priority={b.priority} />
                  <span className="ml-auto text-xs text-slate-500">{timeAgo(b.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-300 mb-3">{b.content}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>By: {b.senderName}</span>
                  <span>Group: {b.targetGroup.replace(/_/g, " ")}</span>
                  <span>Recipients: {b.recipientCount}</span>
                  <span>Delivered: {b.deliveredCount}</span>
                  <span>Read: {b.readCount}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Broadcast Composer Tab ──────────────────────────────────────────────────

function BroadcastTab({ isLight = false }: { isLight?: boolean }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetGroup, setTargetGroup] = useState("all_drivers");
  const [priority, setPriority] = useState("normal");
  const [isEmergency, setIsEmergency] = useState(false);

  const sendBroadcast = trpc.communicationHub.sendBroadcast.useMutation();
  const { data: radioData } = trpc.communicationHub.getDispatchRadio.useQuery();
  const { data: emergencyHistory } = trpc.communicationHub.getEmergencyBroadcastHistory.useQuery();

  const handleSend = () => {
    if (!title || !content) return;
    sendBroadcast.mutate({
      title,
      content,
      targetGroup,
      priority: priority as any,
      isEmergency,
    });
    setTitle("");
    setContent("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Composer */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            Compose Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Broadcast title..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Message</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={5}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Group</label>
              <select
                value={targetGroup}
                onChange={e => setTargetGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {radioData?.fleetGroups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.memberCount})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={e => setIsEmergency(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600"
            />
            Mark as Emergency Broadcast
          </label>
          <Button
            onClick={handleSend}
            disabled={!title || !content || sendBroadcast.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Send className="w-4 h-4" />
            {sendBroadcast.isPending ? "Sending..." : "Send Broadcast"}
          </Button>
          {sendBroadcast.isSuccess && (
            <p className="text-sm text-green-400 text-center">Broadcast sent successfully!</p>
          )}
        </CardContent>
      </Card>

      {/* Emergency History */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Emergency Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyHistory ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"} text-center`}>
                  <p className="text-lg font-bold text-white">{emergencyHistory.deliveryRate}%</p>
                  <p className="text-xs text-slate-400">Delivery Rate</p>
                </div>
                <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"} text-center`}>
                  <p className="text-lg font-bold text-white">{emergencyHistory.readRate}%</p>
                  <p className="text-xs text-slate-400">Read Rate</p>
                </div>
              </div>
              {emergencyHistory.broadcasts.map((b: any) => (
                <div key={b.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm font-medium text-white">{b.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{b.content.slice(0, 120)}...</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>{timeAgo(b.createdAt)}</span>
                    <span>{b.recipientCount} recipients</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <LoadingState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notification Rules Tab ──────────────────────────────────────────────────

function RulesTab({ isLight = false }: { isLight?: boolean }) {
  const { data, isLoading } = trpc.communicationHub.getAutomatedNotifications.useQuery();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Notification Rules</h3>
          <p className="text-sm text-slate-400">
            {data.activeRules} active / {data.totalRules} total | {data.totalTriggered} total triggers
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Rule
        </Button>
      </div>

      <div className="space-y-3">
        {data.rules.map((rule: any) => (
          <Card key={rule.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", rule.isActive ? "bg-green-400" : "bg-slate-600")} />
                  <div>
                    <h4 className="text-sm font-medium text-white">{rule.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{rule.description}</p>
                  </div>
                </div>
                <Badge className={cn("border-0 text-xs", rule.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                  {rule.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Trigger: {rule.condition.replace(/_/g, " ")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {rule.recipients.replace(/_/g, " ")}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {rule.triggerCount} triggers
                </span>
                {rule.cooldownMinutes > 0 && (
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {rule.cooldownMinutes}m cooldown
                  </span>
                )}
                {rule.lastTriggeredAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last: {timeAgo(rule.lastTriggeredAt)}
                  </span>
                )}
              </div>
              <div className="flex gap-1 mt-3">
                {rule.channels.map((ch: string) => (
                  <ChannelBadge key={ch} channel={ch} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Templates Tab ───────────────────────────────────────────────────────────

function TemplatesTab({ isLight = false }: { isLight?: boolean }) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data, isLoading } = trpc.communicationHub.getNotificationTemplates.useQuery({
    category: categoryFilter || undefined,
  });

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Message Templates</h3>
          <p className="text-sm text-slate-400">{data.totalTemplates} templates</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", ...(data.categories || [])].map((cat: string) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-md transition-colors",
              categoryFilter === cat
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {cat || "All"}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.templates.map((tmpl: any) => (
          <Card key={tmpl.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-white">{tmpl.name}</h4>
                <div className="flex items-center gap-1.5">
                  <ChannelBadge channel={tmpl.channel} />
                  <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">{tmpl.language.toUpperCase()}</Badge>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-800/80 mb-3">
                {tmpl.subject && (
                  <p className="text-xs text-indigo-400 mb-1">Subject: {tmpl.subject}</p>
                )}
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{tmpl.body.slice(0, 200)}{tmpl.body.length > 200 ? "..." : ""}</p>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {tmpl.mergeFields.map((f: string) => (
                  <Badge key={f} className="bg-indigo-500/20 text-indigo-400 border-0 text-xs">
                    {`{{${f}}}`}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{tmpl.category}</span>
                <span>{tmpl.usageCount} uses</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Escalation Tab ──────────────────────────────────────────────────────────

function EscalationTab({ isLight = false }: { isLight?: boolean }) {
  const { data, isLoading } = trpc.communicationHub.getEscalationWorkflows.useQuery();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Escalation Workflows</h3>
          <p className="text-sm text-slate-400">
            {data.activeCount} active / {data.totalWorkflows} total
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      {/* Active Escalations */}
      {data.activeEscalations.length > 0 && (
        <Card className="bg-red-500/10 border border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-red-400 animate-pulse" />
              Active Escalations ({data.activeEscalations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.activeEscalations.map((esc: any) => (
                <div key={esc.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                  <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Level {esc.currentLevel}</Badge>
                  <span className="text-sm text-white">{esc.workflowName}</span>
                  <span className="text-xs text-slate-400 ml-auto">{timeAgo(esc.startedAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows */}
      <div className="space-y-4">
        {data.workflows.map((wf: any) => (
          <Card key={wf.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{wf.name}</h4>
                    <Badge className={cn("border-0 text-xs", wf.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                      {wf.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{wf.description}</p>
                </div>
                <span className="text-xs text-slate-500">{wf.steps.length} steps</span>
              </div>
              <div className="relative pl-4 space-y-3">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-700" />
                {wf.steps.map((step: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 -ml-[9px] z-10",
                      idx === 0 ? "bg-blue-600 border-blue-400" :
                        idx === wf.steps.length - 1 ? "bg-red-600 border-red-400" :
                          "bg-slate-700 border-slate-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-white">Level {step.level}</span>
                        <span className="text-xs text-slate-400">after {step.delayMinutes}m</span>
                        <ChannelBadge channel={step.channel} />
                      </div>
                      <p className="text-xs text-slate-300">{step.message.slice(0, 120)}</p>
                      {step.notifyRoles.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {step.notifyRoles.map((role: string) => (
                            <Badge key={role} className="bg-slate-700 text-slate-300 border-0 text-xs">{role}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────

function AnalyticsTab({ isLight = false }: { isLight?: boolean }) {
  const [range, setRange] = useState<"today" | "week" | "month" | "quarter">("week");
  const { data, isLoading } = trpc.communicationHub.getCommunicationAnalytics.useQuery({ dateRange: range });

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Communication Analytics</h3>
        <div className="flex gap-1">
          {(["today", "week", "month", "quarter"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md transition-colors",
                range === r ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Messages" value={data.totalMessages} icon={MessageSquare} />
        <StatCard title="Avg Response" value={data.avgResponseTimeFormatted} icon={Timer} color="text-green-400" bg="bg-green-500/10" />
        <StatCard title="Voice Calls" value={data.totalCalls} icon={Phone} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard title="Broadcasts" value={data.totalBroadcasts} icon={Megaphone} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.channelDistribution).map(([ch, count]) => {
                const cfg = CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.in_app;
                const Icon = cfg.icon;
                const total = Object.values(data.channelDistribution).reduce((s: number, v: any) => s + v, 0);
                const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <div key={ch} className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                    <span className="text-sm text-slate-300 w-16">{cfg.label}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className={cn("h-2 rounded-full", cfg.bg.replace("/20", ""))} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-16 text-right">{count as number} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.priorityBreakdown).map(([pri, count]) => {
                const cfg = PRIORITY_CONFIG[pri] || PRIORITY_CONFIG.normal;
                return (
                  <div key={pri} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", cfg.color.replace("text-", "bg-"))} />
                      <span className="text-sm text-slate-300 capitalize">{pri}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{count as number}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Call Stats */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-400" />
              Call Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"} text-center`}>
                <p className="text-lg font-bold text-green-400">{data.callStats.completed}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
              <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"} text-center`}>
                <p className="text-lg font-bold text-red-400">{data.callStats.missed}</p>
                <p className="text-xs text-slate-400">Missed</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 text-center col-span-2">
                <p className="text-lg font-bold text-white">{formatDuration(data.callStats.avgDuration)}</p>
                <p className="text-xs text-slate-400">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Conversations */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Top Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topConversations.map((conv: any, idx: number) => {
                const typeCfg = CONV_TYPE_CONFIG[conv.type] || { label: conv.type, color: "text-slate-400" };
                return (
                  <div key={conv.id} className={`flex items-center gap-3 p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                    <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{conv.title}</p>
                      <span className={cn("text-xs", typeCfg.color)}>{typeCfg.label}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{conv.messageCount} msgs</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Voice Calls Tab ─────────────────────────────────────────────────────────

function CallsTab({ isLight = false }: { isLight?: boolean }) {
  const { data, isLoading } = trpc.communicationHub.getVoiceCallLog.useQuery();

  if (isLoading || !data) return <LoadingState />;

  const CALL_ICON: Record<string, React.ElementType> = {
    completed: PhoneCall,
    missed: PhoneMissed,
    voicemail: Mic,
    busy: Phone,
    failed: XCircle,
  };

  const CALL_COLOR: Record<string, string> = {
    completed: "text-green-400",
    missed: "text-red-400",
    voicemail: "text-purple-400",
    busy: "text-yellow-400",
    failed: "text-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Calls" value={data.stats.totalCalls} icon={Phone} />
        <StatCard title="Completed" value={data.stats.completed} icon={CheckCircle} color="text-green-400" bg="bg-green-500/10" />
        <StatCard title="Missed" value={data.stats.missed} icon={PhoneMissed} color="text-red-400" bg="bg-red-500/10" />
        <StatCard title="Avg Duration" value={formatDuration(data.stats.avgDuration)} icon={Timer} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Call Log */}
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-green-400" />
            Call Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.calls.map((call: any) => {
              const CallIcon = CALL_ICON[call.status] || Phone;
              const color = CALL_COLOR[call.status] || "text-slate-400";
              const DirIcon = call.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
              return (
                <div key={call.id} className={`flex items-center gap-3 p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                  <CallIcon className={cn("w-5 h-5 flex-shrink-0", color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <DirIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-medium text-white">
                        {call.direction === "outbound" ? call.receiverName : call.callerName}
                      </span>
                      <Badge className={cn("border-0 text-xs", call.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                        {call.status}
                      </Badge>
                    </div>
                    {call.outcome && (
                      <p className="text-xs text-slate-400 mt-0.5">{call.outcome}</p>
                    )}
                    {call.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">{call.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {call.durationSeconds > 0 && (
                      <p className="text-sm font-medium text-white">{formatDuration(call.durationSeconds)}</p>
                    )}
                    <p className="text-xs text-slate-500">{timeAgo(call.startedAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Preferences Tab ─────────────────────────────────────────────────────────

function PreferencesTab({ isLight = false }: { isLight?: boolean }) {
  const { data, isLoading } = trpc.communicationHub.getNotificationPreferences.useQuery();
  const { data: scheduled } = trpc.communicationHub.getScheduledMessages.useQuery();
  const { data: compliance } = trpc.communicationHub.getCommunicationCompliance.useQuery();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Channel Preferences */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              Channel Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.channels).map(([ch, enabled]) => {
                const cfg = CHANNEL_CONFIG[ch] || CHANNEL_CONFIG.in_app;
                const Icon = cfg.icon;
                return (
                  <div key={ch} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", cfg.color)} />
                      <span className="text-sm text-white">{cfg.label}</span>
                    </div>
                    <Badge className={cn("border-0 text-xs", enabled ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                      {enabled ? "On" : "Off"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-300">Status</span>
                <Badge className={cn("border-0 text-xs", data.quietHours.enabled ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-400")}>
                  {data.quietHours.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">From</span>
                <span className="text-sm text-white">{data.quietHours.start}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">To</span>
                <span className="text-sm text-white">{data.quietHours.end}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Timezone</span>
                <span className="text-sm text-white">{data.quietHours.timezone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Messages */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Scheduled Messages ({scheduled?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduled?.messages.map((msg: any) => (
              <div key={msg.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 mb-2">
                <ChannelBadge channel={msg.channel} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{msg.content.slice(0, 60)}</p>
                  <p className="text-xs text-slate-400">{msg.recipientIds.length} recipients</p>
                </div>
                <div className="text-right">
                  <Badge className={cn("border-0 text-xs",
                    msg.status === "scheduled" ? "bg-cyan-500/20 text-cyan-400" :
                      msg.status === "sent" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                  )}>
                    {msg.status}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(msg.scheduledFor).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/50 border-slate-700/50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Communication Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compliance && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                  <span className="text-sm text-slate-300">Status</span>
                  <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">{compliance.complianceStatus}</Badge>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Total Records: {compliance.totalRecords.toLocaleString()}</p>
                  <p>Message Retention: {compliance.retentionPolicy.messageDays} days</p>
                  <p>Last Audit: {new Date(compliance.lastAuditDate).toLocaleDateString()}</p>
                </div>
                {compliance.regulations.map((reg: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-800/50">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">{reg.name}</p>
                      <p className="text-xs text-slate-500">{reg.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CommunicationHub() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "dispatch", label: "Dispatch Radio", icon: Radio },
    { key: "broadcast", label: "Broadcast", icon: Megaphone },
    { key: "rules", label: "Rules", icon: Zap },
    { key: "templates", label: "Templates", icon: FileText },
    { key: "escalation", label: "Escalation", icon: AlertTriangle },
    { key: "analytics", label: "Analytics", icon: Activity },
    { key: "calls", label: "Calls", icon: Phone },
    { key: "preferences", label: "Settings", icon: Settings },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#6366f1] bg-clip-text text-transparent">
            Communication Hub
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            Multi-channel messaging, dispatch radio, notifications, and compliance
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                tab === t.key
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : isLight
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "dashboard" && <DashboardTab isLight={isLight} />}
      {tab === "inbox" && <InboxTab isLight={isLight} />}
      {tab === "dispatch" && <DispatchRadioTab isLight={isLight} />}
      {tab === "broadcast" && <BroadcastTab isLight={isLight} />}
      {tab === "rules" && <RulesTab isLight={isLight} />}
      {tab === "templates" && <TemplatesTab isLight={isLight} />}
      {tab === "escalation" && <EscalationTab isLight={isLight} />}
      {tab === "analytics" && <AnalyticsTab isLight={isLight} />}
      {tab === "calls" && <CallsTab isLight={isLight} />}
      {tab === "preferences" && <PreferencesTab isLight={isLight} />}
    </div>
  );
}
