/**
 * NOTIFICATION CENTER PAGE
 * Tracks all notifications across the platform for all user types.
 * Wired to notifications.list, notifications.getUnreadCount, notifications.getCategoryCounts.
 * Categories: Loads, Bids, Payments, Messages, Agreements, Account, System
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, CheckCircle, AlertTriangle, Trash2, Check,
  Truck, Gavel, CreditCard, MessageSquare, FileText,
  UserCheck, Settings, ChevronRight, BellOff, Inbox,
  Package, DollarSign, Handshake, Shield, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "all", label: "All", icon: Bell },
  { id: "loads", label: "Loads", icon: Truck },
  { id: "bids", label: "Bids", icon: Gavel },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "agreements", label: "Agreements", icon: Handshake },
  { id: "account", label: "Account", icon: UserCheck },
  { id: "system", label: "System", icon: Settings },
] as const;

function getCategoryIcon(category: string, eventType?: string) {
  if (eventType?.startsWith("load_")) return <Truck className="w-5 h-5" />;
  if (eventType?.startsWith("bid_")) return <Gavel className="w-5 h-5" />;
  if (eventType?.startsWith("payment_")) return <CreditCard className="w-5 h-5" />;
  if (eventType?.startsWith("agreement_")) return <FileText className="w-5 h-5" />;
  if (eventType === "new_message") return <MessageSquare className="w-5 h-5" />;
  if (eventType === "account_approved") return <UserCheck className="w-5 h-5" />;
  switch (category) {
    case "loads": return <Truck className="w-5 h-5" />;
    case "bids": return <Gavel className="w-5 h-5" />;
    case "payments": return <CreditCard className="w-5 h-5" />;
    case "messages": return <MessageSquare className="w-5 h-5" />;
    case "agreements": return <FileText className="w-5 h-5" />;
    case "account": return <UserCheck className="w-5 h-5" />;
    default: return <Bell className="w-5 h-5" />;
  }
}

function getCategoryColor(category: string, eventType?: string): { text: string; bg: string; ring: string } {
  // Red for cancelled/rejected/terminated
  if (eventType === "load_cancelled" || eventType === "bid_rejected" || eventType === "agreement_terminated")
    return { text: "text-red-500", bg: "bg-red-500/15", ring: "ring-red-500/20" };
  // Green for delivered/accepted/executed/approved
  if (eventType === "load_delivered" || eventType === "bid_accepted" || eventType === "agreement_executed" || eventType === "account_approved")
    return { text: "text-green-500", bg: "bg-green-500/15", ring: "ring-green-500/20" };

  switch (category) {
    case "loads": return { text: "text-blue-500", bg: "bg-blue-500/15", ring: "ring-blue-500/20" };
    case "bids": return { text: "text-indigo-500", bg: "bg-indigo-500/15", ring: "ring-indigo-500/20" };
    case "payments": return { text: "text-emerald-500", bg: "bg-emerald-500/15", ring: "ring-emerald-500/20" };
    case "messages": return { text: "text-cyan-500", bg: "bg-cyan-500/15", ring: "ring-cyan-500/20" };
    case "agreements": return { text: "text-purple-500", bg: "bg-purple-500/15", ring: "ring-purple-500/20" };
    case "account": return { text: "text-green-500", bg: "bg-green-500/15", ring: "ring-green-500/20" };
    default: return { text: "text-slate-400", bg: "bg-slate-500/15", ring: "ring-slate-500/20" };
  }
}

export default function NotificationCenter() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const listQuery = (trpc as any).notifications.list.useQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
    read: showUnreadOnly ? false : undefined,
    limit: 100,
  });
  const countQuery = (trpc as any).notifications.getUnreadCount.useQuery();
  const categoryCountsQuery = (trpc as any).notifications.getCategoryCounts.useQuery();

  const markReadMutation = (trpc as any).notifications.markAsRead.useMutation({
    onSuccess: () => { listQuery.refetch(); countQuery.refetch(); categoryCountsQuery.refetch(); },
  });
  const markAllReadMutation = (trpc as any).notifications.markAllAsRead.useMutation({
    onSuccess: () => { toast.success("All notifications marked as read"); listQuery.refetch(); countQuery.refetch(); categoryCountsQuery.refetch(); },
  });
  const archiveMutation = (trpc as any).notifications.archive.useMutation({
    onSuccess: () => { toast.success("Notification removed"); listQuery.refetch(); countQuery.refetch(); categoryCountsQuery.refetch(); },
  });

  const unreadCount = countQuery.data || 0;
  const catCounts: Record<string, { total: number; unread: number }> = categoryCountsQuery.data || {};
  const totalAll = Object.values(catCounts).reduce((s: number, c: any) => s + (c?.total || 0), 0);
  const unreadAll = Object.values(catCounts).reduce((s: number, c: any) => s + (c?.unread || 0), 0);
  const notifs: any[] = (listQuery.data as any)?.notifications || [];

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");
  const vl = cn("font-medium text-sm", L ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", L ? "text-slate-500" : "text-slate-400");

  const handleNotifClick = (n: any) => {
    if (!n.read) markReadMutation.mutate({ id: n.id });
    if (n.actionUrl) setLocation(n.actionUrl);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Notification Center</h1>
          <p className={mt}>All activity across loads, bids, payments, messages & more</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-xl text-xs", L ? "border-slate-200" : "border-slate-700", showUnreadOnly && "bg-blue-500/10 border-blue-500/30 text-blue-500")}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? <Bell className="w-3.5 h-3.5 mr-1.5" /> : <BellOff className="w-3.5 h-3.5 mr-1.5" />}
            {showUnreadOnly ? "Unread Only" : "Show All"}
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl text-xs font-bold" onClick={() => markAllReadMutation.mutate({})}>
              <Check className="w-3.5 h-3.5 mr-1.5" />Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: totalAll, icon: <Inbox className="w-4 h-4" />, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
          { label: "Unread", value: unreadAll, icon: <Bell className="w-4 h-4" />, color: "text-red-500", bg: "from-red-500/10 to-red-600/5" },
          { label: "Loads", value: (catCounts.loads?.total || 0) + (catCounts.bids?.total || 0), icon: <Truck className="w-4 h-4" />, color: "text-cyan-500", bg: "from-cyan-500/10 to-cyan-600/5" },
          { label: "Read", value: totalAll - unreadAll, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500", bg: "from-green-500/10 to-green-600/5" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 bg-gradient-to-br border", L ? `${s.bg} border-slate-200/60` : `${s.bg} border-slate-700/30`)}>
            <div className="flex items-center justify-between mb-2"><span className={s.color}>{s.icon}</span></div>
            <p className={cn("text-2xl font-bold tracking-tight", s.color)}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map(cat => {
          const catCount = cat.id === "all" ? totalAll : (catCounts[cat.id]?.total || 0);
          const catUnread = cat.id === "all" ? unreadAll : (catCounts[cat.id]?.unread || 0);
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border",
              activeCategory === cat.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
                : L ? "bg-white border-slate-200 text-slate-500 hover:border-blue-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600"
            )}>
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
              {catCount > 0 && <span className={cn("text-[10px] font-bold ml-0.5", activeCategory === cat.id ? "text-white/80" : "text-slate-400")}>{catCount}</span>}
              {catUnread > 0 && activeCategory !== cat.id && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <Card className={cc}>
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={cn("h-20 rounded-xl animate-pulse", L ? "bg-slate-100" : "bg-slate-800")} />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 flex items-center justify-center">
                <Bell className="w-10 h-10 text-slate-400/40" />
              </div>
              <p className={cn("font-bold text-lg mb-2", vl)}>
                {showUnreadOnly ? "No unread notifications" : "No notifications"}
              </p>
              <p className={cn("text-sm max-w-md mx-auto", mt)}>
                {showUnreadOnly
                  ? "You're all caught up! All notifications have been read."
                  : "Notifications from loads, bids, payments, messages, and agreements will appear here as they happen."
                }
              </p>
              {showUnreadOnly && (
                <Button variant="outline" size="sm" className={cn("mt-4 rounded-xl", L ? "border-slate-200" : "border-slate-700")} onClick={() => setShowUnreadOnly(false)}>
                  Show all notifications
                </Button>
              )}
            </div>
          ) : (
            <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/30")}>
              {notifs.map((n: any) => {
                const colors = getCategoryColor(n.category, n.eventType);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 flex items-start gap-3.5 cursor-pointer transition-all group",
                      !n.read && (L ? "bg-blue-50/50" : "bg-blue-500/[0.03]"),
                      L ? "hover:bg-slate-50" : "hover:bg-slate-700/20"
                    )}
                    onClick={() => handleNotifClick(n)}
                  >
                    {/* Icon */}
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0 mt-0.5", colors.bg)}>
                      <span className={colors.text}>{getCategoryIcon(n.category, n.eventType)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className={cn("font-bold text-sm", n.read ? (L ? "text-slate-500" : "text-slate-400") : vl)}>{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                        <Badge className={cn("border text-[9px] font-medium", colors.bg, colors.text, colors.ring, "ring-1")}>{n.category}</Badge>
                      </div>
                      <p className={cn("text-xs line-clamp-2", n.read ? "text-slate-400" : (L ? "text-slate-500" : "text-slate-400"))}>{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] text-slate-500">{n.timeAgo}</p>
                        {n.actionUrl && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-500 font-medium">
                            <ExternalLink className="w-2.5 h-2.5" />View
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <Button size="sm" variant="ghost" className={cn("h-8 w-8 p-0 rounded-lg", L ? "hover:bg-blue-50 text-blue-500" : "hover:bg-blue-500/10 text-blue-400")}
                          onClick={(e: any) => { e.stopPropagation(); markReadMutation.mutate({ id: n.id }); }} title="Mark as read">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className={cn("h-8 w-8 p-0 rounded-lg", L ? "hover:bg-red-50 text-red-400" : "hover:bg-red-500/10 text-red-400")}
                        onClick={(e: any) => { e.stopPropagation(); archiveMutation.mutate({ id: n.id }); }} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load more */}
      {(listQuery.data as any)?.hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm" className={cn("rounded-xl", L ? "border-slate-200" : "border-slate-700")} onClick={() => listQuery.refetch()}>
            Load more notifications
          </Button>
        </div>
      )}
    </div>
  );
}
