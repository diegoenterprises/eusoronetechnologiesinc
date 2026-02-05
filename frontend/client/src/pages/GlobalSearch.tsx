/**
 * GLOBAL SEARCH PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Search, Truck, Users, FileText, DollarSign,
  Clock, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function GlobalSearch() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const searchQuery = (trpc as any).search.global.useQuery({ query, type: activeTab === "all" ? undefined : activeTab }, { enabled: query.length >= 2 });
  const recentQuery = (trpc as any).search.getRecent.useQuery({ limit: 10 });

  const getResultIcon = (type: string) => {
    switch (type) {
      case "load": return <Truck className="w-5 h-5 text-blue-400" />;
      case "driver": return <Users className="w-5 h-5 text-green-400" />;
      case "carrier": return <Users className="w-5 h-5 text-purple-400" />;
      case "invoice": return <FileText className="w-5 h-5 text-orange-400" />;
      case "payment": return <DollarSign className="w-5 h-5 text-emerald-400" />;
      default: return <Search className="w-5 h-5 text-slate-400" />;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case "load": return "bg-blue-500/20";
      case "driver": return "bg-green-500/20";
      case "carrier": return "bg-purple-500/20";
      case "invoice": return "bg-orange-500/20";
      case "payment": return "bg-emerald-500/20";
      default: return "bg-slate-500/20";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Global Search
        </h1>
        <p className="text-slate-400 text-sm mt-1">Search across all data</p>
      </div>

      {/* Search Input */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder="Search loads, drivers, carriers, invoices..." className="pl-12 h-14 text-lg bg-slate-800/50 border-slate-700/50 rounded-xl" autoFocus />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {query.length >= 2 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-700/50">
                <TabsTrigger value="all">All ({(searchQuery.data as any)?.total || 0})</TabsTrigger>
                <TabsTrigger value="load">Loads ({(searchQuery.data as any)?.counts?.loads || 0})</TabsTrigger>
                <TabsTrigger value="driver">Drivers ({(searchQuery.data as any)?.counts?.drivers || 0})</TabsTrigger>
                <TabsTrigger value="carrier">Carriers ({(searchQuery.data as any)?.counts?.carriers || 0})</TabsTrigger>
                <TabsTrigger value="invoice">Invoices ({(searchQuery.data as any)?.counts?.invoices || 0})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            {searchQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : (searchQuery.data as any)?.results?.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(searchQuery.data as any)?.results?.map((result: any) => (
                  <div key={result.id} className="p-4 flex items-center gap-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(result.path)}>
                    <div className={cn("p-3 rounded-xl", getResultColor(result.type))}>
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{result.title}</p>
                        <Badge className={cn(getResultColor(result.type), "border-0 text-xs")}>{result.type}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{result.subtitle}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Recent Searches */
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (recentQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent searches</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(recentQuery.data as any)?.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-center gap-3 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setQuery(item.query)}>
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-white flex-1">{item.query}</span>
                    <span className="text-xs text-slate-500">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
