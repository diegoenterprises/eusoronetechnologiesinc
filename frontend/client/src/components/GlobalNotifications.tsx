/**
 * GLOBAL NOTIFICATIONS COMPONENT
 * Real-time notification system with WebSocket integration
 * Displays toast notifications and provides notification bell in header
 * 
 * PRODUCTION-READY: Uses tRPC queries with WebSocket real-time updates
 */

import React, { useEffect, useCallback, useState } from "react";
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, Package, DollarSign, MapPin, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useNotifications as useRealtimeNotifications } from "@/hooks/useRealtimeEvents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface GlobalNotificationsProps {
  showBell?: boolean;
  maxVisible?: number;
}

export default function GlobalNotifications({ 
  showBell = true,
  maxVisible = 5,
}: GlobalNotificationsProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(new Set());

  // tRPC queries
  const { data: notificationData, isLoading, refetch } = trpc.notifications.list.useQuery(
    { limit: maxVisible, read: false },
    { refetchInterval: 30000 }
  );
  const { data: unreadCount = 0, refetch: refetchCount } = trpc.notifications.getUnreadCount.useQuery();

  // Mutations
  const markReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => { refetch(); refetchCount(); },
  });
  const markAllReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => { 
      toast.success("All notifications marked as read"); 
      refetch(); 
      refetchCount(); 
    },
  });

  // WebSocket real-time notifications
  const { notifications: realtimeNotifications, unreadCount: wsUnreadCount, markAsRead } = useRealtimeNotifications();

  // Show toast for new WebSocket notifications
  useEffect(() => {
    realtimeNotifications.forEach(notification => {
      if (!seenNotificationIds.has(notification.id)) {
        setSeenNotificationIds(prev => new Set([...prev, notification.id]));
        
        // Show toast notification
        const icon = getNotificationIcon(notification.type);
        toast(notification.title, {
          description: notification.message,
          icon,
          action: notification.actionUrl ? {
            label: notification.actionLabel || "View",
            onClick: () => navigate(notification.actionUrl!),
          } : undefined,
          duration: 5000,
        });

        // Refetch from server to sync
        refetch();
        refetchCount();
      }
    });
  }, [realtimeNotifications, seenNotificationIds, navigate, refetch, refetchCount]);

  // Combine server and WebSocket counts
  const totalUnread = Math.max(unreadCount, wsUnreadCount);

  // Get notification list from server data
  const notifications: Notification[] = notificationData?.notifications || [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "load_update":
      case "loads":
        return <Package className="w-4 h-4 text-blue-400" />;
      case "bid_received":
        return <DollarSign className="w-4 h-4 text-green-400" />;
      case "payment_received":
      case "billing":
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case "geofence_alert":
        return <MapPin className="w-4 h-4 text-purple-400" />;
      case "weather_alert":
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "compliance_expiring":
      case "compliance":
        return <Shield className="w-4 h-4 text-orange-400" />;
      case "safety":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "system":
        return <Settings className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markReadMutation.mutate({ id: notification.id });
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setIsOpen(false);
  };

  if (!showBell) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-[10px] font-bold border-0 rounded-full"
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-white">Notifications</span>
                {totalUnread > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                    {totalUnread} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllReadMutation.mutate({})}
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full bg-slate-800" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-slate-800/50",
                        !notification.read && "bg-cyan-500/5 border-l-2 border-cyan-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg mt-0.5",
                          notification.type === "success" ? "bg-green-500/20" :
                          notification.type === "warning" || notification.type === "weather_alert" ? "bg-yellow-500/20" :
                          notification.type === "safety" ? "bg-red-500/20" :
                          "bg-blue-500/20"
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium text-sm truncate",
                            notification.read ? "text-slate-400" : "text-white"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigate("/notifications"); setIsOpen(false); }}
                className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-slate-700"
              >
                View all notifications
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Hook for programmatic notifications
 * Use this to show toast notifications from anywhere in the app
 */
export function useGlobalNotifications() {
  const showNotification = useCallback((
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    actionUrl?: string,
    actionLabel?: string
  ) => {
    const navigate = useNavigate();
    
    const toastFn = type === "success" ? toast.success :
                    type === "warning" ? toast.warning :
                    type === "error" ? toast.error :
                    toast.info;
    
    toastFn(title, {
      description: message,
      action: actionUrl ? {
        label: actionLabel || "View",
        onClick: () => navigate(actionUrl),
      } : undefined,
      duration: 5000,
    });
  }, []);

  return { showNotification };
}
