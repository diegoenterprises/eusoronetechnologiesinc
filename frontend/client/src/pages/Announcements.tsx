/**
 * ANNOUNCEMENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Megaphone, Bell, CheckCircle, Calendar, ChevronRight,
  AlertTriangle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Announcements() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const announcementsQuery = trpc.announcements.list.useQuery({ limit: 20 });
  const unreadQuery = trpc.announcements.getUnreadCount.useQuery();

  const markReadMutation = trpc.announcements.markRead.useMutation({
    onSuccess: () => { unreadQuery.refetch(); },
  });

  const markAllReadMutation = trpc.announcements.markAllRead.useMutation({
    onSuccess: () => { toast.success("All marked as read"); unreadQuery.refetch(); announcementsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "important": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Important</Badge>;
      case "update": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Update</Badge>;
      case "maintenance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Maintenance</Badge>;
      case "info": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><Info className="w-3 h-3 mr-1" />Info</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "important": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "update": return <Bell className="w-5 h-5 text-blue-400" />;
      case "maintenance": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Megaphone className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Announcements
          </h1>
          <p className="text-slate-400 text-sm mt-1">Important updates and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadQuery.data?.count > 0 && (
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0">{unreadQuery.data.count} unread</Badge>
          )}
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => markAllReadMutation.mutate({})}>
            <CheckCircle className="w-4 h-4 mr-2" />Mark All Read
          </Button>
        </div>
      </div>

      {/* Announcements List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {announcementsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : announcementsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Megaphone className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No announcements</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {announcementsQuery.data?.map((announcement: any) => (
                <div key={announcement.id} className={cn("p-4 transition-colors", !announcement.read && "bg-cyan-500/5 border-l-2 border-cyan-500")} onClick={() => { setExpandedId(expandedId === announcement.id ? null : announcement.id); if (!announcement.read) markReadMutation.mutate({ id: announcement.id }); }}>
                  <div className="flex items-start gap-4 cursor-pointer">
                    <div className={cn("p-3 rounded-xl", announcement.type === "important" ? "bg-red-500/20" : announcement.type === "maintenance" ? "bg-yellow-500/20" : "bg-cyan-500/20")}>
                      {getTypeIcon(announcement.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{announcement.title}</p>
                        {getTypeBadge(announcement.type)}
                        {!announcement.read && <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">New</Badge>}
                      </div>
                      <p className="text-sm text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{announcement.date}</p>
                      {expandedId === announcement.id ? (
                        <div className="mt-3 text-slate-300">{announcement.content}</div>
                      ) : (
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">{announcement.preview}</p>
                      )}
                    </div>
                    <ChevronRight className={cn("w-5 h-5 text-slate-500 transition-transform", expandedId === announcement.id && "rotate-90")} />
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
