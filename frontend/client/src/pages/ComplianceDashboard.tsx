/**
 * COMPLIANCE DASHBOARD PAGE
 * 100% Dynamic - No mock data
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
  Users, Calendar, Eye, TrendingUp, TrendingDown
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
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading compliance data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-500/20 text-green-400";
      case "expiring": return "bg-yellow-500/20 text-yellow-400";
      case "expired": case "non_compliant": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Dashboard</h1>
          <p className="text-slate-400 text-sm">Monitor fleet compliance status</p>
        </div>
      </div>

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Compliance Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={cn("border", summary?.overallScore >= 90 ? "bg-green-500/10 border-green-500/30" : summary?.overallScore >= 70 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30")}>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className={cn("text-2xl font-bold", getScoreColor(summary?.overallScore || 0))}>{summary?.overallScore || 0}%</p>
            )}
            <p className="text-xs text-slate-400">Compliance Score</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.compliant || 0}</p>
            )}
            <p className="text-xs text-slate-400">Compliant</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.expiringSoon || 0}</p>
            )}
            <p className="text-xs text-slate-400">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.nonCompliant || 0}</p>
            )}
            <p className="text-xs text-slate-400">Non-Compliant</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Drivers</TabsTrigger>
          <TabsTrigger value="expiring" className="data-[state=active]:bg-blue-600">Expiring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Compliance by Category</CardTitle></CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {summary?.categories?.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">{cat.name}</span>
                          <span className={cn("font-medium", getScoreColor(cat.score))}>{cat.score}%</span>
                        </div>
                        <Progress value={cat.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Expiring Documents</CardTitle></CardHeader>
              <CardContent>
                {expiringQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : expiringQuery.data?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-400">No documents expiring soon</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expiringQuery.data?.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div>
                          <p className="text-white">{doc.documentType}</p>
                          <p className="text-xs text-slate-500">{doc.driverName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400">{doc.expirationDate}</p>
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Driver Compliance Status</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No driver data</p>
              ) : (
                <div className="space-y-3">
                  {driversQuery.data?.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-xs text-slate-500">{driver.documentsComplete}/{driver.documentsRequired} documents</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn("font-bold", getScoreColor(driver.complianceScore))}>{driver.complianceScore}%</p>
                        </div>
                        <Badge className={getStatusColor(driver.status)}>{driver.status?.replace("_", " ")}</Badge>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">All Expiring Documents (30 Days)</CardTitle></CardHeader>
            <CardContent>
              {expiringQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : expiringQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No documents expiring in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringQuery.data?.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", doc.daysUntilExpiration <= 7 ? "bg-red-500/20" : "bg-yellow-500/20")}>
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
                        <Button variant="outline" size="sm" className="border-slate-600">Renew</Button>
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
