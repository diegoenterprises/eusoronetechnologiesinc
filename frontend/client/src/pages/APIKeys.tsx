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
  Key, Plus, Copy, Eye, EyeOff, Trash2,
  CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function APIKeys() {
  const [keyName, setKeyName] = useState("");
  const [showKey, setShowKey] = useState<string | null>(null);

  const keysQuery = trpc.apiKeys.list.useQuery();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => { toast.success("API key created"); keysQuery.refetch(); setKeyName(""); setShowKey(data.id); },
    onError: (error) => toast.error("Failed to create", { description: error.message }),
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => { toast.success("API key revoked"); keysQuery.refetch(); },
    onError: (error) => toast.error("Failed to revoke", { description: error.message }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "revoked": return <Badge className="bg-red-500/20 text-red-400 border-0">Revoked</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          API Keys
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your API keys for integrations</p>
      </div>

      {/* Create Key */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Create New API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g., Production API)" className="flex-1 bg-slate-800/50 border-slate-700/50 rounded-lg" />
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createMutation.mutate({ name: keyName })} disabled={!keyName || createMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />Create Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keys List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Your API Keys</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {keysQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : keysQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Key className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No API keys yet</p>
              <p className="text-slate-500 text-sm">Create your first API key to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {keysQuery.data?.map((key: any) => (
                <div key={key.id} className={cn("p-4", key.status === "revoked" && "opacity-50")}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{key.name}</p>
                        {getStatusBadge(key.status)}
                      </div>
                      <p className="text-xs text-slate-500">Created: {key.createdAt}</p>
                    </div>
                    {key.status === "active" && (
                      <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => revokeMutation.mutate({ keyId: key.id })}>
                        <Trash2 className="w-4 h-4 mr-1" />Revoke
                      </Button>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30">
                    <div className="flex items-center gap-2">
                      <code className="text-cyan-400 font-mono text-sm flex-1">
                        {showKey === key.id ? key.key : key.keyPrefix + "••••••••••••••••"}
                      </code>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowKey(showKey === key.id ? null : key.id)}>
                        {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => copyToClipboard(key.key)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Last used: {key.lastUsed || "Never"}</span>
                    <span>Requests: {key.requestCount?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation Link */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">API Documentation</p>
              <p className="text-sm text-slate-400">Learn how to use our API</p>
            </div>
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
