/**
 * NOTIFICATIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, CheckCircle, AlertTriangle, Info, Package,
  DollarSign, Users, Clock, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("all");

  const notificationsQuery = (trpc as any).notifications.list.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).notifications.getSummary.useQuery();

  const markReadMutation = (trpc as any).notifications.markAsRead.useMutation({
    onSuccess: () => { notificationsQuery.refetch(); summaryQuery.refetch(); },
  });

  const markAllReadMutation = (trpc as any).notifications.markAllAsRead.useMutation({
    onSuccess: () => { toast.success("All notifications marked as read"); notificationsQuery.refetch(); summaryQuery.refetch(); },
  });

  const summary = summaryQuery.data;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "load": return <Package className="w-5 h-5 text-blue-400" />;
      case "payment": return <DollarSign className="w-5 h-5 text-green-400" />;
      case "alert": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "user": return <Users className="w-5 h-5 text-purple-400" />;
      default: return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "load": return "bg-blue-500/20";
      case "payment": return "bg-green-500/20";
      case "alert": return "bg-red-500/20";
      case "user": return "bg-purple-500/20";
      default: return "bg-cyan-500/20";
    }
  };

  const filteredNotifications = (notificationsQuery.data as any)?.notifications?.filter((n: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.type === activeTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Stay updated with your latest activities</p>
        </div>
        <div className="flex items-center gap-3">
          {(summary?.unread || 0) > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
              <span className="text-cyan-400 text-sm font-medium">Unread</span>
              <span className="text-cyan-400 font-bold">{summary?.unread || 0}</span>
            </div>
          )}
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => markAllReadMutation.mutate()}>
            <Check className="w-4 h-4 mr-2" />Mark All Read
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.unread || 0}</p>
                )}
                <p className="text-xs text-slate-400">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.alerts || 0}</p>
                )}
                <p className="text-xs text-slate-400">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.read || 0}</p>
                )}
                <p className="text-xs text-slate-400">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-slate-700 rounded-md">Unread</TabsTrigger>
          <TabsTrigger value="load" className="data-[state=active]:bg-slate-700 rounded-md">Loads</TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-slate-700 rounded-md">Payments</TabsTrigger>
          <TabsTrigger value="alert" className="data-[state=active]:bg-slate-700 rounded-md">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {notificationsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : filteredNotifications?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Bell className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No notifications</p>
                  <p className="text-slate-500 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredNotifications?.map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", !notification.read && "bg-cyan-500/5 border-l-2 border-cyan-500")}
                      onClick={() => !notification.read && markReadMutation.mutate({ id: notification.id })}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-full", getNotificationBg(notification.type))}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn("font-medium", notification.read ? "text-slate-400" : "text-white")}>{notification.title}</p>
                            <span className="text-xs text-slate-500">{notification.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-400">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
