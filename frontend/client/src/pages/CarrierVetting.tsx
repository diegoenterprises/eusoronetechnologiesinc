/**
 * CARRIER VETTING PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Search, Shield, CheckCircle, XCircle, AlertTriangle, Truck,
  FileText, Clock, Building, RefreshCw, Star, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CarrierVetting() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"mc" | "dot">("mc");

  const summaryQuery = trpc.carriers.getVettingSummary.useQuery();
  const pendingQuery = trpc.carriers.getPendingVetting.useQuery();
  const approvedQuery = trpc.carriers.getApproved.useQuery({ limit: 20 });

  const searchMutation = trpc.carriers.search.useMutation({
    onSuccess: (data) => {
      if (data.length === 0) {
        toast.info("No carriers found");
      }
    },
    onError: (error) => toast.error("Search failed", { description: error.message }),
  });

  const approveMutation = trpc.carriers.approve.useMutation({
    onSuccess: () => { toast.success("Carrier approved"); pendingQuery.refetch(); approvedQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = trpc.carriers.reject.useMutation({
    onSuccess: () => { toast.success("Carrier rejected"); pendingQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    searchMutation.mutate({ query: searchQuery, type: searchType });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AUTHORIZED": case "approved": return "bg-green-500/20 text-green-400";
      case "NOT AUTHORIZED": case "rejected": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case "Satisfactory": return "bg-green-500/20 text-green-400";
      case "Conditional": return "bg-yellow-500/20 text-yellow-400";
      case "Unsatisfactory": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const summary = summaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carrier Vetting</h1>
          <p className="text-slate-400 text-sm">SAFER/FMCSA carrier verification</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalCarriers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Carriers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.approved || 0}</p>
            )}
            <p className="text-xs text-slate-400">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
            )}
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
            )}
            <p className="text-xs text-slate-400">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="search" className="data-[state=active]:bg-blue-600">Search</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">Pending ({summary?.pending || 0})</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-blue-600">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Search className="w-5 h-5 text-blue-400" />Search FMCSA Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-2">
                  <Button variant={searchType === "mc" ? "default" : "outline"} size="sm" className={searchType === "mc" ? "bg-blue-600" : "border-slate-600"} onClick={() => setSearchType("mc")}>MC#</Button>
                  <Button variant={searchType === "dot" ? "default" : "outline"} size="sm" className={searchType === "dot" ? "bg-blue-600" : "border-slate-600"} onClick={() => setSearchType("dot")}>DOT#</Button>
                </div>
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Enter ${searchType.toUpperCase()} number...`} className="pl-9 bg-slate-700/50 border-slate-600" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSearch} disabled={searchMutation.isPending}>
                  {searchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Search Results */}
              {searchMutation.data && searchMutation.data.length > 0 && (
                <div className="space-y-4">
                  {searchMutation.data.map((carrier) => (
                    <Card key={carrier.id} className="bg-slate-700/30 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-bold text-lg">{carrier.legalName}</h3>
                              <Badge className={getStatusColor(carrier.operatingStatus)}>{carrier.operatingStatus}</Badge>
                              <Badge className={getSafetyColor(carrier.safetyRating)}>{carrier.safetyRating || "No Rating"}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div><span className="text-slate-500">MC#:</span> <span className="text-white">{carrier.mcNumber}</span></div>
                              <div><span className="text-slate-500">DOT#:</span> <span className="text-white">{carrier.dotNumber}</span></div>
                              <div><span className="text-slate-500">Power Units:</span> <span className="text-white">{carrier.powerUnits}</span></div>
                              <div><span className="text-slate-500">Drivers:</span> <span className="text-white">{carrier.drivers}</span></div>
                            </div>
                            <div className="mt-3 text-sm">
                              <span className="text-slate-500">Insurance:</span>
                              <span className="text-green-400 ml-2">Liability: ${(carrier.liabilityInsurance / 1000000).toFixed(1)}M</span>
                              <span className="text-blue-400 ml-4">Cargo: ${(carrier.cargoInsurance / 1000).toFixed(0)}K</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setLocation(`/carriers/${carrier.id}`)}><Eye className="w-4 h-4" /></Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ carrierId: carrier.id })} disabled={approveMutation.isPending}>
                              {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Pending Vetting</CardTitle></CardHeader>
            <CardContent>
              {pendingQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : pendingQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No pending carriers</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingQuery.data?.map((carrier) => (
                    <div key={carrier.id} className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-yellow-500/20"><Clock className="w-5 h-5 text-yellow-400" /></div>
                        <div>
                          <p className="text-white font-medium">{carrier.name}</p>
                          <p className="text-sm text-slate-400">MC# {carrier.mcNumber} | DOT# {carrier.dotNumber}</p>
                          <p className="text-xs text-slate-500">Submitted: {carrier.submittedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setLocation(`/carriers/${carrier.id}`)}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => rejectMutation.mutate({ carrierId: carrier.id })} disabled={rejectMutation.isPending}>
                          {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ carrierId: carrier.id })} disabled={approveMutation.isPending}>
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Approved Carriers</CardTitle></CardHeader>
            <CardContent>
              {approvedQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : approvedQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No approved carriers</p>
              ) : (
                <div className="space-y-3">
                  {approvedQuery.data?.map((carrier) => (
                    <div key={carrier.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/20"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                        <div>
                          <p className="text-white font-medium">{carrier.name}</p>
                          <p className="text-sm text-slate-400">MC# {carrier.mcNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span className="text-yellow-400">{carrier.rating}</span></div>
                        <Badge className="bg-green-500/20 text-green-400">{carrier.safetyRating}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/carriers/${carrier.id}`)}><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
