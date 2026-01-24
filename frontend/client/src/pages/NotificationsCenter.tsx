/**
 * NOTIFICATIONS CENTER
 * Centralized notification and alert management
 * All user roles
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter,
  AlertTriangle, Info, AlertCircle, CheckCircle, Clock,
  Truck, FileText, DollarSign, Users, Settings, X,
  ChevronRight, MoreHorizontal, Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NotificationType = "alert" | "info" | "success" | "warning" | "action_required";
type NotificationCategory = "loads" | "compliance" | "safety" | "billing" | "system" | "drivers";

interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string>;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "alert",
    category: "compliance",
    title: "Medical Card Expiring",
    message: "Driver Mike Johnson's medical card expires in 14 days. Please schedule renewal.",
    timestamp: "2025-01-23T14:30:00",
    read: false,
    archived: false,
    actionUrl: "/compliance/dq-files",
    actionLabel: "View DQ File",
    metadata: { driverId: "drv_001", driverName: "Mike Johnson" },
  },
  {
    id: "n2",
    type: "action_required",
    category: "loads",
    title: "New Bid Received",
    message: "ABC Transport submitted a bid of $2,450 for Load #45921 (Houston to Dallas)",
    timestamp: "2025-01-23T14:15:00",
    read: false,
    archived: false,
    actionUrl: "/bids",
    actionLabel: "Review Bid",
    metadata: { loadId: "45921", bidAmount: "$2,450" },
  },
  {
    id: "n3",
    type: "warning",
    category: "safety",
    title: "CSA Score Alert",
    message: "Vehicle Maintenance BASIC score increased to 58%. Approaching intervention threshold.",
    timestamp: "2025-01-23T13:45:00",
    read: false,
    archived: false,
    actionUrl: "/safety/csa-scores",
    actionLabel: "View CSA Scores",
  },
  {
    id: "n4",
    type: "success",
    category: "loads",
    title: "Load Delivered",
    message: "Load #45918 successfully delivered to Dallas Distribution Center. BOL signed.",
    timestamp: "2025-01-23T12:30:00",
    read: true,
    archived: false,
    metadata: { loadId: "45918", bolNumber: "BOL-2025-0845" },
  },
  {
    id: "n5",
    type: "info",
    category: "drivers",
    title: "Driver Check-In",
    message: "Sarah Williams checked in at Houston Terminal for Load #45922",
    timestamp: "2025-01-23T11:00:00",
    read: true,
    archived: false,
    metadata: { driverId: "drv_002", location: "Houston Terminal" },
  },
  {
    id: "n6",
    type: "alert",
    category: "compliance",
    title: "Clearinghouse Query Due",
    message: "Annual Clearinghouse query due for 3 drivers within 30 days",
    timestamp: "2025-01-23T10:00:00",
    read: true,
    archived: false,
    actionUrl: "/compliance/dq-files",
    actionLabel: "Run Queries",
  },
  {
    id: "n7",
    type: "info",
    category: "billing",
    title: "Invoice Generated",
    message: "Invoice #INV-2025-0234 generated for $8,750.00 - Load #45915",
    timestamp: "2025-01-23T09:30:00",
    read: true,
    archived: false,
    metadata: { invoiceId: "INV-2025-0234", amount: "$8,750.00" },
  },
  {
    id: "n8",
    type: "warning",
    category: "drivers",
    title: "HOS Warning",
    message: "Driver Tom Brown has 2 hours remaining on 70-hour cycle. Plan rest accordingly.",
    timestamp: "2025-01-23T08:45:00",
    read: true,
    archived: false,
    actionUrl: "/driver/hos",
    actionLabel: "View HOS",
    metadata: { driverId: "drv_003" },
  },
  {
    id: "n9",
    type: "success",
    category: "system",
    title: "Backup Completed",
    message: "Daily system backup completed successfully at 3:00 AM",
    timestamp: "2025-01-23T03:00:00",
    read: true,
    archived: false,
  },
  {
    id: "n10",
    type: "action_required",
    category: "compliance",
    title: "Document Upload Required",
    message: "Annual MVR for Lisa Chen pending upload. Due in 5 days.",
    timestamp: "2025-01-22T16:00:00",
    read: true,
    archived: false,
    actionUrl: "/compliance/dq-files",
    actionLabel: "Upload Document",
  },
];

const TYPE_CONFIG: Record<NotificationType, { color: string; icon: React.ElementType; bgColor: string }> = {
  alert: { color: "text-red-400", icon: AlertCircle, bgColor: "bg-red-500/10" },
  warning: { color: "text-yellow-400", icon: AlertTriangle, bgColor: "bg-yellow-500/10" },
  info: { color: "text-blue-400", icon: Info, bgColor: "bg-blue-500/10" },
  success: { color: "text-green-400", icon: CheckCircle, bgColor: "bg-green-500/10" },
  action_required: { color: "text-orange-400", icon: Clock, bgColor: "bg-orange-500/10" },
};

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: React.ElementType }> = {
  loads: { label: "Loads", icon: Truck },
  compliance: { label: "Compliance", icon: FileText },
  safety: { label: "Safety", icon: AlertTriangle },
  billing: { label: "Billing", icon: DollarSign },
  system: { label: "System", icon: Settings },
  drivers: { label: "Drivers", icon: Users },
};

export default function NotificationsCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const actionRequiredCount = notifications.filter(n => n.type === "action_required" && !n.archived).length;

  const filteredNotifications = notifications.filter(n => {
    if (n.archived && !showArchived) return false;
    if (!n.archived && showArchived) return false;
    if (filterCategory !== "all" && n.category !== filterCategory) return false;
    if (filterRead === "unread" && n.read) return false;
    if (filterRead === "read" && !n.read) return false;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, archived: true } : n
    ));
    toast.success("Notification archived");
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notification deleted");
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    notifications.filter(n => !n.archived).forEach(n => {
      stats[n.category] = (stats[n.category] || 0) + 1;
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">Manage alerts and system notifications</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" className="border-slate-600">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button 
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? "bg-blue-600" : "border-slate-600"}
          >
            <Archive className="w-4 h-4 mr-2" />
            {showArchived ? "View Active" : "View Archived"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn(
          "border-slate-700 cursor-pointer transition-colors",
          filterRead === "unread" ? "bg-blue-500/20 border-blue-500/50" : "bg-slate-800/50"
        )} onClick={() => setFilterRead(filterRead === "unread" ? "all" : "unread")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{unreadCount}</p>
              <p className="text-xs text-slate-500">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">{actionRequiredCount}</p>
              <p className="text-xs text-orange-500/70">Action Required</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {notifications.filter(n => n.type === "alert" && !n.archived).length}
              </p>
              <p className="text-xs text-red-500/70">Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-slate-500/20">
              <Archive className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-400">
                {notifications.filter(n => n.archived).length}
              </p>
              <p className="text-xs text-slate-500">Archived</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === "all" ? "default" : "outline"}
              onClick={() => setFilterCategory("all")}
              className={filterCategory === "all" ? "bg-blue-600" : "border-slate-600"}
              size="sm"
            >
              All ({notifications.filter(n => !n.archived).length})
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const count = categoryStats[key] || 0;
              if (count === 0) return null;
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={filterCategory === key ? "default" : "outline"}
                  onClick={() => setFilterCategory(key)}
                  className={filterCategory === key ? "bg-blue-600" : "border-slate-600"}
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {showArchived ? "Archived Notifications" : "Recent Notifications"}
            </CardTitle>
            <div className="flex gap-2">
              {["all", "unread", "read"].map((status) => (
                <Button
                  key={status}
                  variant={filterRead === status ? "default" : "ghost"}
                  onClick={() => setFilterRead(status)}
                  className={filterRead === status ? "bg-slate-700" : ""}
                  size="sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-slate-700/50">
              {filteredNotifications.map((notification) => {
                const TypeIcon = TYPE_CONFIG[notification.type].icon;
                const CategoryIcon = CATEGORY_CONFIG[notification.category].icon;
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-slate-700/20",
                      !notification.read && "bg-blue-500/5 border-l-2 border-l-blue-500"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        TYPE_CONFIG[notification.type].bgColor
                      )}>
                        <TypeIcon className={cn("w-5 h-5", TYPE_CONFIG[notification.type].color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className={cn(
                              "font-medium",
                              notification.read ? "text-slate-300" : "text-white"
                            )}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-slate-400 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {CATEGORY_CONFIG[notification.category].label}
                            </Badge>
                            {notification.type === "action_required" && (
                              <Badge className="bg-orange-500/20 text-orange-400">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs">
                                {notification.actionLabel || "View"}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400"
                              onClick={(e) => { e.stopPropagation(); archiveNotification(notification.id); }}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                              onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <BellOff className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No notifications found</p>
              <p className="text-xs text-slate-500 mt-1">
                {showArchived ? "No archived notifications" : "You're all caught up!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
