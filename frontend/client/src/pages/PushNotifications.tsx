/**
 * PUSH NOTIFICATIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, Send, Users, Smartphone, CheckCircle,
  Settings, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PushNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const statsQuery = trpc.push.getStats.useQuery();
  const settingsQuery = trpc.push.getSettings.useQuery();
  const recentQuery = trpc.push.getRecent.useQuery({ limit: 10 });

  const sendMutation = trpc.push.send.useMutation({
    onSuccess: () => { toast.success("Notification sent"); setTitle(""); setMessage(""); recentQuery.refetch(); },
    onError: (error) => toast.error("Failed to send", { description: error.message }),
  });

  const toggleMutation = trpc.push.toggleSetting.useMutation({
    onSuccess: () => { toast.success("Setting updated"); settingsQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Push Notifications
        </h1>
        <p className="text-slate-400 text-sm mt-1">Send and manage push notifications</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.registeredDevices?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Registered Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Bell className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.sentThisMonth?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Sent This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{stats?.deliveryRate}%</p>
                )}
                <p className="text-xs text-slate-400">Delivery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.openRate}%</p>
                )}
                <p className="text-xs text-slate-400">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Send New Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..." className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Notification message..." className="bg-slate-800/50 border-slate-700/50 rounded-lg min-h-[100px]" />
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => sendMutation.mutate({ title, message })} disabled={!title || !message || sendMutation.isPending}>
            <Send className="w-4 h-4 mr-2" />Send to All Users
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Notification Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {settingsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {settingsQuery.data?.map((setting: any) => (
                  <div key={setting.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{setting.name}</p>
                      <p className="text-xs text-slate-500">{setting.description}</p>
                    </div>
                    <Switch checked={setting.enabled} onCheckedChange={() => toggleMutation.mutate({ settingId: setting.id, enabled: !setting.enabled })} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : recentQuery.data?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent notifications</p>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
                {recentQuery.data?.map((notif: any) => (
                  <div key={notif.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{notif.title}</span>
                      <Badge className={cn(notif.status === "delivered" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400", "border-0 text-xs")}>{notif.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{notif.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>{notif.sentAt}</span>
                      <span>{notif.recipients?.toLocaleString()} recipients</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
