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
  Plug, CheckCircle, XCircle, Settings, RefreshCw,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const integrationsQuery = trpc.integrations.list.useQuery();

  const connectMutation = trpc.integrations.connect.useMutation({
    onSuccess: () => { toast.success("Integration connected"); integrationsQuery.refetch(); },
    onError: (error) => toast.error("Failed to connect", { description: error.message }),
  });

  const disconnectMutation = trpc.integrations.disconnect.useMutation({
    onSuccess: () => { toast.success("Integration disconnected"); integrationsQuery.refetch(); },
    onError: (error) => toast.error("Failed to disconnect", { description: error.message }),
  });

  const toggleMutation = trpc.integrations.toggle.useMutation({
    onSuccess: () => { toast.success("Integration updated"); integrationsQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case "disconnected": return <Badge className="bg-slate-500/20 text-slate-400 border-0"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case "error": return <Badge className="bg-red-500/20 text-red-400 border-0">Error</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Integrations
        </h1>
        <p className="text-slate-400 text-sm mt-1">Connect with third-party services</p>
      </div>

      {/* Integrations List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plug className="w-5 h-5 text-cyan-400" />
            Available Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {integrationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : integrationsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Plug className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No integrations available</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {integrationsQuery.data?.map((integration: any) => (
                <div key={integration.id} className={cn("p-4", integration.status === "error" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", integration.status === "connected" ? "bg-green-500/20" : "bg-slate-700/50")}>
                        <Plug className={cn("w-6 h-6", integration.status === "connected" ? "text-green-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{integration.name}</p>
                          {getStatusBadge(integration.status)}
                        </div>
                        <p className="text-sm text-slate-400">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {integration.status === "connected" && (
                        <Switch checked={integration.enabled} onCheckedChange={() => toggleMutation.mutate({ integrationId: integration.id, enabled: !integration.enabled })} />
                      )}
                      {integration.status === "connected" ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => disconnectMutation.mutate({ integrationId: integration.id })}>
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => connectMutation.mutate({ integrationId: integration.id })}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                  {integration.status === "connected" && integration.lastSync && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 pl-16">
                      <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />Last sync: {integration.lastSync}</span>
                      {integration.docsUrl && (
                        <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                          <ExternalLink className="w-3 h-3" />Documentation
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
