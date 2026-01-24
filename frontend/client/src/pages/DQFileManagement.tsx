/**
 * DQ FILE MANAGEMENT
 * Driver Qualification File Management per 49 CFR 391.51
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText, User, Calendar, CheckCircle, XCircle, AlertTriangle,
  Clock, Upload, Download, Search, Filter, Eye, ChevronRight,
  Shield, Award, Truck, Heart, FlaskConical, X, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DocumentStatus = "valid" | "expiring" | "expired" | "missing" | "pending_review";

interface DQDocument {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  issueDate?: string;
  expirationDate?: string;
  uploadedAt?: string;
  fileUrl?: string;
  notes?: string;
  required: boolean;
  cfr: string;
}

interface Driver {
  id: string;
  name: string;
  employeeId: string;
  hireDate: string;
  cdlNumber: string;
  cdlState: string;
  cdlExpiration: string;
  status: "active" | "inactive" | "terminated";
  dqScore: number;
  documents: DQDocument[];
}

const DQ_DOCUMENT_TYPES = [
  { type: "application", name: "Employment Application", cfr: "391.21", required: true, hasExpiration: false },
  { type: "mvr", name: "Motor Vehicle Record (MVR)", cfr: "391.23", required: true, hasExpiration: true, renewalMonths: 12 },
  { type: "road_test", name: "Road Test Certificate", cfr: "391.31", required: true, hasExpiration: false },
  { type: "cdl", name: "CDL Copy", cfr: "391.51(b)(7)", required: true, hasExpiration: true },
  { type: "medical_card", name: "Medical Examiner's Certificate", cfr: "391.43", required: true, hasExpiration: true },
  { type: "drug_test_pre", name: "Pre-Employment Drug Test", cfr: "382.301", required: true, hasExpiration: false },
  { type: "clearinghouse", name: "Clearinghouse Query", cfr: "382.701", required: true, hasExpiration: true, renewalMonths: 12 },
  { type: "background_check", name: "Background Check", cfr: "391.23(d)", required: true, hasExpiration: false },
  { type: "sap_return", name: "SAP Return-to-Duty (if applicable)", cfr: "382.309", required: false, hasExpiration: false },
  { type: "hazmat_cert", name: "Hazmat Endorsement Training", cfr: "172.704", required: false, hasExpiration: true, renewalMonths: 36 },
  { type: "annual_review", name: "Annual Review of Driving Record", cfr: "391.25", required: true, hasExpiration: true, renewalMonths: 12 },
  { type: "violations_cert", name: "Annual Violations Certification", cfr: "391.27", required: true, hasExpiration: true, renewalMonths: 12 },
];

const MOCK_DRIVERS: Driver[] = [
  {
    id: "drv_001",
    name: "Mike Johnson",
    employeeId: "EMP-4521",
    hireDate: "2022-03-15",
    cdlNumber: "TX12345678",
    cdlState: "TX",
    cdlExpiration: "2026-03-15",
    status: "active",
    dqScore: 92,
    documents: [
      { id: "doc_001", type: "application", name: "Employment Application", status: "valid", issueDate: "2022-03-10", uploadedAt: "2022-03-10", required: true, cfr: "391.21" },
      { id: "doc_002", type: "mvr", name: "Motor Vehicle Record", status: "valid", issueDate: "2024-06-15", expirationDate: "2025-06-15", uploadedAt: "2024-06-16", required: true, cfr: "391.23" },
      { id: "doc_003", type: "road_test", name: "Road Test Certificate", status: "valid", issueDate: "2022-03-20", uploadedAt: "2022-03-20", required: true, cfr: "391.31" },
      { id: "doc_004", type: "cdl", name: "CDL Copy", status: "valid", issueDate: "2022-03-15", expirationDate: "2026-03-15", uploadedAt: "2022-03-15", required: true, cfr: "391.51(b)(7)" },
      { id: "doc_005", type: "medical_card", name: "Medical Card", status: "expiring", issueDate: "2023-02-01", expirationDate: "2025-02-01", uploadedAt: "2023-02-05", required: true, cfr: "391.43" },
      { id: "doc_006", type: "drug_test_pre", name: "Pre-Employment Drug Test", status: "valid", issueDate: "2022-03-12", uploadedAt: "2022-03-12", required: true, cfr: "382.301" },
      { id: "doc_007", type: "clearinghouse", name: "Clearinghouse Query", status: "valid", issueDate: "2024-03-15", expirationDate: "2025-03-15", uploadedAt: "2024-03-15", required: true, cfr: "382.701" },
      { id: "doc_008", type: "background_check", name: "Background Check", status: "valid", issueDate: "2022-03-11", uploadedAt: "2022-03-11", required: true, cfr: "391.23(d)" },
      { id: "doc_009", type: "hazmat_cert", name: "Hazmat Training", status: "valid", issueDate: "2023-06-01", expirationDate: "2026-06-01", uploadedAt: "2023-06-05", required: false, cfr: "172.704" },
      { id: "doc_010", type: "annual_review", name: "Annual Review", status: "valid", issueDate: "2024-03-15", expirationDate: "2025-03-15", uploadedAt: "2024-03-16", required: true, cfr: "391.25" },
      { id: "doc_011", type: "violations_cert", name: "Violations Certification", status: "valid", issueDate: "2024-03-15", expirationDate: "2025-03-15", uploadedAt: "2024-03-16", required: true, cfr: "391.27" },
    ],
  },
  {
    id: "drv_002",
    name: "Sarah Williams",
    employeeId: "EMP-4522",
    hireDate: "2023-01-10",
    cdlNumber: "TX87654321",
    cdlState: "TX",
    cdlExpiration: "2025-08-20",
    status: "active",
    dqScore: 78,
    documents: [
      { id: "doc_101", type: "application", name: "Employment Application", status: "valid", issueDate: "2023-01-05", uploadedAt: "2023-01-05", required: true, cfr: "391.21" },
      { id: "doc_102", type: "mvr", name: "Motor Vehicle Record", status: "expired", issueDate: "2023-06-15", expirationDate: "2024-06-15", uploadedAt: "2023-06-16", required: true, cfr: "391.23" },
      { id: "doc_103", type: "road_test", name: "Road Test Certificate", status: "valid", issueDate: "2023-01-15", uploadedAt: "2023-01-15", required: true, cfr: "391.31" },
      { id: "doc_104", type: "cdl", name: "CDL Copy", status: "expiring", issueDate: "2021-08-20", expirationDate: "2025-08-20", uploadedAt: "2023-01-10", required: true, cfr: "391.51(b)(7)" },
      { id: "doc_105", type: "medical_card", name: "Medical Card", status: "valid", issueDate: "2024-01-10", expirationDate: "2026-01-10", uploadedAt: "2024-01-12", required: true, cfr: "391.43" },
      { id: "doc_106", type: "drug_test_pre", name: "Pre-Employment Drug Test", status: "valid", issueDate: "2023-01-08", uploadedAt: "2023-01-08", required: true, cfr: "382.301" },
      { id: "doc_107", type: "clearinghouse", name: "Clearinghouse Query", status: "expired", issueDate: "2023-01-10", expirationDate: "2024-01-10", uploadedAt: "2023-01-10", required: true, cfr: "382.701" },
      { id: "doc_108", type: "background_check", name: "Background Check", status: "valid", issueDate: "2023-01-07", uploadedAt: "2023-01-07", required: true, cfr: "391.23(d)" },
      { id: "doc_109", type: "annual_review", name: "Annual Review", status: "missing", required: true, cfr: "391.25" },
      { id: "doc_110", type: "violations_cert", name: "Violations Certification", status: "missing", required: true, cfr: "391.27" },
    ],
  },
  {
    id: "drv_003",
    name: "Tom Brown",
    employeeId: "EMP-4523",
    hireDate: "2021-06-01",
    cdlNumber: "TX11223344",
    cdlState: "TX",
    cdlExpiration: "2025-06-01",
    status: "active",
    dqScore: 100,
    documents: [
      { id: "doc_201", type: "application", name: "Employment Application", status: "valid", issueDate: "2021-05-25", uploadedAt: "2021-05-25", required: true, cfr: "391.21" },
      { id: "doc_202", type: "mvr", name: "Motor Vehicle Record", status: "valid", issueDate: "2024-06-01", expirationDate: "2025-06-01", uploadedAt: "2024-06-02", required: true, cfr: "391.23" },
      { id: "doc_203", type: "road_test", name: "Road Test Certificate", status: "valid", issueDate: "2021-06-05", uploadedAt: "2021-06-05", required: true, cfr: "391.31" },
      { id: "doc_204", type: "cdl", name: "CDL Copy", status: "valid", issueDate: "2021-06-01", expirationDate: "2025-06-01", uploadedAt: "2021-06-01", required: true, cfr: "391.51(b)(7)" },
      { id: "doc_205", type: "medical_card", name: "Medical Card", status: "valid", issueDate: "2024-05-15", expirationDate: "2026-05-15", uploadedAt: "2024-05-16", required: true, cfr: "391.43" },
      { id: "doc_206", type: "drug_test_pre", name: "Pre-Employment Drug Test", status: "valid", issueDate: "2021-05-28", uploadedAt: "2021-05-28", required: true, cfr: "382.301" },
      { id: "doc_207", type: "clearinghouse", name: "Clearinghouse Query", status: "valid", issueDate: "2024-06-01", expirationDate: "2025-06-01", uploadedAt: "2024-06-01", required: true, cfr: "382.701" },
      { id: "doc_208", type: "background_check", name: "Background Check", status: "valid", issueDate: "2021-05-27", uploadedAt: "2021-05-27", required: true, cfr: "391.23(d)" },
      { id: "doc_209", type: "hazmat_cert", name: "Hazmat Training", status: "valid", issueDate: "2024-01-15", expirationDate: "2027-01-15", uploadedAt: "2024-01-16", required: false, cfr: "172.704" },
      { id: "doc_210", type: "annual_review", name: "Annual Review", status: "valid", issueDate: "2024-06-01", expirationDate: "2025-06-01", uploadedAt: "2024-06-02", required: true, cfr: "391.25" },
      { id: "doc_211", type: "violations_cert", name: "Violations Certification", status: "valid", issueDate: "2024-06-01", expirationDate: "2025-06-01", uploadedAt: "2024-06-02", required: true, cfr: "391.27" },
    ],
  },
];

const STATUS_CONFIG: Record<DocumentStatus, { color: string; label: string; icon: React.ElementType }> = {
  valid: { color: "bg-green-500/20 text-green-400", label: "Valid", icon: CheckCircle },
  expiring: { color: "bg-yellow-500/20 text-yellow-400", label: "Expiring Soon", icon: Clock },
  expired: { color: "bg-red-500/20 text-red-400", label: "Expired", icon: XCircle },
  missing: { color: "bg-red-500/20 text-red-400", label: "Missing", icon: AlertTriangle },
  pending_review: { color: "bg-blue-500/20 text-blue-400", label: "Pending Review", icon: Eye },
};

export default function DQFileManagement() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getOverallStats = () => {
    let totalDocs = 0;
    let validDocs = 0;
    let expiringDocs = 0;
    let expiredDocs = 0;
    let missingDocs = 0;

    drivers.forEach(driver => {
      driver.documents.forEach(doc => {
        if (doc.required) {
          totalDocs++;
          if (doc.status === "valid") validDocs++;
          if (doc.status === "expiring") expiringDocs++;
          if (doc.status === "expired") expiredDocs++;
          if (doc.status === "missing") missingDocs++;
        }
      });
    });

    return { totalDocs, validDocs, expiringDocs, expiredDocs, missingDocs };
  };

  const stats = getOverallStats();

  const filteredDrivers = drivers.filter(driver => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!driver.name.toLowerCase().includes(q) && 
          !driver.employeeId.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterStatus === "issues") {
      return driver.dqScore < 100;
    }
    if (filterStatus === "compliant") {
      return driver.dqScore === 100;
    }
    return true;
  });

  const getDQScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getDaysUntilExpiration = (date?: string) => {
    if (!date) return null;
    const expDate = new Date(date);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DQ File Management</h1>
          <p className="text-slate-400 text-sm">Driver Qualification Files per 49 CFR 391.51</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Clearinghouse Query
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalDocs}</p>
            <p className="text-xs text-slate-500">Total Required Docs</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{stats.validDocs}</p>
            <p className="text-xs text-green-500/70">Valid</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-400">{stats.expiringDocs}</p>
            <p className="text-xs text-yellow-500/70">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{stats.expiredDocs}</p>
            <p className="text-xs text-red-500/70">Expired</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{stats.missingDocs}</p>
            <p className="text-xs text-red-500/70">Missing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drivers..."
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "issues", "compliant"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? "bg-blue-600" : "border-slate-600"}
                  size="sm"
                >
                  {status === "all" ? "All Drivers" : status === "issues" ? "Has Issues" : "Compliant"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="space-y-4">
        {filteredDrivers.map((driver) => {
          const issueCount = driver.documents.filter(d => 
            d.required && (d.status === "expired" || d.status === "missing")
          ).length;
          const expiringCount = driver.documents.filter(d => 
            d.required && d.status === "expiring"
          ).length;

          return (
            <Card 
              key={driver.id}
              className={cn(
                "bg-slate-800/50 border-slate-700 cursor-pointer transition-colors hover:border-slate-500",
                issueCount > 0 && "border-l-4 border-l-red-500"
              )}
              onClick={() => setSelectedDriver(driver)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{driver.name}</h3>
                      <p className="text-slate-400 text-sm">{driver.employeeId}</p>
                      <p className="text-xs text-slate-500">
                        CDL: {driver.cdlNumber} ({driver.cdlState})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Issue Indicators */}
                    <div className="flex gap-2">
                      {issueCount > 0 && (
                        <Badge className="bg-red-500/20 text-red-400">
                          {issueCount} Issues
                        </Badge>
                      )}
                      {expiringCount > 0 && (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          {expiringCount} Expiring
                        </Badge>
                      )}
                      {issueCount === 0 && expiringCount === 0 && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Compliant
                        </Badge>
                      )}
                    </div>

                    {/* DQ Score */}
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", getDQScoreColor(driver.dqScore))}>
                        {driver.dqScore}%
                      </p>
                      <p className="text-xs text-slate-500">DQ Score</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{selectedDriver.name}</CardTitle>
                    <p className="text-slate-400 text-sm">
                      {selectedDriver.employeeId} | CDL: {selectedDriver.cdlNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className={cn("text-3xl font-bold", getDQScoreColor(selectedDriver.dqScore))}>
                      {selectedDriver.dqScore}%
                    </p>
                    <p className="text-xs text-slate-500">DQ Score</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedDriver(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Driver Info */}
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-xs text-slate-500">Hire Date</p>
                  <p className="text-white">{new Date(selectedDriver.hireDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CDL State</p>
                  <p className="text-white">{selectedDriver.cdlState}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CDL Expiration</p>
                  <p className={cn(
                    "font-medium",
                    getDaysUntilExpiration(selectedDriver.cdlExpiration)! < 90 ? "text-yellow-400" : "text-white"
                  )}>
                    {new Date(selectedDriver.cdlExpiration).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className="bg-green-500/20 text-green-400">
                    {selectedDriver.status.charAt(0).toUpperCase() + selectedDriver.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Documents */}
              <h4 className="text-white font-medium mb-4">DQ File Documents</h4>
              <div className="space-y-3">
                {selectedDriver.documents.map((doc) => {
                  const StatusIcon = STATUS_CONFIG[doc.status].icon;
                  const daysUntil = getDaysUntilExpiration(doc.expirationDate);
                  
                  return (
                    <div 
                      key={doc.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        doc.status === "valid" ? "border-green-500/30 bg-green-500/5" :
                        doc.status === "expiring" ? "border-yellow-500/30 bg-yellow-500/5" :
                        doc.status === "expired" || doc.status === "missing" ? "border-red-500/30 bg-red-500/5" :
                        "border-slate-600"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={cn(
                            "w-5 h-5",
                            doc.status === "valid" ? "text-green-400" :
                            doc.status === "expiring" ? "text-yellow-400" :
                            doc.status === "expired" || doc.status === "missing" ? "text-red-400" :
                            "text-blue-400"
                          )} />
                          <div>
                            <p className="text-white font-medium">{doc.name}</p>
                            <p className="text-xs text-slate-500">CFR {doc.cfr}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {doc.expirationDate && (
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Expires</p>
                              <p className={cn(
                                "text-sm",
                                daysUntil && daysUntil < 30 ? "text-red-400" :
                                daysUntil && daysUntil < 90 ? "text-yellow-400" : "text-white"
                              )}>
                                {new Date(doc.expirationDate).toLocaleDateString()}
                                {daysUntil !== null && daysUntil > 0 && (
                                  <span className="text-xs text-slate-500 ml-1">
                                    ({daysUntil} days)
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          <Badge className={STATUS_CONFIG[doc.status].color}>
                            {STATUS_CONFIG[doc.status].label}
                          </Badge>
                          {doc.status !== "missing" ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="text-slate-400">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-slate-400">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Upload className="w-4 h-4 mr-1" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
                <Button variant="outline" className="border-slate-600">
                  <Download className="w-4 h-4 mr-2" />
                  Download Full DQ File
                </Button>
                <Button variant="outline" className="border-slate-600">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Query Clearinghouse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
