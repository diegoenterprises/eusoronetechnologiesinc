/**
 * API DOCUMENTATION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Code, Search, Key, Copy, CheckCircle, ExternalLink,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function APIDocumentation() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const apiKeyQuery = (trpc as any).developer.getAPIKey.useQuery();
  const endpointsQuery = (trpc as any).developer.getEndpoints.useQuery();
  const usageQuery = (trpc as any).developer.getAPIUsage.useQuery();

  const regenerateMutation = (trpc as any).developer.regenerateAPIKey.useMutation({
    onSuccess: () => { toast.success("API key regenerated"); apiKeyQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to regenerate key", { description: error.message }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const filteredEndpoints = (endpointsQuery.data as any)?.filter((endpoint: any) =>
    !searchTerm || endpoint.name?.toLowerCase().includes(searchTerm.toLowerCase()) || endpoint.path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "GET": return <Badge className="bg-green-500/20 text-green-400 border-0">GET</Badge>;
      case "POST": return <Badge className="bg-blue-500/20 text-blue-400 border-0">POST</Badge>;
      case "PUT": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">PUT</Badge>;
      case "DELETE": return <Badge className="bg-red-500/20 text-red-400 border-0">DELETE</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{method}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            API Documentation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Integrate with EusoTrip API</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <ExternalLink className="w-4 h-4 mr-2" />View Full Docs
        </Button>
      </div>

      {/* API Key */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            Your API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeyQuery.isLoading ? (
            <Skeleton className="h-12 w-full rounded-xl" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 rounded-xl bg-slate-800/50 font-mono text-sm text-slate-300 overflow-x-auto">
                {(apiKeyQuery.data as any)?.key || "No API key generated"}
              </div>
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => copyToClipboard((apiKeyQuery.data as any)?.key || "")}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => regenerateMutation.mutate()}>
                Regenerate
              </Button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">Keep your API key secure. Do not share it publicly.</p>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(usageQuery.data as any)?.totalRequests?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Requests</p>
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
                {usageQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{(usageQuery.data as any)?.successRate}%</p>
                )}
                <p className="text-xs text-slate-400">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Code className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{(usageQuery.data as any)?.avgLatency}ms</p>
                )}
                <p className="text-xs text-slate-400">Avg Latency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Code className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{(usageQuery.data as any)?.remainingQuota?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Remaining Quota</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search endpoints..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Endpoints */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {endpointsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : filteredEndpoints?.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No endpoints found</p>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredEndpoints?.map((endpoint: any) => (
                <div key={endpoint.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getMethodBadge(endpoint.method)}
                      <div>
                        <p className="text-white font-medium font-mono">{endpoint.path}</p>
                        <p className="text-sm text-slate-400">{endpoint.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
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
