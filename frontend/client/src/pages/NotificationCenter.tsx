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
  Bell, CheckCircle, AlertTriangle, Info, Trash2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationCenter() {
  const [filter, setFilter] = useState("all");

  const notificationsQuery = (trpc as any).notifications.list.useQuery({ category: filter === "all" ? undefined : filter as any });
  const countQuery = (trpc as any).notifications.getUnreadCount.useQuery();

  const markReadMutation = (trpc as any).notifications.markAsRead.useMutation({
    onSuccess: () => { notificationsQuery.refetch(); countQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const markAllReadMutation = (trpc as any).notifications.markAllAsRead.useMutation({
    onSuccess: () => { toast.success("All marked as read"); notificationsQuery.refetch(); countQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const archiveMutation = (trpc as any).notifications.archive.useMutation({
    onSuccess: () => { toast.success("Notification archived"); notificationsQuery.refetch(); countQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const unreadCount = countQuery.data || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "error": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Notification Center</h1>
          <p className="text-slate-400 text-sm mt-1">View all notifications</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg" onClick={() => markAllReadMutation.mutate({})}>
          <Check className="w-4 h-4 mr-2" />Mark All Read
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Bell className="w-6 h-6 text-cyan-400" /></div>
              <div>{countQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{(notificationsQuery.data as any)?.notifications?.length || (notificationsQuery.data as any)?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><Bell className="w-6 h-6 text-red-400" /></div>
              <div>{countQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{unreadCount}</p>}<p className="text-xs text-slate-400">Unread</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><AlertTriangle className="w-6 h-6 text-yellow-400" /></div>
              <div>{countQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{(notificationsQuery.data as any)?.notifications?.filter((n: any) => n.category === 'safety').length || 0}</p>}<p className="text-xs text-slate-400">Safety</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{countQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{(notificationsQuery.data as any)?.notifications?.filter((n: any) => n.read).length || 0}</p>}<p className="text-xs text-slate-400">Read</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="unread">Unread</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="warning">Warnings</SelectItem>
          <SelectItem value="error">Errors</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-cyan-400" />Notifications</CardTitle></CardHeader>
        <CardContent className="p-0">
          {notificationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : !notificationsQuery.data || (Array.isArray(notificationsQuery.data) && notificationsQuery.data.length === 0) || ((notificationsQuery.data as any)?.notifications && notificationsQuery.data.notifications.length === 0) ? (
            <div className="text-center py-16"><Bell className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No notifications</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(notificationsQuery.data) ? notificationsQuery.data : (notificationsQuery.data as any)?.notifications || [])?.map((notification: any) => (
                <div key={notification.id} className={cn("p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-700/30 transition-colors", !notification.read && "bg-cyan-500/5 border-l-2 border-cyan-500")} onClick={() => !notification.read && markReadMutation.mutate({ id: notification.id })}>
                  <div className={cn("p-2 rounded-lg mt-1", notification.type === "success" ? "bg-green-500/20" : notification.type === "warning" ? "bg-yellow-500/20" : notification.type === "error" ? "bg-red-500/20" : "bg-blue-500/20")}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn("font-medium", notification.read ? "text-slate-400" : "text-white")}>{notification.title}</p>
                      {!notification.read && <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{notification.message}</p>
                    <p className="text-xs text-slate-600 mt-1">{notification.timestamp}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-400" onClick={(e: any) => { e.stopPropagation(); archiveMutation.mutate({ id: notification.id }); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
