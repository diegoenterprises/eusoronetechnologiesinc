/**
 * DRUG & ALCOHOL TESTING PAGE
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
  Shield, Users, CheckCircle, Clock, AlertTriangle,
  Search, Plus, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DrugAlcoholTesting() {
  const [activeTab, setActiveTab] = useState("scheduled");
  const [searchTerm, setSearchTerm] = useState("");

  const testsQuery = trpc.compliance.getDrugTests.useQuery({ limit: 50 });
  const summaryQuery = trpc.compliance.getDrugTestSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "negative": return <Badge className="bg-green-500/20 text-green-400 border-0">Negative</Badge>;
      case "positive": return <Badge className="bg-red-500/20 text-red-400 border-0">Positive</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Scheduled</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getTestTypeBadge = (type: string) => {
    switch (type) {
      case "pre_employment": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Pre-Employment</Badge>;
      case "random": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Random</Badge>;
      case "post_accident": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Post-Accident</Badge>;
      case "reasonable_suspicion": return <Badge className="bg-red-500/20 text-red-400 border-0">Reasonable Suspicion</Badge>;
      case "return_to_duty": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Return to Duty</Badge>;
      case "follow_up": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Follow-Up</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const filteredTests = testsQuery.data?.filter((test: any) => {
    const matchesSearch = !searchTerm || 
      test.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || test.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Drug & Alcohol Testing
          </h1>
          <p className="text-slate-400 text-sm mt-1">DOT compliance testing management</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Test
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.scheduled || 0}</p>
                )}
                <p className="text-xs text-slate-400">Scheduled</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.negative || 0}</p>
                )}
                <p className="text-xs text-slate-400">Negative</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.positive || 0}</p>
                )}
                <p className="text-xs text-slate-400">Positive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Random Pool Status */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Random Testing Pool</p>
                <p className="text-slate-400 text-sm">{summary?.poolSize || 0} drivers in pool</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-purple-400 font-bold text-xl">{summary?.randomRate || 0}%</p>
              <p className="text-xs text-slate-500">Annual Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by driver name..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-slate-700 rounded-md">Scheduled</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">Pending</TabsTrigger>
          <TabsTrigger value="negative" className="data-[state=active]:bg-slate-700 rounded-md">Negative</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {testsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : filteredTests?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No tests found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredTests?.map((test: any) => (
                    <div key={test.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", test.status === "positive" && "bg-red-500/5 border-l-2 border-red-500")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", test.status === "negative" ? "bg-green-500/20" : test.status === "positive" ? "bg-red-500/20" : "bg-blue-500/20")}>
                            <Shield className={cn("w-6 h-6", test.status === "negative" ? "text-green-400" : test.status === "positive" ? "text-red-400" : "text-blue-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{test.driverName}</p>
                              {getStatusBadge(test.status)}
                            </div>
                            <div className="flex items-center gap-2">
                              {getTestTypeBadge(test.testType)}
                              <span className="text-xs text-slate-500">{test.testDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">{test.collectionSite}</p>
                          <p className="text-xs text-slate-500">{test.mroName}</p>
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
