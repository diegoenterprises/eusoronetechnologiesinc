/**
 * FEATURE FLAGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Flag, Search, Plus, Settings, Users,
  CheckCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FeatureFlags() {
  const [searchTerm, setSearchTerm] = useState("");

  const flagsQuery = (trpc as any).admin.getFeatureFlags.useQuery();

  const toggleMutation = (trpc as any).admin.toggleFeatureFlag.useMutation({
    onSuccess: () => { toast.success("Flag updated"); flagsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const filteredFlags = (flagsQuery.data as any)?.filter((flag: any) =>
    !searchTerm || flag.name?.toLowerCase().includes(searchTerm.toLowerCase()) || flag.key?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEnvironmentBadge = (env: string) => {
    switch (env) {
      case "production": return <Badge className="bg-red-500/20 text-red-400 border-0">Production</Badge>;
      case "staging": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Staging</Badge>;
      case "development": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Development</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{env}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Feature Flags
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage feature toggles and rollouts</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Flag
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Flag className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {flagsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(flagsQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Flags</p>
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
                {flagsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{(flagsQuery.data as any)?.filter((f: any) => f.enabled).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {flagsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{(flagsQuery.data as any)?.filter((f: any) => !f.enabled).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {flagsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{(flagsQuery.data as any)?.filter((f: any) => f.rolloutPercentage < 100).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Partial Rollout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search flags..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Flags List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {flagsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredFlags?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Flag className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No feature flags found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredFlags?.map((flag: any) => (
                <div key={flag.id} className={cn("p-4", flag.enabled && "bg-green-500/5 border-l-2 border-green-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", flag.enabled ? "bg-green-500/20" : "bg-slate-700/50")}>
                        <Flag className={cn("w-5 h-5", flag.enabled ? "text-green-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{flag.name}</p>
                          {getEnvironmentBadge(flag.environment)}
                          {flag.rolloutPercentage < 100 && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-0">{flag.rolloutPercentage}% rollout</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{flag.description}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{flag.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Switch checked={flag.enabled} onCheckedChange={(checked) => toggleMutation.mutate({ flagId: flag.id, enabled: checked })} />
                    </div>
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
