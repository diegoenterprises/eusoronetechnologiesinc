/**
 * NOTIFICATION CENTER PAGE
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
  Bell, CheckCircle, AlertTriangle, Info, Trash2,
  Check, Package, Truck, DollarSign, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("all");

  const notificationsQuery = trpc.notifications.list.useQuery({ limit: 50 });
  const summaryQuery = trpc.notifications.getSummary.useQuery();

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => { notificationsQuery.refetch(); summaryQuery.refetch(); },
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("All notifications marked as read"); notificationsQuery.refetch(); summaryQuery.refetch(); },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => { toast.success("Notification deleted"); notificationsQuery.refetch(); },
  });

  const summary = summaryQuery.data;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "load": return <Package className="w-5 h-5 text-blue-400" />;
      case "driver": return <Truck className="w-5 h-5 text-cyan-400" />;
      case "payment": return <DollarSign className="w-5 h-5 text-green-400" />;
      case "compliance": return <Shield className="w-5 h-5 text-purple-400" />;
      case "alert": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "info": return <Info className="w-5 h-5 text-slate-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge className="bg-red-500/20 text-red-400 border-0">Urgent</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High</Badge>;
      default: return null;
    }
  };

  const filteredNotifications = notificationsQuery.data?.filter((notification: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Notification Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Stay updated with important alerts</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
          <Check className="w-4 h-4 mr-2" />Mark All Read
        </Button>
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
                <Bell className="w-6 h-6 text-cyan-400" />
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
                  <p className="text-2xl font-bold text-red-400">{summary?.urgent || 0}</p>
                )}
                <p className="text-xs text-slate-400">Urgent</p>
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
          <TabsTrigger value="alert" className="data-[state=active]:bg-slate-700 rounded-md">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {notificationsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : filteredNotifications?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Bell className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredNotifications?.map((notification: any) => (
                    <div key={notification.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", !notification.read && "bg-cyan-500/5 border-l-2 border-cyan-500")}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-2 rounded-full", notification.type === "alert" ? "bg-red-500/20" : notification.type === "load" ? "bg-blue-500/20" : "bg-slate-700/50")}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className={cn("font-medium", notification.read ? "text-slate-400" : "text-white")}>{notification.title}</p>
                              {getPriorityBadge(notification.priority)}
                              {!notification.read && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                            </div>
                            <p className="text-sm text-slate-400">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notification.createdAt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => markReadMutation.mutate({ id: notification.id })}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMutation.mutate({ id: notification.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
