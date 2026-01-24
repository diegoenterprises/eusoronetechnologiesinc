/**
 * NOTIFICATIONS CENTER PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, CheckCircle, AlertTriangle, Info, Clock,
  Trash2, Eye, Settings, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationsCenter() {
  const [activeTab, setActiveTab] = useState("all");

  const notificationsQuery = trpc.notifications.list.useQuery({
    type: activeTab !== "all" ? activeTab : undefined,
  });
  const unreadCountQuery = trpc.notifications.getUnreadCount.useQuery();

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => { notificationsQuery.refetch(); unreadCountQuery.refetch(); },
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("All marked as read"); notificationsQuery.refetch(); unreadCountQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => { toast.success("Notification deleted"); notificationsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert": return AlertTriangle;
      case "success": return CheckCircle;
      case "info": return Info;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert": return "bg-red-500/20 text-red-400";
      case "success": return "bg-green-500/20 text-green-400";
      case "info": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">
            {unreadCountQuery.data || 0} unread notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            {markAllReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Mark All Read
          </Button>
          <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">All</TabsTrigger>
          <TabsTrigger value="alert" className="data-[state=active]:bg-blue-600">Alerts</TabsTrigger>
          <TabsTrigger value="info" className="data-[state=active]:bg-blue-600">Info</TabsTrigger>
          <TabsTrigger value="success" className="data-[state=active]:bg-blue-600">Success</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {notificationsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : notificationsQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {notificationsQuery.data?.map((notification) => {
                    const TypeIcon = getTypeIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 hover:bg-slate-700/30 transition-colors",
                          !notification.read && "bg-blue-500/5"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", getTypeColor(notification.type))}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn("font-medium", notification.read ? "text-slate-400" : "text-white")}>{notification.title}</p>
                            {!notification.read && <Badge className="bg-blue-500/20 text-blue-400 text-xs">New</Badge>}
                          </div>
                          <p className="text-sm text-slate-400">{notification.message}</p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{notification.createdAt}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate({ id: notification.id })}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: notification.id })} disabled={deleteMutation.isPending}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
