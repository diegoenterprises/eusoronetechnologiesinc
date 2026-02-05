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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Webhook, Search, CheckCircle, XCircle, Activity,
  Plus, Trash2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ConfirmationDialog";

export default function WebhookManagement() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const webhooksQuery = (trpc as any).admin.getWebhooks.useQuery({ search });
  const statsQuery = (trpc as any).admin.getWebhookStats.useQuery();

  const deleteMutation = (trpc as any).admin.deleteWebhook.useMutation({
    onSuccess: () => { toast.success("Webhook deleted"); webhooksQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const testMutation = (trpc as any).admin.testWebhook.useMutation({
    onSuccess: () => toast.success("Test sent successfully"),
    onError: (error: any) => toast.error("Test failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "inactive": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case "failing": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Failing</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Webhook Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage webhook endpoints</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Webhook
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Webhook className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Webhooks</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Activity className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.deliveriesToday?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Deliveries</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><XCircle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.failing || 0}</p>}<p className="text-xs text-slate-400">Failing</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search webhooks..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Webhook className="w-5 h-5 text-cyan-400" />Webhooks</CardTitle></CardHeader>
        <CardContent className="p-0">
          {webhooksQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (webhooksQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Webhook className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No webhooks found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(webhooksQuery.data as any)?.map((webhook: any) => (
                <div key={webhook.id} className={cn("p-4 flex items-center justify-between", webhook.status === "failing" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", webhook.status === "active" ? "bg-green-500/20" : webhook.status === "failing" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <Webhook className={cn("w-5 h-5", webhook.status === "active" ? "text-green-400" : webhook.status === "failing" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{webhook.name}</p>
                        {getStatusBadge(webhook.status)}
                      </div>
                      <code className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">{webhook.url}</code>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <span>Events: {webhook.events?.join(", ")}</span>
                        <span>Deliveries: {webhook.deliveryCount?.toLocaleString()}</span>
                        <span>Success rate: {webhook.successRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg" onClick={() => testMutation.mutate({ id: webhook.id })}>
                      <RefreshCw className="w-4 h-4 mr-1" />Test
                    </Button>
                    <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg" onClick={() => setDeleteId(webhook.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        itemName="this item"
        onConfirm={() => { if (deleteId) deleteMutation.mutate({ id: deleteId }); setDeleteId(null); }}
        isLoading={deleteMutation?.isPending}
      />
    </div>
  );
}
