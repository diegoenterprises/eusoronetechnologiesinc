/**
 * INTEGRATION SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Plug, CheckCircle, XCircle, Settings, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const integrationsQuery = (trpc as any).admin.getIntegrations.useQuery();
  const statsQuery = (trpc as any).admin.getIntegrationStats.useQuery();

  const toggleMutation = (trpc as any).admin.toggleIntegration.useMutation({
    onSuccess: () => { toast.success("Integration updated"); integrationsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const syncMutation = (trpc as any).admin.syncIntegration.useMutation({
    onSuccess: () => toast.success("Sync started"),
    onError: (error: any) => toast.error("Sync failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case "disconnected": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case "error": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Error</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Integration Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage third-party integrations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Plug className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Integrations</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.connected || 0}</p>}<p className="text-xs text-slate-400">Connected</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><RefreshCw className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.syncsToday?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Syncs</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><XCircle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.errors || 0}</p>}<p className="text-xs text-slate-400">Errors</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Plug className="w-5 h-5 text-cyan-400" />Available Integrations</CardTitle></CardHeader>
        <CardContent>
          {integrationsQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(integrationsQuery.data as any)?.map((integration: any) => (
                <div key={integration.id} className={cn("p-4 rounded-xl border", integration.status === "connected" ? "bg-green-500/5 border-green-500/30" : integration.status === "error" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", integration.status === "connected" ? "bg-green-500/20" : "bg-slate-600/50")}>
                        <Plug className={cn("w-5 h-5", integration.status === "connected" ? "text-green-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{integration.name}</p>
                        <p className="text-xs text-slate-500">{integration.category}</p>
                      </div>
                    </div>
                    <Switch checked={integration.enabled} onCheckedChange={() => toggleMutation.mutate({ id: integration.id })} />
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{integration.description}</p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(integration.status)}
                    <div className="flex items-center gap-2">
                      {integration.status === "connected" && (
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg h-7 text-xs" onClick={() => syncMutation.mutate({ id: integration.id })}>
                          <RefreshCw className="w-3 h-3 mr-1" />Sync
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg h-7 text-xs">
                        <Settings className="w-3 h-3 mr-1" />Configure
                      </Button>
                    </div>
                  </div>
                  {integration.lastSync && <p className="text-xs text-slate-500 mt-2">Last sync: {integration.lastSync}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
