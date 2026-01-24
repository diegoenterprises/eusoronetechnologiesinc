/**
 * CLEARINGHOUSE DASHBOARD
 * FMCSA Drug & Alcohol Clearinghouse compliance management
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Shield, Search, FileCheck, AlertTriangle, Clock, Users,
  CheckCircle, XCircle, Send, RefreshCw, Calendar, FileText,
  ChevronRight, Eye, Plus, Filter, Download, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Driver {
  id: string;
  name: string;
  cdlNumber: string;
  lastQueryDate: string;
  dueDate: string;
  daysRemaining: number;
  consentStatus: "active" | "expiring_soon" | "expired" | "pending";
}

interface Query {
  id: string;
  driverId: string;
  driverName: string;
  cdlNumber: string;
  queryType: "pre_employment" | "annual" | "follow_up";
  queryDate: string;
  status: "pending" | "completed";
  result: string | null;
  responseDate: string | null;
}

export default function ClearinghouseDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // tRPC queries
  const { data: overviewData, refetch: refetchOverview } = trpc.clearinghouse.getOverview.useQuery();
  const { data: queriesData } = trpc.clearinghouse.getQueryResults.useQuery({ status: "all", limit: 20 });
  const { data: dueDriversData } = trpc.clearinghouse.getDriversDueForQuery.useQuery({ daysAhead: 90 });
  const { data: consentData } = trpc.clearinghouse.getConsentStatus.useQuery({});
  const { data: complianceReport } = trpc.clearinghouse.getComplianceReport.useQuery({ period: "year" });

  const syncMutation = trpc.clearinghouse.syncWithFMCSA.useMutation({
    onSuccess: () => {
      toast.success("Sync completed successfully");
      refetchOverview();
    },
  });

  const overview = overviewData || {
    registrationStatus: "registered",
    queries: { preEmploymentThisYear: 12, annualThisYear: 42, pendingConsent: 3 },
    compliance: { driversRequiringAnnualQuery: 45, annualQueriesCompleted: 42, complianceRate: 0.93, dueWithin30Days: 5 },
    violations: { activeInOrganization: 0 },
  };

  const queries: Query[] = (queriesData?.queries as Query[]) || [];
  const dueDrivers: Driver[] = (dueDriversData?.drivers as Driver[]) || [];
  const consents = consentData?.consents || [];

  const compliancePercent = Math.round(overview.compliance.complianceRate * 100);

  const getConsentStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "expiring_soon": return "bg-yellow-500/20 text-yellow-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getQueryTypeLabel = (type: string) => {
    switch (type) {
      case "pre_employment": return "Pre-Employment";
      case "annual": return "Annual";
      case "follow_up": return "Follow-Up";
      default: return type;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">FMCSA Clearinghouse</h1>
          <p className="text-slate-400 text-sm">Drug & Alcohol Clearinghouse compliance management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-600"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", syncMutation.isPending && "animate-spin")} />
            Sync with FMCSA
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            New Query
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Compliance Rate</p>
                <p className="text-3xl font-bold text-green-400">{compliancePercent}%</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <Progress value={compliancePercent} className="mt-3 h-2 bg-slate-700" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Annual Queries</p>
                <p className="text-3xl font-bold text-blue-400">
                  {overview.compliance.annualQueriesCompleted}/{overview.compliance.driversRequiringAnnualQuery}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileCheck className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {overview.compliance.driversRequiringAnnualQuery - overview.compliance.annualQueriesCompleted} remaining
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Due Within 30 Days</p>
                <p className="text-3xl font-bold text-yellow-400">{overview.compliance.dueWithin30Days}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Queries need to be submitted</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border",
          overview.violations.activeInOrganization > 0 
            ? "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30" 
            : "bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/30"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Violations</p>
                <p className={cn(
                  "text-3xl font-bold",
                  overview.violations.activeInOrganization > 0 ? "text-red-400" : "text-green-400"
                )}>
                  {overview.violations.activeInOrganization}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                overview.violations.activeInOrganization > 0 ? "bg-red-500/20" : "bg-green-500/20"
              )}>
                {overview.violations.activeInOrganization > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {overview.violations.activeInOrganization > 0 ? "Action required" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">Overview</TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-green-600">Query History</TabsTrigger>
          <TabsTrigger value="due" className="data-[state=active]:bg-green-600">Due for Query</TabsTrigger>
          <TabsTrigger value="consent" className="data-[state=active]:bg-green-600">Consent Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-400" />
                  Query Summary (YTD)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <span className="text-slate-300">Pre-Employment Queries</span>
                  <span className="text-white font-bold">{overview.queries.preEmploymentThisYear}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <span className="text-slate-300">Annual Queries</span>
                  <span className="text-white font-bold">{overview.queries.annualThisYear}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <span className="text-slate-300">Pending Consent</span>
                  <span className="text-yellow-400 font-bold">{overview.queries.pendingConsent}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-green-300">Violations Found</span>
                  <span className="text-green-400 font-bold">0</span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Due Dates */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Upcoming Due Dates
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("due")}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {dueDrivers.slice(0, 5).map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-xs text-slate-500">{driver.cdlNumber}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(
                        driver.daysRemaining <= 30 ? "bg-red-500/20 text-red-400" :
                        driver.daysRemaining <= 60 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      )}>
                        {driver.daysRemaining} days
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{driver.dueDate}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {complianceReport?.recommendations && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {complianceReport.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-blue-400" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Query History Tab */}
        <TabsContent value="queries" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Query History</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search drivers..."
                      className="pl-9 w-64 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-600">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queries.map((query) => (
                  <div key={query.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        query.status === "completed" ? "bg-green-500/20" : "bg-yellow-500/20"
                      )}>
                        {query.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{query.driverName}</p>
                        <p className="text-xs text-slate-500">{query.cdlNumber}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-slate-300 border-slate-600">
                        {getQueryTypeLabel(query.queryType)}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">{query.queryDate}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(
                        query.status === "completed" 
                          ? query.result === "no_violations" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {query.status === "completed" ? query.result?.replace("_", " ") : "Pending"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Due for Query Tab */}
        <TabsContent value="due" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Drivers Due for Annual Query</CardTitle>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Bulk Query
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dueDrivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <p className="text-xs text-slate-500">{driver.cdlNumber}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Last Query</p>
                      <p className="text-white">{driver.lastQueryDate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Due Date</p>
                      <p className="text-white">{driver.dueDate}</p>
                    </div>
                    <div className="text-center">
                      <Badge className={cn(
                        driver.daysRemaining <= 30 ? "bg-red-500/20 text-red-400" :
                        driver.daysRemaining <= 60 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      )}>
                        {driver.daysRemaining} days
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge className={getConsentStatusColor(driver.consentStatus)}>
                        {driver.consentStatus.replace("_", " ")}
                      </Badge>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Search className="w-4 h-4 mr-1" />
                      Query
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consent Status Tab */}
        <TabsContent value="consent" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Driver Consent Status</CardTitle>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="border-slate-600">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Request Consent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <p className="text-2xl font-bold text-green-400">{consentData?.summary?.active || 38}</p>
                  <p className="text-xs text-slate-400">Active</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{consentData?.summary?.expiringSoon || 5}</p>
                  <p className="text-xs text-slate-400">Expiring Soon</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                  <p className="text-2xl font-bold text-red-400">{consentData?.summary?.expired || 2}</p>
                  <p className="text-xs text-slate-400">Expired</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                  <p className="text-2xl font-bold text-blue-400">{consentData?.summary?.pending || 3}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
              </div>

              <div className="space-y-3">
                {consents.map((consent: any) => (
                  <div key={consent.driverId} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{consent.driverName}</p>
                        <p className="text-xs text-slate-500">
                          {consent.consentType ? `${consent.consentType} consent` : "No consent on file"}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      {consent.validFrom && (
                        <>
                          <p className="text-sm text-slate-400">Valid From</p>
                          <p className="text-white">{consent.validFrom}</p>
                        </>
                      )}
                    </div>
                    <div className="text-center">
                      {consent.validUntil && (
                        <>
                          <p className="text-sm text-slate-400">Valid Until</p>
                          <p className="text-white">{consent.validUntil}</p>
                        </>
                      )}
                    </div>
                    <Badge className={getConsentStatusColor(consent.status)}>
                      {consent.status.replace("_", " ")}
                    </Badge>
                    <Button variant="outline" size="sm" className="border-slate-600">
                      {consent.status === "pending" ? "Resend" : "Renew"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
