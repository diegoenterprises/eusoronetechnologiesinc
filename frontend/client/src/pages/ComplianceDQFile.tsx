/**
 * COMPLIANCE DQ FILE MANAGEMENT PAGE
 * 100% Dynamic - Driver Qualification File per 49 CFR 391.51
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  FileText, User, CheckCircle, XCircle, AlertTriangle,
  Clock, Upload, Download, Eye, Calendar,
  ChevronLeft, Shield, Stethoscope, GraduationCap,
  Car, ClipboardCheck, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const dqRequirements = [
  { key: "application", label: "Driver Application", regulation: "391.21", icon: FileText },
  { key: "mvr", label: "Motor Vehicle Record", regulation: "391.23", icon: Car, renewalDays: 365 },
  { key: "roadTest", label: "Road Test Certificate", regulation: "391.31", icon: ClipboardCheck },
  { key: "medicalCert", label: "Medical Certificate", regulation: "391.43", icon: Stethoscope, renewalDays: 730 },
  { key: "cdl", label: "CDL Copy", regulation: "391.51", icon: Car, renewalDays: 365 },
  { key: "psp", label: "PSP Report", regulation: "391.23", icon: Shield },
  { key: "drugTest", label: "Pre-Employment Drug Test", regulation: "382.301", icon: Stethoscope },
  { key: "clearinghouse", label: "Clearinghouse Query", regulation: "382.701", icon: Shield, renewalDays: 365 },
  { key: "hazmatTraining", label: "Hazmat Training", regulation: "172.704", icon: GraduationCap, renewalDays: 1095 },
  { key: "employmentHistory", label: "Employment History", regulation: "391.23", icon: History },
  { key: "annualReview", label: "Annual Review", regulation: "391.25", icon: Calendar, renewalDays: 365 },
];

export default function ComplianceDQFile() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/compliance/dq/:driverId");
  const driverId = params?.driverId;

  const [activeTab, setActiveTab] = useState("overview");

  const driverQuery = (trpc as any).drivers.getById.useQuery({ id: driverId || "" });
  const dqQuery = (trpc as any).compliance.getDQFiles.useQuery({ search: driverId || "" });
  const documentsQuery = (trpc as any).compliance.getCarrierDocuments.useQuery();

  const driver = driverQuery.data;
  const dqFile = dqQuery.data;
  const documents = documentsQuery.data || [];

  const completedItems = dqFile ? Object.values((dqFile as any)?.items || (dqFile as any)?.[0]?.documents || {}).filter((item: any) => item?.status === "complete").length : 0;
  const totalItems = dqRequirements.length;
  const completionPercent = (completedItems / totalItems) * 100;

  const getItemStatus = (key: string) => {
    const item = (dqFile as any)?.items?.[key] || (dqFile as any)?.[0]?.documents?.find((d: any) => d.type === key);
    if (!item) return { status: "missing", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
    if (item.status === "complete") {
      if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
        return { status: "expired", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
      }
      if (item.expiresAt && new Date(item.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        return { status: "expiring", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" };
      }
      return { status: "complete", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" };
    }
    return { status: "pending", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" };
  };

  if (driverQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/compliance/drivers")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            DQ File
          </h1>
          <p className="text-slate-400 text-sm mt-1">Driver Qualification File - 49 CFR 391.51</p>
        </div>
      </div>

      {/* Driver Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">{driver?.name}</h2>
                <div className="flex items-center gap-4 mt-1 text-slate-400 text-sm">
                  <span>CDL: {driver?.cdlNumber}</span>
                  <span>State: {(driver as any)?.cdlState || driver?.location?.state}</span>
                  <span>Class: {(driver as any)?.cdlClass || "A"}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 text-sm">DQ File Status</span>
                <Badge className={cn(
                  "border-0",
                  completionPercent === 100 ? "bg-green-500/20 text-green-400" :
                  completionPercent >= 80 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                )}>
                  {completionPercent === 100 ? "Complete" : `${completedItems}/${totalItems}`}
                </Badge>
              </div>
              <Progress value={completionPercent} className="h-2 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-slate-700">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-md data-[state=active]:bg-slate-700">Documents</TabsTrigger>
          <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-slate-700">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-400" />
                DQ Requirements Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dqRequirements.map((req: any) => {
                  const { status, color, bg } = getItemStatus(req.key);
                  const Icon = req.icon;
                  const item = (dqFile as any)?.items?.[req.key] || dqFile?.find?.((d: any) => d.driverId === req.key);
                  
                  return (
                    <div
                      key={req.key}
                      className={cn("p-4 rounded-lg border transition-all", bg)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", status === "complete" ? "bg-green-500/20" : "bg-slate-700/50")}>
                            <Icon className={cn("w-5 h-5", color)} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{req.label}</p>
                              <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                                {req.regulation}
                              </Badge>
                            </div>
                            {item?.expiresAt && (
                              <p className="text-slate-400 text-sm">
                                Expires: {new Date(item.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {status === "complete" && <CheckCircle className="w-5 h-5 text-green-400" />}
                          {status === "expired" && <XCircle className="w-5 h-5 text-red-400" />}
                          {status === "expiring" && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                          {status === "missing" && <XCircle className="w-5 h-5 text-red-400" />}
                          {status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                          >
                            {item ? <Eye className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Uploaded Documents
                </CardTitle>
                <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documentsQuery.isLoading ? (
                <div className="space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-lg bg-slate-700/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-white font-medium">{doc.name}</p>
                          <p className="text-slate-400 text-sm">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Audit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <History className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Audit history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
