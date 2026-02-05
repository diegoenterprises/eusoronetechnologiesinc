/**
 * ADMIN API MANAGEMENT PAGE
 * 100% Dynamic - Manage API keys, webhooks, and integrations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Key, Search, Copy, Eye, EyeOff, Trash2,
  Plus, Activity, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminApiManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const apiKeysQuery = (trpc as any).admin.getApiKeys.useQuery();
  const statsQuery = (trpc as any).admin.getAPIStats.useQuery();

  const createKeyMutation = (trpc as any).admin.createApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key created");
      apiKeysQuery.refetch();
      statsQuery.refetch();
    },
  });

  const revokeKeyMutation = (trpc as any).admin.revokeApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key revoked");
      apiKeysQuery.refetch();
      statsQuery.refetch();
    },
  });

  const toggleKeyMutation = (trpc as any).admin.revokeApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key updated");
      apiKeysQuery.refetch();
    },
  });

  const apiKeys = apiKeysQuery.data || [];
  const stats = statsQuery.data;

  const filteredKeys = apiKeys.filter((k: any) =>
    k.name?.toLowerCase().includes(search.toLowerCase()) ||
    k.prefix?.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleSecret = (keyId: string) => {
    setShowSecrets(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            API Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage API keys, webhooks, and integrations</p>
        </div>
        <Button
          onClick={() => createKeyMutation.mutate({ name: "New API Key" } as any)}
          disabled={createKeyMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />Create API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Keys</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalKeys || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.activeKeys || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Requests Today</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.requestsToday?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Rate Limited</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.rateLimited || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Avg Latency</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.avgLatency || 0}ms</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search API keys..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeysQuery.isLoading ? (
          Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : filteredKeys.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Key className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No API keys found</p>
            </CardContent>
          </Card>
        ) : (
          filteredKeys.map((apiKey: any) => (
            <Card key={apiKey.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              apiKey.status === "revoked" && "opacity-60"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      apiKey.status === "active" ? "bg-green-500/20" :
                      apiKey.status === "revoked" ? "bg-red-500/20" :
                      "bg-slate-600/50"
                    )}>
                      <Key className={cn(
                        "w-6 h-6",
                        apiKey.status === "active" ? "text-green-400" :
                        apiKey.status === "revoked" ? "text-red-400" :
                        "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{apiKey.name}</p>
                      <p className="text-slate-400 text-sm">{apiKey.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {apiKey.status !== "revoked" && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">Enabled</span>
                        <Switch
                          checked={apiKey.status === "active"}
                          onCheckedChange={() => toggleKeyMutation.mutate({ keyId: apiKey.id })}
                        />
                      </div>
                    )}
                    <Badge className={cn(
                      "border-0",
                      apiKey.status === "active" ? "bg-green-500/20 text-green-400" :
                      apiKey.status === "revoked" ? "bg-red-500/20 text-red-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {apiKey.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">API Key:</span>
                      <code className="text-cyan-400 font-mono">
                        {showSecrets[apiKey.id] ? apiKey.fullKey : `${apiKey.prefix}...${apiKey.suffix}`}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecret(apiKey.id)}
                        className="text-slate-400"
                      >
                        {showSecrets[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.fullKey)}
                        className="text-slate-400"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Created</p>
                    <p className="text-white text-sm">{apiKey.createdAt}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Last Used</p>
                    <p className="text-white text-sm">{apiKey.lastUsed || "Never"}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Requests (24h)</p>
                    <p className="text-white text-sm font-bold">{apiKey.requests24h?.toLocaleString() || 0}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Rate Limit</p>
                    <p className="text-white text-sm">{apiKey.rateLimit}/min</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/20">
                    <p className="text-slate-400 text-xs">Expires</p>
                    <p className={cn(
                      "text-sm font-medium",
                      apiKey.expiresAt ? "text-yellow-400" : "text-green-400"
                    )}>
                      {apiKey.expiresAt || "Never"}
                    </p>
                  </div>
                </div>

                {apiKey.scopes && apiKey.scopes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {apiKey.scopes.map((scope: string) => (
                        <Badge key={scope} className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {apiKey.status !== "revoked" && (
                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeKeyMutation.mutate({ keyId: apiKey.id })}
                      disabled={revokeKeyMutation.isPending}
                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />Revoke Key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
