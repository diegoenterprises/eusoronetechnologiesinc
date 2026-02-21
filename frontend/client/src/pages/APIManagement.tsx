/**
 * API MANAGEMENT PAGE
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
  Key, Search, CheckCircle, XCircle, Activity,
  Plus, Copy, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function APIManagement() {
  const [search, setSearch] = useState("");

  const keysQuery = (trpc as any).admin.getAPIKeys.useQuery({ search });
  const statsQuery = (trpc as any).admin.getAPIStats.useQuery();

  const revokeMutation = (trpc as any).admin.revokeAPIKey.useMutation({
    onSuccess: () => { toast.success("API key revoked"); keysQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "revoked": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Revoked</Badge>;
      case "expired": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">API Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage API keys and access</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Generate Key
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Key className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalKeys || 0}</p>}<p className="text-xs text-slate-400">Total Keys</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.activeKeys || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Activity className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.requestsToday?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Requests</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><XCircle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.revokedKeys || 0}</p>}<p className="text-xs text-slate-400">Revoked</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search API keys..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Key className="w-5 h-5 text-cyan-400" />API Keys</CardTitle></CardHeader>
        <CardContent className="p-0">
          {keysQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (keysQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Key className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No API keys found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(keysQuery.data as any)?.map((key: any) => (
                <div key={key.id} className={cn("p-4 flex items-center justify-between", key.status === "revoked" && "opacity-60")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", key.status === "active" ? "bg-green-500/20" : "bg-red-500/20")}>
                      <Key className={cn("w-5 h-5", key.status === "active" ? "text-green-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{key.name}</p>
                        {getStatusBadge(key.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-400 bg-white/[0.04] px-2 py-1 rounded">{key.keyPrefix}...{key.keySuffix}</code>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(key.fullKey); toast.success("Copied"); }}>
                          <Copy className="w-3 h-3 text-slate-400" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Created: {key.createdDate}</span>
                        <span>Last used: {key.lastUsed}</span>
                        <span>Requests: {key.requestCount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.status === "active" && (
                      <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg" onClick={() => revokeMutation.mutate({ id: key.id })}>
                        <Trash2 className="w-4 h-4 mr-1" />Revoke
                      </Button>
                    )}
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
