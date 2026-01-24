/**
 * NOTIFICATION CENTER COMPONENT
 * Real-time notifications for all user roles
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, BellOff, Check, CheckCheck, X, Truck, Package,
  AlertTriangle, DollarSign, Clock, User, FileText, Shield,
  MessageSquare, MapPin, Settings, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "load" | "bid" | "payment" | "alert" | "compliance" | "message" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: "low" | "normal" | "high" | "urgent";
  metadata?: Record<string, string>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  load: <Package className="w-4 h-4" />,
  bid: <DollarSign className="w-4 h-4" />,
  payment: <DollarSign className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
  compliance: <Shield className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  load: "bg-blue-500/20 text-blue-400",
  bid: "bg-green-500/20 text-green-400",
  payment: "bg-emerald-500/20 text-emerald-400",
  alert: "bg-red-500/20 text-red-400",
  compliance: "bg-yellow-500/20 text-yellow-400",
  message: "bg-purple-500/20 text-purple-400",
  system: "bg-slate-500/20 text-slate-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "",
  normal: "",
  high: "border-l-2 border-l-yellow-500",
  urgent: "border-l-2 border-l-red-500 bg-red-500/5",
};

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onDismiss,
  onAction,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <Card className="bg-slate-800/95 border-slate-700 w-96 max-h-[500px] flex flex-col shadow-xl">
      <CardHeader className="pb-2 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white ml-1">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onMarkAllRead}
              className="text-xs text-slate-400 hover:text-white"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600" : "text-slate-400"}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === "unread" ? "default" : "ghost"}
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-blue-600" : "text-slate-400"}
          >
            Unread ({unreadCount})
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {filter === "unread" ? "No unread notifications" : "No notifications"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-slate-700/30 transition-colors cursor-pointer",
                    !notification.read && "bg-slate-700/20",
                    PRIORITY_STYLES[notification.priority]
                  )}
                  onClick={() => {
                    if (!notification.read) onMarkAsRead(notification.id);
                    if (onAction) onAction(notification);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      TYPE_COLORS[notification.type]
                    )}>
                      {TYPE_ICONS[notification.type]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium",
                          notification.read ? "text-slate-300" : "text-white"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(notification.id);
                          }}
                          className="h-6 w-6 p-0 text-slate-500 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>

                      <p className={cn(
                        "text-xs mt-1",
                        notification.read ? "text-slate-500" : "text-slate-400"
                      )}>
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">
                          {formatTime(notification.timestamp)}
                        </span>
                        
                        {notification.actionLabel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-blue-400 hover:text-blue-300 p-0"
                          >
                            {notification.actionLabel}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>

                      {!notification.read && (
                        <div className="absolute top-4 right-12 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>

      <div className="p-3 border-t border-slate-700">
        <Button variant="ghost" className="w-full text-slate-400 text-sm">
          View all notifications
        </Button>
      </div>
    </Card>
  );
}

export function NotificationBell({ 
  count, 
  onClick 
}: { 
  count: number; 
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="relative h-9 w-9 p-0 text-slate-400 hover:text-white"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );
}

export function getSampleNotifications(): Notification[] {
  return [
    {
      id: "n1", type: "bid", title: "New Bid Received",
      message: "ABC Transport submitted a bid of $2,800 for LOAD-45901",
      timestamp: new Date(Date.now() - 300000), read: false, priority: "high",
      actionLabel: "View Bid", actionUrl: "/loads/45901/bids"
    },
    {
      id: "n2", type: "load", title: "Load Assigned",
      message: "You've been assigned to LOAD-45902. Pickup at 6:00 AM tomorrow.",
      timestamp: new Date(Date.now() - 1800000), read: false, priority: "normal",
      actionLabel: "View Load"
    },
    {
      id: "n3", type: "alert", title: "HOS Warning",
      message: "Driver John Smith has less than 2 hours driving time remaining.",
      timestamp: new Date(Date.now() - 3600000), read: false, priority: "urgent"
    },
    {
      id: "n4", type: "payment", title: "Payment Received",
      message: "Payment of $4,200 received for LOAD-45898.",
      timestamp: new Date(Date.now() - 7200000), read: true, priority: "normal"
    },
    {
      id: "n5", type: "compliance", title: "Document Expiring",
      message: "CDL for Robert Johnson expires in 30 days.",
      timestamp: new Date(Date.now() - 86400000), read: true, priority: "high",
      actionLabel: "Review"
    },
    {
      id: "n6", type: "message", title: "New Message",
      message: "Shell Oil: Load is ready for pickup at Gate 3.",
      timestamp: new Date(Date.now() - 3600000 * 2), read: true, priority: "normal",
      actionLabel: "Reply"
    },
  ];
}

export default NotificationCenter;
