/**
 * ADMIN INTEGRATIONS PAGE
 * 100% Dynamic - Manage third-party integrations and APIs
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Plug, CheckCircle, XCircle, AlertTriangle, Settings,
  RefreshCw, ExternalLink, Clock, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminIntegrations() {
  const integrationsQuery = (trpc as any).admin.getIntegrations.useQuery();

  const toggleMutation = (trpc as any).admin.toggleIntegration.useMutation({
    onSuccess: () => {
      toast.success("Integration updated");
      integrationsQuery.refetch();
    },
  });

  const testIntegrationMutation = (trpc as any).admin.toggleIntegration.useMutation({
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success("Connection successful");
      } else {
        toast.error("Connection failed", { description: result.error });
      }
    },
  });

  const integrations = integrationsQuery.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-500/20 text-green-400";
      case "error": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "disabled": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error": return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending": return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <XCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const categories = [
    { key: "eld", label: "ELD Providers" },
    { key: "payment", label: "Payment Processing" },
    { key: "compliance", label: "Compliance Services" },
    { key: "maps", label: "Mapping & Navigation" },
    { key: "communication", label: "Communication" },
    { key: "accounting", label: "Accounting" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Integrations
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage third-party connections</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <Plug className="w-4 h-4 mr-2" />Browse Marketplace
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Plug className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{integrations.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-sm">Connected</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {integrations.filter((i: any) => i.status === "connected").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-slate-400 text-sm">Errors</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {integrations.filter((i: any) => i.status === "error").length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 text-sm">API Calls Today</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {integrations.reduce((sum: number, i: any) => sum + (i.apiCallsToday || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      {integrationsQuery.isLoading ? (
        <div className="space-y-4">{Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      ) : (
        categories.map((cat: any) => {
          const catIntegrations = integrations.filter((i: any) => i.category === cat.key);
          if (catIntegrations.length === 0) return null;

          return (
            <Card key={cat.key} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catIntegrations.map((integration: any) => (
                    <div
                      key={integration.id}
                      className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-600/50 flex items-center justify-center">
                            {integration.icon ? (
                              <img src={integration.icon} alt="" className="w-6 h-6" />
                            ) : (
                              <Plug className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{integration.name}</p>
                            <p className="text-slate-400 text-sm">{integration.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={(checked) => toggleMutation.mutate({
                            id: integration.id,
                            enabled: checked,
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(integration.status)}
                          <Badge className={cn("border-0", getStatusColor(integration.status))}>
                            {integration.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testIntegrationMutation.mutate({ id: integration.id })}
                            disabled={testIntegrationMutation.isPending}
                            className="text-slate-400"
                          >
                            <RefreshCw className={cn("w-4 h-4", testIntegrationMutation.isPending && "animate-spin")} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400">
                            <Settings className="w-4 h-4" />
                          </Button>
                          {integration.docsUrl && (
                            <Button variant="ghost" size="sm" className="text-slate-400">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {integration.lastSync && (
                        <p className="text-slate-500 text-xs mt-2">
                          Last sync: {integration.lastSync}
                        </p>
                      )}

                      {integration.status === "error" && integration.errorMessage && (
                        <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                          <p className="text-red-400 text-xs">{integration.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
