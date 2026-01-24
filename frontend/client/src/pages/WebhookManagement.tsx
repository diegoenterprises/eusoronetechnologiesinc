/**
 * WEBHOOK MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Webhook, Plus, CheckCircle, XCircle, RefreshCw,
  Trash2, Edit, Play, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function WebhookManagement() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvent, setWebhookEvent] = useState("load.created");

  const webhooksQuery = trpc.webhooks.list.useQuery({ limit: 20 });
  const eventsQuery = trpc.webhooks.getEvents.useQuery();
  const logsQuery = trpc.webhooks.getLogs.useQuery({ limit: 10 });

  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => { toast.success("Webhook created"); webhooksQuery.refetch(); setWebhookUrl(""); },
    onError: (error) => toast.error("Failed to create", { description: error.message }),
  });

  const testMutation = trpc.webhooks.test.useMutation({
    onSuccess: () => toast.success("Test webhook sent"),
    onError: (error) => toast.error("Test failed", { description: error.message }),
  });

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => { toast.success("Webhook deleted"); webhooksQuery.refetch(); },
    onError: (error) => toast.error("Failed to delete", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "inactive": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Inactive</Badge>;
      case "failing": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Failing</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Webhook Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure webhooks for real-time notifications</p>
      </div>

      {/* Create Webhook */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Add Webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-endpoint.com/webhook" className="flex-1 min-w-[300px] bg-slate-800/50 border-slate-700/50 rounded-lg" />
            <Select value={webhookEvent} onValueChange={setWebhookEvent}>
              <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventsQuery.data?.map((event: any) => (
                  <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createMutation.mutate({ url: webhookUrl, event: webhookEvent })} disabled={!webhookUrl || createMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />Add Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webhooks List */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Configured Webhooks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {webhooksQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : webhooksQuery.data?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Webhook className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No webhooks configured</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {webhooksQuery.data?.map((webhook: any) => (
                  <div key={webhook.id} className={cn("p-4", webhook.status === "failing" && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium font-mono text-sm">{webhook.url}</p>
                          {getStatusBadge(webhook.status)}
                        </div>
                        <p className="text-sm text-slate-400">Event: {webhook.event}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => testMutation.mutate({ id: webhook.id })}>
                          <Play className="w-3 h-3 mr-1" />Test
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMutation.mutate({ id: webhook.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created: {webhook.createdAt}</span>
                      <span>Last triggered: {webhook.lastTriggered || "Never"}</span>
                      <span>Success rate: {webhook.successRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : logsQuery.data?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent deliveries</p>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
                {logsQuery.data?.map((log: any) => (
                  <div key={log.id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm">{log.event}</span>
                      <Badge className={cn(log.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400", "border-0 text-xs")}>{log.statusCode}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{log.timestamp}</p>
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
