/**
 * NOTIFICATION CENTER PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  AlertTriangle, Info, CheckCircle, XCircle, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationCenter() {
  const [filter, setFilter] = useState("all");

  const notificationsQuery = trpc.user.getNotifications.useQuery({ filter, limit: 50 });
  const unreadCountQuery = trpc.user.getUnreadCount.useQuery();

  const markReadMutation = trpc.user.markNotificationRead.useMutation({
    onSuccess: () => { notificationsQuery.refetch(); unreadCountQuery.refetch(); },
  });

  const markAllReadMutation = trpc.user.markAllNotificationsRead.useMutation({
    onSuccess: () => { toast.success("All marked as read"); notificationsQuery.refetch(); unreadCountQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const deleteMutation = trpc.user.deleteNotification.useMutation({
    onSuccess: () => { toast.success("Notification deleted"); notificationsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const clearAllMutation = trpc.user.clearAllNotifications.useMutation({
    onSuccess: () => { toast.success("All notifications cleared"); notificationsQuery.refetch(); unreadCountQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "error": return <XCircle className="w-5 h-5 text-red-400" />;
      case "info": return <Info className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/20";
      case "warning": return "bg-yellow-500/20";
      case "error": return "bg-red-500/20";
      case "info": return "bg-blue-500/20";
      default: return "bg-slate-700/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Notification Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => markAllReadMutation.mutate({})}>
            <CheckCheck className="w-4 h-4 mr-2" />Mark All Read
          </Button>
          <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => clearAllMutation.mutate({})}>
            <Trash2 className="w-4 h-4 mr-2" />Clear All
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {unreadCountQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{unreadCountQuery.data?.unread || 0}</p>
                )}
                <p className="text-xs text-slate-400">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {unreadCountQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{unreadCountQuery.data?.read || 0}</p>
                )}
                <p className="text-xs text-slate-400">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {unreadCountQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{unreadCountQuery.data?.important || 0}</p>
                )}
                <p className="text-xs text-slate-400">Important</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-slate-500/20">
                <BellOff className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                {unreadCountQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-slate-400">{unreadCountQuery.data?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="important">Important</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notificationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : notificationsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No notifications</p>
              <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
              {notificationsQuery.data?.map((notification: any) => (
                <div key={notification.id} className={cn("p-4 flex items-start gap-4 hover:bg-slate-700/20 transition-colors", !notification.read && "bg-cyan-500/5 border-l-2 border-cyan-500")}>
                  <div className={cn("p-2 rounded-lg mt-1", getNotificationColor(notification.type))}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn("font-medium", notification.read ? "text-slate-400" : "text-white")}>{notification.title}</p>
                      {!notification.read && <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">New</Badge>}
                      {notification.important && <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Important</Badge>}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{notification.timestamp}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => markReadMutation.mutate({ notificationId: notification.id })}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate({ notificationId: notification.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
