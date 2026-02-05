/**
 * BROADCAST MESSAGES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Megaphone, Send, Users, Clock, CheckCircle,
  Eye, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BroadcastMessages() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");

  const broadcastsQuery = (trpc as any).admin.getBroadcasts.useQuery({ limit: 20 });
  const audiencesQuery = (trpc as any).admin.getAudiences.useQuery();

  const sendMutation = (trpc as any).admin.sendBroadcast.useMutation({
    onSuccess: () => { toast.success("Broadcast sent"); broadcastsQuery.refetch(); setTitle(""); setMessage(""); },
    onError: (error: any) => toast.error("Failed to send", { description: error.message }),
  });

  const deleteMutation = (trpc as any).admin.deleteBroadcast.useMutation({
    onSuccess: () => { toast.success("Broadcast deleted"); broadcastsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to delete", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "draft": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Draft</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Broadcast Messages
        </h1>
        <p className="text-slate-400 text-sm mt-1">Send announcements to users</p>
      </div>

      {/* Compose Broadcast */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-cyan-400" />
            New Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="Broadcast title..." className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
          <Textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Write your message..." className="bg-slate-800/50 border-slate-700/50 rounded-lg min-h-[120px]" />
          <div className="flex items-center gap-4">
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {(audiencesQuery.data as any)?.map((aud: any) => (
                  <SelectItem key={aud.id} value={aud.id}>{aud.name} ({aud.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => sendMutation.mutate({ title, message, audience })} disabled={!title || !message || sendMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />Send Broadcast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Broadcasts */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Previous Broadcasts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {broadcastsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (broadcastsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Megaphone className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No broadcasts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(broadcastsQuery.data as any)?.map((broadcast: any) => (
                <div key={broadcast.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{broadcast.title}</p>
                        {getStatusBadge(broadcast.status)}
                      </div>
                      <p className="text-sm text-slate-400 mb-2 line-clamp-2">{broadcast.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{broadcast.audienceName}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{broadcast.readCount?.toLocaleString()} read</span>
                        <span>{broadcast.sentAt}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate({ broadcastId: broadcast.id })}>
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
