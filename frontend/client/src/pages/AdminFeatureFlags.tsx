/**
 * ADMIN FEATURE FLAGS PAGE
 * 100% Dynamic - Manage application feature flags and toggles
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Flag, Search, Plus, Settings, Users,
  Clock, AlertTriangle, CheckCircle, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminFeatureFlags() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const flagsQuery = trpc.admin.getFeatureFlags.useQuery();
  const statsQuery = trpc.admin.getSystemSettings.useQuery();

  const toggleFlagMutation = trpc.admin.toggleFeatureFlag.useMutation({
    onSuccess: () => {
      toast.success("Feature flag updated");
      flagsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const flags = flagsQuery.data || [];
  const stats = statsQuery.data;

  const filteredFlags = flags.filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.key?.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (flagId: string, currentValue: boolean) => {
    toggleFlagMutation.mutate({ flagId, enabled: !currentValue });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Feature Flags
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage application features and rollouts</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Flag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Flags</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.total || flags?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Enabled</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.enabled || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">In Rollout</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.inRollout || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.scheduled || 0}</p>
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flags..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="rollout">In Rollout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="core">Core Features</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Flags List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {flagsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredFlags.length === 0 ? (
            <div className="text-center py-16">
              <Flag className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No feature flags found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredFlags.map((flag: any) => (
                <div key={flag.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        flag.enabled ? "bg-green-500/20" : "bg-slate-600/50"
                      )}>
                        <Flag className={cn(
                          "w-6 h-6",
                          flag.enabled ? "text-green-400" : "text-slate-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{flag.name}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            flag.category === "experimental" ? "bg-purple-500/20 text-purple-400" :
                            flag.category === "beta" ? "bg-cyan-500/20 text-cyan-400" :
                            flag.category === "deprecated" ? "bg-red-500/20 text-red-400" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {flag.category}
                          </Badge>
                          {flag.isNew && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">NEW</Badge>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs font-mono">{flag.key}</p>
                        <p className="text-slate-400 text-sm mt-1">{flag.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100 && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Rollout</p>
                          <p className="text-purple-400 font-bold">{flag.rolloutPercentage}%</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Users className="w-3 h-3" />Affected</p>
                        <p className="text-white">{flag.affectedUsers?.toLocaleString() || "All"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Updated</p>
                        <p className="text-white">{flag.updatedAt}</p>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={() => handleToggle(flag.id, flag.enabled)}
                        disabled={toggleFlagMutation.isPending}
                      />
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {flag.dependencies && flag.dependencies.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-400 text-xs">Dependencies:</span>
                        {flag.dependencies.map((dep: string, idx: number) => (
                          <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs font-mono">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {flag.environments && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Environments:</span>
                      {flag.environments.map((env: any, idx: number) => (
                        <Badge key={idx} className={cn(
                          "border-0 text-xs",
                          env.enabled ? "bg-green-500/20 text-green-400" : "bg-slate-600/50 text-slate-400"
                        )}>
                          {env.name}
                        </Badge>
                      ))}
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
