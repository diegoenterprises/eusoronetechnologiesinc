/**
 * CONNECTED APPS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Link2, Unlink, CheckCircle, Clock, Shield,
  ExternalLink, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ConnectedApps() {
  const appsQuery = (trpc as any).users.getConnectedApps.useQuery();

  const disconnectMutation = (trpc as any).users.disconnectApp.useMutation({
    onSuccess: () => { toast.success("App disconnected"); appsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const refreshMutation = (trpc as any).users.refreshAppConnection.useMutation({
    onSuccess: () => { toast.success("Connection refreshed"); appsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Connected Apps
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage third-party app connections</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Link2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {appsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(appsQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Connected Apps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {appsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{(appsQuery.data as any)?.filter((a: any) => a.status === "active").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {appsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(appsQuery.data as any)?.filter((a: any) => a.status === "expired").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apps List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Your Connected Apps
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (appsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Link2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No connected apps</p>
              <p className="text-sm text-slate-500 mt-1">Connect apps to extend functionality</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(appsQuery.data as any)?.map((app: any) => (
                <div key={app.id} className={cn("p-4", app.status === "expired" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", app.status === "active" ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20" : "bg-slate-700/50")}>
                        {app.icon ? <img src={app.icon} alt={app.name} className="w-8 h-8 rounded" /> : <Link2 className="w-6 h-6 text-slate-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{app.name}</p>
                          {app.status === "active" ? (
                            <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expired</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{app.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Connected: {app.connectedAt}</span>
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{app.permissions?.length || 0} permissions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.status === "expired" && (
                        <Button size="sm" variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 rounded-lg" onClick={() => refreshMutation.mutate({ appId: app.id })}>
                          <RefreshCw className="w-4 h-4 mr-1" />Reconnect
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => disconnectMutation.mutate({ appId: app.id })}>
                        <Unlink className="w-4 h-4 mr-1" />Disconnect
                      </Button>
                    </div>
                  </div>

                  {/* Permissions */}
                  {app.permissions?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-2">Permissions granted:</p>
                      <div className="flex flex-wrap gap-2">
                        {app.permissions.map((perm: string, idx: number) => (
                          <Badge key={idx} className="bg-slate-700/50 text-slate-300 border-0 text-xs">{perm}</Badge>
                        ))}
                      </div>
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
