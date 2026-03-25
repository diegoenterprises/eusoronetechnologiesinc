/**
 * ACTIVITY FEED + QUICK ACTIONS — Right column of Dispatch Command Center
 * Real-time event feed + quick action buttons for dispatchers
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap, Plus, MessageSquare, DollarSign, Phone,
  AlertTriangle, CheckCircle, Truck, Navigation,
  Clock, Package, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityEvent {
  id: string;
  type: "assignment" | "pickup" | "delivery" | "status" | "hos_warning" | "exception" | "message";
  message: string;
  timestamp: string;
  severity?: "normal" | "warning" | "critical";
  loadNumber?: string;
  driverName?: string;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  loading?: boolean;
  exceptionCount?: number;
  checkCallsDue?: number;
  onQuickLoad?: () => void;
  onBroadcast?: () => void;
  onViewSettlements?: () => void;
  onViewCheckCalls?: () => void;
  onViewExceptions?: () => void;
}

const EVENT_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  assignment:  { icon: <Truck className="w-3 h-3" />,        color: "text-blue-400" },
  pickup:      { icon: <Package className="w-3 h-3" />,      color: "text-cyan-400" },
  delivery:    { icon: <CheckCircle className="w-3 h-3" />,  color: "text-green-400" },
  status:      { icon: <Navigation className="w-3 h-3" />,   color: "text-purple-400" },
  hos_warning: { icon: <AlertTriangle className="w-3 h-3" />,color: "text-yellow-400" },
  exception:   { icon: <AlertTriangle className="w-3 h-3" />,color: "text-red-400" },
  message:     { icon: <MessageSquare className="w-3 h-3" />,color: "text-slate-400" },
};

function formatTimeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return ""; }
}

export default function ActivityFeed({
  events, loading, exceptionCount = 0, checkCallsDue = 0,
  onQuickLoad, onBroadcast, onViewSettlements, onViewCheckCalls, onViewExceptions,
}: ActivityFeedProps) {

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-white/[0.06]">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 rounded-md" />)}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Exception Alerts */}
      {exceptionCount > 0 && (
        <button
          onClick={onViewExceptions}
          className="mx-3 mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-left hover:bg-red-500/15 transition-colors"
          aria-label={`${exceptionCount} active exceptions, click to view`}
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-red-400">{exceptionCount} Active Exception{exceptionCount > 1 ? "s" : ""}</p>
            <p className="text-xs text-red-400/60">Requires attention</p>
          </div>
        </button>
      )}

      {/* Quick Actions */}
      <div className="p-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-yellow-400" aria-hidden="true" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            className="h-8 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md justify-start gap-1.5"
            onClick={onQuickLoad}
          >
            <Plus className="w-3 h-3" aria-hidden="true" />Quick Load
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-md justify-start gap-1.5"
            onClick={onBroadcast}
          >
            <MessageSquare className="w-3 h-3" aria-hidden="true" />Broadcast
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-md justify-start gap-1.5"
            onClick={onViewSettlements}
          >
            <DollarSign className="w-3 h-3" aria-hidden="true" />Settlements
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-8 text-xs border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-md justify-start gap-1.5",
              checkCallsDue > 0 && "border-yellow-500/30 bg-yellow-500/5"
            )}
            onClick={onViewCheckCalls}
          >
            <Phone className="w-3 h-3" aria-hidden="true" />
            Check Calls
            {checkCallsDue > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs px-1 py-0 ml-auto">
                {checkCallsDue}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3 h-3 text-cyan-400" aria-hidden="true" />
            Activity
          </h3>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 px-3">
            <Bell className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="px-3 pb-3" role="log" aria-label="Dispatch activity feed" aria-live="polite">
            {events.map(event => {
              const cfg = EVENT_ICONS[event.type] || EVENT_ICONS.status;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "py-2 border-b border-white/[0.04] last:border-0 flex items-start gap-2",
                    event.severity === "critical" && "bg-red-500/5 -mx-3 px-3 rounded",
                    event.severity === "warning" && "bg-yellow-500/5 -mx-3 px-3 rounded"
                  )}
                >
                  <div className={cn("mt-0.5 shrink-0", cfg.color)}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-relaxed">{event.message}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {formatTimeAgo(event.timestamp)}
                      {event.loadNumber && <span className="ml-1.5">#{event.loadNumber}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
