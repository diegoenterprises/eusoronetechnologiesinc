/**
 * COMPLIANCE DASHBOARD PAGE
 * Dashboard for Compliance Officers
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck, AlertTriangle, Users, Clock, Calendar,
  FileText, Search, Filter, ChevronRight, CheckCircle,
  XCircle, AlertCircle, Upload, Eye, Download, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplianceScore, getDefaultCategories } from "@/components/compliance/ComplianceScore";

interface DriverDQFile {
  id: string;
  name: string;
  status: "compliant" | "expiring" | "expired" | "missing";
  complianceScore: number;
  expiringDocs: number;
  missingDocs: string[];
  lastUpdated: string;
}

interface ExpiringDocument {
  id: string;
  driverName: string;
  documentType: string;
  expirationDate: string;
  daysUntil: number;
  status: "expiring" | "expired";
}

const MOCK_DRIVERS: DriverDQFile[] = [
  { id: "d1", name: "John Smith", status: "compliant", complianceScore: 100, expiringDocs: 0, missingDocs: [], lastUpdated: "Jan 20, 2026" },
  { id: "d2", name: "Maria Garcia", status: "expiring", complianceScore: 85, expiringDocs: 2, missingDocs: [], lastUpdated: "Jan 18, 2026" },
  { id: "d3", name: "Robert Johnson", status: "expired", complianceScore: 60, expiringDocs: 1, missingDocs: ["Annual MVR"], lastUpdated: "Jan 15, 2026" },
  { id: "d4", name: "Sarah Williams", status: "compliant", complianceScore: 95, expiringDocs: 1, missingDocs: [], lastUpdated: "Jan 22, 2026" },
  { id: "d5", name: "Michael Brown", status: "missing", complianceScore: 45, expiringDocs: 0, missingDocs: ["Medical Certificate", "Hazmat Training"], lastUpdated: "Jan 10, 2026" },
];

const EXPIRING_DOCS: ExpiringDocument[] = [
  { id: "e1", driverName: "Maria Garcia", documentType: "Medical Certificate", expirationDate: "Feb 15, 2026", daysUntil: 23, status: "expiring" },
  { id: "e2", driverName: "Maria Garcia", documentType: "TWIC Card", expirationDate: "Feb 28, 2026", daysUntil: 36, status: "expiring" },
  { id: "e3", driverName: "Robert Johnson", documentType: "CDL", expirationDate: "Jan 10, 2026", daysUntil: -13, status: "expired" },
  { id: "e4", driverName: "Sarah Williams", documentType: "Hazmat Training", expirationDate: "Feb 20, 2026", daysUntil: 28, status: "expiring" },
];

const STATS = {
  complianceScore: 87,
  expiringDocs: 8,
  overdueItems: 3,
  pendingAudits: 2,
  violations: 1,
  driversCompliant: 42,
  driversTotal: 45,
};

export default function ComplianceDashboard() {
  const [drivers] = useState<DriverDQFile[]>(MOCK_DRIVERS);
  const [expiringDocs] = useState<ExpiringDocument[]>(EXPIRING_DOCS);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Dashboard</h1>
          <p className="text-slate-400">Monitor driver qualification files and regulatory compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Audit Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Compliance Score</p>
                <p className={cn(
                  "text-2xl font-bold",
                  STATS.complianceScore >= 90 ? "text-green-400" : 
                  STATS.complianceScore >= 75 ? "text-yellow-400" : "text-red-400"
                )}>{STATS.complianceScore}%</p>
              </div>
              <Shield className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Expiring (30d)</p>
                <p className="text-2xl font-bold text-yellow-400">{STATS.expiringDocs}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Overdue Items</p>
                <p className="text-2xl font-bold text-red-400">{STATS.overdueItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending Audits</p>
                <p className="text-2xl font-bold text-orange-400">{STATS.pendingAudits}</p>
              </div>
              <FileCheck className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Violations</p>
                <p className="text-2xl font-bold text-red-400">{STATS.violations}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Drivers Compliant</p>
                <p className="text-2xl font-bold text-white">
                  {STATS.driversCompliant}<span className="text-slate-400 text-lg">/{STATS.driversTotal}</span>
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(STATS.overdueItems > 0 || STATS.violations > 0) && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Compliance Alerts</p>
                <div className="mt-2 space-y-1 text-sm">
                  {STATS.overdueItems > 0 && (
                    <p className="text-slate-300">
                      <Badge className="bg-red-500/20 text-red-400 mr-2">Critical</Badge>
                      {STATS.overdueItems} documents are overdue and require immediate attention
                    </p>
                  )}
                  {STATS.violations > 0 && (
                    <p className="text-slate-300">
                      <Badge className="bg-yellow-500/20 text-yellow-400 mr-2">Warning</Badge>
                      {STATS.violations} compliance violation(s) need to be addressed
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dq-files">DQ Files</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Docs</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ComplianceScore
            overallScore={STATS.complianceScore}
            categories={getDefaultCategories("carrier")}
            entityName="ABC Trucking LLC"
            entityType="carrier"
            lastAudit="Dec 15, 2025"
            nextAudit="Mar 15, 2026"
          />
        </TabsContent>

        <TabsContent value="dq-files" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Driver Qualification Files (49 CFR 391.51)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search drivers..."
                      className="pl-9 w-64 bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredDrivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer",
                      driver.status === "expired" && "border border-red-500/50",
                      driver.status === "missing" && "border border-red-500/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        driver.status === "compliant" && "bg-green-500/20",
                        driver.status === "expiring" && "bg-yellow-500/20",
                        driver.status === "expired" && "bg-red-500/20",
                        driver.status === "missing" && "bg-red-500/20"
                      )}>
                        {driver.status === "compliant" && <CheckCircle className="w-5 h-5 text-green-400" />}
                        {driver.status === "expiring" && <Clock className="w-5 h-5 text-yellow-400" />}
                        {driver.status === "expired" && <XCircle className="w-5 h-5 text-red-400" />}
                        {driver.status === "missing" && <AlertCircle className="w-5 h-5 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn(
                            "text-xs",
                            driver.status === "compliant" && "bg-green-500/20 text-green-400",
                            driver.status === "expiring" && "bg-yellow-500/20 text-yellow-400",
                            driver.status === "expired" && "bg-red-500/20 text-red-400",
                            driver.status === "missing" && "bg-red-500/20 text-red-400"
                          )}>
                            {driver.status === "compliant" && "Compliant"}
                            {driver.status === "expiring" && `${driver.expiringDocs} Expiring`}
                            {driver.status === "expired" && "Expired Docs"}
                            {driver.status === "missing" && "Missing Docs"}
                          </Badge>
                          {driver.missingDocs.length > 0 && (
                            <span className="text-xs text-red-400">
                              Missing: {driver.missingDocs.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">DQ Score</p>
                        <p className={cn(
                          "font-bold",
                          driver.complianceScore >= 90 ? "text-green-400" :
                          driver.complianceScore >= 70 ? "text-yellow-400" : "text-red-400"
                        )}>{driver.complianceScore}%</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        <Eye className="w-4 h-4 mr-1" />
                        View File
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                Expiring Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg bg-slate-700/30",
                      doc.status === "expired" && "border border-red-500/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        doc.status === "expiring" ? "bg-yellow-500/20" : "bg-red-500/20"
                      )}>
                        <FileText className={cn(
                          "w-5 h-5",
                          doc.status === "expiring" ? "text-yellow-400" : "text-red-400"
                        )} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{doc.documentType}</p>
                        <p className="text-sm text-slate-400">{doc.driverName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Expires</p>
                        <p className={cn(
                          "font-medium",
                          doc.daysUntil < 0 ? "text-red-400" : 
                          doc.daysUntil <= 14 ? "text-yellow-400" : "text-slate-300"
                        )}>
                          {doc.expirationDate}
                        </p>
                        <p className={cn(
                          "text-xs",
                          doc.daysUntil < 0 ? "text-red-400" : "text-yellow-400"
                        )}>
                          {doc.daysUntil < 0 ? `${Math.abs(doc.daysUntil)} days overdue` : `${doc.daysUntil} days left`}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload New
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                Audit Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, type: "Internal DQ File Audit", date: "Feb 1, 2026", status: "scheduled", scope: "All drivers" },
                  { id: 2, type: "DOT Mock Audit", date: "Mar 15, 2026", status: "scheduled", scope: "Company-wide" },
                  { id: 3, type: "Drug & Alcohol Program Review", date: "Jan 30, 2026", status: "in_progress", scope: "Random pool" },
                ].map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">{audit.type}</p>
                      <p className="text-sm text-slate-400">{audit.scope}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-300">{audit.date}</p>
                        <Badge className={cn(
                          "text-xs",
                          audit.status === "scheduled" && "bg-blue-500/20 text-blue-400",
                          audit.status === "in_progress" && "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {audit.status === "scheduled" ? "Scheduled" : "In Progress"}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        Details
                      </Button>
                    </div>
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
