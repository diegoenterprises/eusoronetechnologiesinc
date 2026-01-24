/**
 * NOTIFICATION CENTER PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Settings,
  AlertTriangle, Info, CheckCircle, XCircle, Clock,
  Truck, FileText, DollarSign, Shield, MessageSquare, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const notificationsQuery = trpc.notifications.list.useQuery({
    category: activeTab !== "all" && activeTab !== "settings" ? activeTab : undefined,
    unreadOnly: showUnreadOnly,
  });
  const preferencesQuery = trpc.notifications.getPreferences.useQuery();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => { toast.success("Marked as read"); notificationsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const markAllReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => { toast.success("All notifications marked as read"); notificationsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => { toast.success("Notification deleted"); notificationsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const clearAllMutation = trpc.notifications.clearAll.useMutation({
    onSuccess: () => { toast.success("All notifications cleared"); notificationsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const updatePreferencesMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => { toast.success("Preferences saved"); preferencesQuery.refetch(); },
    onError: (error) => toast.error("Failed to save", { description: error.message }),
  });

  if (notificationsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading notifications</p>
        <Button className="mt-4" onClick={() => notificationsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const unreadCount = notificationsQuery.data?.filter(n => !n.read).length || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case "info": return <Info className="w-5 h-5 text-blue-400" />;
      case "success": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "error": return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert": return "bg-orange-500/10 border-orange-500/30";
      case "info": return "bg-blue-500/10 border-blue-500/30";
      case "success": return "bg-green-500/10 border-green-500/30";
      case "warning": return "bg-yellow-500/10 border-yellow-500/30";
      case "error": return "bg-red-500/10 border-red-500/30";
      default: return "bg-slate-500/10 border-slate-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "load": return Truck;
      case "compliance": return FileText;
      case "payment": return DollarSign;
      case "safety": return Shield;
      case "message": return MessageSquare;
      default: return Bell;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const notifications = notificationsQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            {markAllReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCheck className="w-4 h-4 mr-2" />Mark All Read</>}
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600" onClick={() => clearAllMutation.mutate()} disabled={clearAllMutation.isPending}>
            {clearAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" />Clear All</>}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {["all", "load", "compliance", "payment", "safety", "message"].map((cat) => {
          const CategoryIcon = getCategoryIcon(cat);
          const count = cat === "all" ? notifications.length : notifications.filter(n => n.category === cat).length;
          return (
            <Card key={cat} className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === cat && "border-blue-500")} onClick={() => setActiveTab(cat)}>
              <CardContent className="p-4 text-center">
                <CategoryIcon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                {notificationsQuery.isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : (
                  <p className="text-2xl font-bold text-white">{count}</p>
                )}
                <p className="text-xs text-slate-400 capitalize">{cat}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">All</TabsTrigger>
            <TabsTrigger value="load" className="data-[state=active]:bg-blue-600">Loads</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-blue-600">Compliance</TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-blue-600">Safety</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">Settings</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Switch id="unread-only" checked={showUnreadOnly} onCheckedChange={setShowUnreadOnly} />
            <Label htmlFor="unread-only" className="text-slate-400 text-sm">Unread only</Label>
          </div>
        </div>

        {/* Notifications List */}
        {["all", "load", "compliance", "safety"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                {notificationsQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {notifications.map((notification) => {
                      const CategoryIcon = getCategoryIcon(notification.category);
                      return (
                        <div key={notification.id} className={cn("flex items-start gap-4 p-4 hover:bg-slate-700/30 transition-colors", !notification.read && "bg-slate-700/20")}>
                          <div className={cn("p-2 rounded-lg", getTypeColor(notification.type))}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("font-medium", notification.read ? "text-slate-300" : "text-white")}>{notification.title}</p>
                              {!notification.read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{formatTime(notification.timestamp)}
                              </span>
                              <Badge variant="outline" className="text-xs border-slate-600">
                                <CategoryIcon className="w-3 h-3 mr-1" />{notification.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <Button variant="outline" size="sm" className="border-slate-600">{notification.actionLabel || "View"}</Button>
                            )}
                            {!notification.read && (
                              <Button variant="ghost" size="sm" onClick={() => markAsReadMutation.mutate({ id: notification.id })} disabled={markAsReadMutation.isPending}>
                                {markAsReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: notification.id })} disabled={deleteMutation.isPending}>
                              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-slate-500" />}
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
        ))}

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700">
                    <div className="text-slate-400 text-sm">Category</div>
                    <div className="text-slate-400 text-sm text-center">Email</div>
                    <div className="text-slate-400 text-sm text-center">Push</div>
                    <div className="text-slate-400 text-sm text-center">SMS</div>
                  </div>
                  {preferencesQuery.data?.map((pref) => {
                    const CategoryIcon = getCategoryIcon(pref.category);
                    return (
                      <div key={pref.category} className="grid grid-cols-4 gap-4 items-center py-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-white">{pref.label}</span>
                        </div>
                        <div className="flex justify-center"><Switch defaultChecked={pref.email} /></div>
                        <div className="flex justify-center"><Switch defaultChecked={pref.push} /></div>
                        <div className="flex justify-center"><Switch defaultChecked={pref.sms} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => updatePreferencesMutation.mutate({})} disabled={updatePreferencesMutation.isPending}>
                  {updatePreferencesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
