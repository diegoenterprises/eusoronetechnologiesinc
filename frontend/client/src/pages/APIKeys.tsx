/**
 * API KEYS PAGE
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
  Key, Plus, Copy, Trash2, Eye, EyeOff,
  CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ApiKeys() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  const keysQuery = trpc.admin.getApiKeys.useQuery();

  const createMutation = trpc.admin.createApiKey.useMutation({
    onSuccess: (data) => { toast.success("API key created", { description: "Copy it now, it won't be shown again" }); keysQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const revokeMutation = trpc.admin.revokeApiKey.useMutation({
    onSuccess: () => { toast.success("API key revoked"); keysQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      case "revoked": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Revoked</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            API Keys
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage API access keys</p>
        </div>
      </div>

      {/* Create New Key */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Create New API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name (e.g., Production API)" className="flex-1 bg-slate-800/50 border-slate-700/50 rounded-lg" />
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => { createMutation.mutate({ name: newKeyName }); setNewKeyName(""); }} disabled={!newKeyName.trim()}>
              <Key className="w-4 h-4 mr-2" />Generate Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Key className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {keysQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{keysQuery.data?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Keys</p>
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
                {keysQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{keysQuery.data?.filter((k: any) => k.status === "active").length || 0}</p>
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
                {keysQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{keysQuery.data?.filter((k: any) => k.expiresIn && k.expiresIn < 7).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {keysQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{keysQuery.data?.filter((k: any) => k.status === "revoked").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Revoked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keys List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            Your API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {keysQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : keysQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <Key className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No API keys created yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {keysQuery.data?.map((key: any) => (
                <div key={key.id} className={cn("p-4", key.status !== "active" && "opacity-60")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", key.status === "active" ? "bg-green-500/20" : "bg-slate-700/50")}>
                        <Key className={cn("w-5 h-5", key.status === "active" ? "text-green-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{key.name}</p>
                          {getStatusBadge(key.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                            {showKey === key.id ? key.key : key.keyPreview}
                          </code>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 w-7 p-0" onClick={() => setShowKey(showKey === key.id ? null : key.id)}>
                            {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 w-7 p-0" onClick={() => copyToClipboard(key.key)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span>Created: {key.createdAt}</span>
                          <span>Last used: {key.lastUsed || "Never"}</span>
                          {key.expiresAt && <span>Expires: {key.expiresAt}</span>}
                        </div>
                      </div>
                    </div>
                    {key.status === "active" && (
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => revokeMutation.mutate({ keyId: key.id })}>
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
