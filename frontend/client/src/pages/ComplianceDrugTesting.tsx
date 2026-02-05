/**
 * COMPLIANCE DRUG TESTING PAGE
 * 100% Dynamic - Manage drug and alcohol testing compliance
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
  FlaskConical, Search, Plus, CheckCircle, AlertTriangle,
  User, Calendar, Clock, FileText, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceDrugTesting() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const testsQuery = (trpc as any).compliance.getDQDrivers.useQuery({});
  const statsQuery = (trpc as any).compliance.getRoadTestStats.useQuery();
  const upcomingQuery = (trpc as any).compliance.getDQDrivers.useQuery({});

  const tests = testsQuery.data || [];
  const stats = statsQuery.data as any;
  const upcoming = upcomingQuery.data || [];

  const filteredTests = tests.filter((t: any) =>
    t.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "negative": return "bg-green-500/20 text-green-400";
      case "positive": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "scheduled": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Drug Testing
          </h1>
          <p className="text-slate-400 text-sm mt-1">FMCSA drug and alcohol testing compliance</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Test
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
                  <FlaskConical className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Tests YTD</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalYTD || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Negative</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.negative || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{upcoming.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Compliance</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.complianceRate || 0}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Upcoming Tests */}
      {upcoming.length > 0 && (
        <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-400 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Scheduled Tests ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.slice(0, 6).map((test: any) => (
                <div key={test.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">{test.driverName}</p>
                      <p className="text-slate-400 text-sm">{test.testType} • {test.scheduledDate}</p>
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
                    {test.location}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search by driver name..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Test Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pre_employment">Pre-Employment</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="post_accident">Post-Accident</SelectItem>
                <SelectItem value="reasonable_suspicion">Reasonable Suspicion</SelectItem>
                <SelectItem value="return_to_duty">Return to Duty</SelectItem>
                <SelectItem value="follow_up">Follow-Up</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {testsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-16">
              <FlaskConical className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No test records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredTests.map((test: any) => (
                <div key={test.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        test.result === "negative" ? "bg-green-500/20" :
                        test.result === "positive" ? "bg-red-500/20" : "bg-yellow-500/20"
                      )}>
                        <FlaskConical className={cn(
                          "w-5 h-5",
                          test.result === "negative" ? "text-green-400" :
                          test.result === "positive" ? "text-red-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{test.driverName}</p>
                          <Badge className={cn("border-0", getStatusColor(test.result))}>
                            {test.result}
                          </Badge>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {test.testType?.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {test.specimenType} • {test.collectionSite}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Collection</p>
                        <p className="text-white">{test.collectionDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Result Date</p>
                        <p className="text-white">{test.resultDate || "Pending"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">MRO</p>
                        <p className="text-white">{test.mroName || "—"}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <FileText className="w-4 h-4" />
                      </Button>
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
