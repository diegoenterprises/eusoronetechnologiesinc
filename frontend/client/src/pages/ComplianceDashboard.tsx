/**
 * COMPLIANCE DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, AlertTriangle, CheckCircle, Clock, FileText,
  Users, Eye, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const summaryQuery = trpc.compliance.getSummary.useQuery();
  const driversQuery = trpc.compliance.getDriverCompliance.useQuery();
  const expiringQuery = trpc.compliance.getExpiringDocuments.useQuery({ days: 30 });
  const alertsQuery = trpc.compliance.getAlerts.useQuery();

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <div className="p-4 rounded-full bg-red-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 mb-4">Error loading compliance data</p>
        <Button className="bg-slate-700 hover:bg-slate-600" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant": return <Badge className="bg-green-500/20 text-green-400 border-0">Compliant</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Expiring</Badge>;
      case "expired": case "non_compliant": return <Badge className="bg-red-500/20 text-red-400 border-0">Non-Compliant</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Compliance Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor fleet compliance status</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Compliance Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={cn("rounded-xl border", summary?.overallScore >= 90 ? "bg-green-500/10 border-green-500/30" : summary?.overallScore >= 70 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", summary?.overallScore >= 90 ? "bg-green-500/20" : summary?.overallScore >= 70 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Shield className="w-6 h-6 text-current" style={{ color: summary?.overallScore >= 90 ? '#4ade80' : summary?.overallScore >= 70 ? '#facc15' : '#f87171' }} />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className={cn("text-2xl font-bold", getScoreColor(summary?.overallScore || 0))}>{summary?.overallScore || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Drivers</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.compliant || 0}</p>
                )}
                <p className="text-xs text-slate-400">Compliant</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.expiringSoon || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.nonCompliant || 0}</p>
                )}
                <p className="text-xs text-slate-400">Non-Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700 rounded-md">Drivers</TabsTrigger>
          <TabsTrigger value="expiring" className="data-[state=active]:bg-slate-700 rounded-md">Expiring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Compliance by Category</CardTitle></CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {summary?.categories?.map((cat) => (
                      <div key={cat.name} className="p-3 rounded-xl bg-slate-700/30">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">{cat.name}</span>
                          <span className={cn("font-bold", getScoreColor(cat.score))}>{cat.score}%</span>
                        </div>
                        <Progress value={cat.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Expiring Documents</CardTitle></CardHeader>
              <CardContent>
                {expiringQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : expiringQuery.data?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-slate-400">No documents expiring soon</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expiringQuery.data?.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-yellow-500/20">
                            <FileText className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{doc.documentType}</p>
                            <p className="text-xs text-slate-500">{doc.driverName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-medium">{doc.expirationDate}</p>
                          <p className="text-xs text-slate-500">{doc.daysUntilExpiration} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Driver Compliance Status</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No driver data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {driversQuery.data?.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-500/20">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.documentsComplete}/{driver.documentsRequired} documents</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={cn("font-bold", getScoreColor(driver.complianceScore))}>{driver.complianceScore}%</p>
                        {getStatusBadge(driver.status)}
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">All Expiring Documents (30 Days)</CardTitle></CardHeader>
            <CardContent>
              {expiringQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : expiringQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-slate-400">No documents expiring in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringQuery.data?.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-full", doc.daysUntilExpiration <= 7 ? "bg-red-500/20" : "bg-yellow-500/20")}>
                          <FileText className={cn("w-5 h-5", doc.daysUntilExpiration <= 7 ? "text-red-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{doc.documentType}</p>
                          <p className="text-sm text-slate-400">{doc.driverName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn(doc.daysUntilExpiration <= 7 ? "text-red-400" : "text-yellow-400")}>{doc.expirationDate}</p>
                          <p className="text-xs text-slate-500">{doc.daysUntilExpiration} days remaining</p>
                        </div>
                        <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg">Renew</Button>
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
