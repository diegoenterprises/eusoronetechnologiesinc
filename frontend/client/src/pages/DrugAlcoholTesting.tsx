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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TestTube, CheckCircle, AlertTriangle, Clock, User,
  Search, Plus, Calendar, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DrugAlcoholTesting() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const testsQuery = (trpc as any).compliance.getDrugAlcoholTests.useQuery({ filter, search });
  const statsQuery = (trpc as any).compliance.getDrugAlcoholStats.useQuery();
  const upcomingQuery = (trpc as any).compliance.getUpcomingTests.useQuery({ limit: 5 });

  const scheduleMutation = (trpc as any).compliance.scheduleTest.useMutation({
    onSuccess: () => { toast.success("Test scheduled"); testsQuery.refetch(); upcomingQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getResultBadge = (result: string) => {
    switch (result) {
      case "negative": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Negative</Badge>;
      case "positive": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Positive</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{result}</Badge>;
    }
  };

  const getTestTypeBadge = (type: string) => {
    switch (type) {
      case "pre_employment": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Pre-Employment</Badge>;
      case "random": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Random</Badge>;
      case "post_accident": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Post-Accident</Badge>;
      case "reasonable_suspicion": return <Badge className="bg-red-500/20 text-red-400 border-0">Reasonable Suspicion</Badge>;
      case "return_to_duty": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Return to Duty</Badge>;
      case "follow_up": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Follow-Up</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Drug & Alcohol Testing
          </h1>
          <p className="text-slate-400 text-sm mt-1">DOT testing compliance per 49 CFR Part 40</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => scheduleMutation.mutate({})}>
          <Plus className="w-4 h-4 mr-2" />Schedule Test
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.negative || 0}</p>
                )}
                <p className="text-xs text-slate-400">Negative</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.scheduled || 0}</p>
                )}
                <p className="text-xs text-slate-400">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <TestTube className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.totalYTD || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total YTD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tests */}
      {((upcomingQuery.data as any)?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Upcoming Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-blue-500/20">
              {(upcomingQuery.data as any)?.map((test: any) => (
                <div key={test.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{test.driverName}</p>
                      <p className="text-sm text-slate-400">{test.testType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-400">{test.scheduledDate}</p>
                    <p className="text-xs text-slate-500">{test.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search by driver name..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tests List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TestTube className="w-5 h-5 text-cyan-400" />
            Test Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {testsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (testsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <TestTube className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No test records found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(testsQuery.data as any)?.map((test: any) => (
                <div key={test.id} className={cn("p-4", test.result === "positive" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", test.result === "negative" ? "bg-green-500/20" : test.result === "positive" ? "bg-red-500/20" : "bg-white/[0.04]")}>
                        <User className={cn("w-5 h-5", test.result === "negative" ? "text-green-400" : test.result === "positive" ? "text-red-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{test.driverName}</p>
                          {getResultBadge(test.result)}
                          {getTestTypeBadge(test.testType)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{test.testDate}</span>
                          <span>{test.substance}</span>
                          <span>{test.collector}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg">
                      <FileText className="w-4 h-4 mr-1" />View
                    </Button>
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
