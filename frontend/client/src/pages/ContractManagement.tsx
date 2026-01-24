/**
 * CONTRACT MANAGEMENT PAGE
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
  FileText, CheckCircle, Clock, AlertTriangle, Search,
  Plus, Eye, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function ContractManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");

  const contractsQuery = trpc.contracts.list.useQuery({ limit: 50 });
  const summaryQuery = trpc.contracts.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "expiring": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Expiring</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0">Expired</Badge>;
      case "draft": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Draft</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredContracts = contractsQuery.data?.filter((contract: any) => {
    const matchesSearch = !searchTerm || 
      contract.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.partyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || contract.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Contract Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage carrier and shipper contracts</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Contract
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summary?.expiring || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <FileText className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search contracts..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="active" className="data-[state=active]:bg-slate-700 rounded-md">Active</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">Pending</TabsTrigger>
          <TabsTrigger value="expiring" className="data-[state=active]:bg-slate-700 rounded-md">Expiring</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {contractsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : filteredContracts?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No contracts found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredContracts?.map((contract: any) => (
                    <div key={contract.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", contract.status === "expiring" && "bg-orange-500/5 border-l-2 border-orange-500")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", contract.status === "active" ? "bg-green-500/20" : contract.status === "expiring" ? "bg-orange-500/20" : "bg-blue-500/20")}>
                            <FileText className={cn("w-6 h-6", contract.status === "active" ? "text-green-400" : contract.status === "expiring" ? "text-orange-400" : "text-blue-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{contract.name}</p>
                              {getStatusBadge(contract.status)}
                            </div>
                            <p className="text-sm text-slate-400">{contract.partyName}</p>
                            <p className="text-xs text-slate-500">
                              {contract.startDate} - {contract.endDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-emerald-400 font-bold">${(contract.value || 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{contract.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/contracts/${contract.id}`)}>
                              <Eye className="w-4 h-4 mr-1" />View
                            </Button>
                          </div>
                        </div>
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
