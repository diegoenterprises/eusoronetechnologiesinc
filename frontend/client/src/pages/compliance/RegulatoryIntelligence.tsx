/**
 * REGULATORY INTELLIGENCE — Consolidated
 * Merges: OperatingAuthority.tsx, IFTAReporting.tsx, Violations.tsx, MVRReports.tsx, NRCReport.tsx, SAFERLookup.tsx → RegulatoryIntelligence.tsx
 * Tabs: Operating Authority | IFTA | Violations | MVR Reports | NRC | SAFER Lookup
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Receipt, AlertTriangle, FileText, Radio, Search } from "lucide-react";

const OperatingAuthorityTab = lazy(() => import("../OperatingAuthority"));
const IFTAReportingTab = lazy(() => import("../IFTAReporting"));
const ViolationsTab = lazy(() => import("../Violations"));
const MVRReportsTab = lazy(() => import("../MVRReports"));
const NRCReportTab = lazy(() => import("../NRCReport"));
const SAFERLookupTab = lazy(() => import("../SAFERLookup"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function RegulatoryIntelligence() {
  const [activeTab, setActiveTab] = useState("authority");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Regulatory Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">Operating authority, IFTA, violations, MVR, NRC, and SAFER lookups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="authority"><Shield className="w-4 h-4 mr-1.5" />Operating Authority</TabsTrigger>
          <TabsTrigger value="ifta"><Receipt className="w-4 h-4 mr-1.5" />IFTA</TabsTrigger>
          <TabsTrigger value="violations"><AlertTriangle className="w-4 h-4 mr-1.5" />Violations</TabsTrigger>
          <TabsTrigger value="mvr"><FileText className="w-4 h-4 mr-1.5" />MVR Reports</TabsTrigger>
          <TabsTrigger value="nrc"><Radio className="w-4 h-4 mr-1.5" />NRC</TabsTrigger>
          <TabsTrigger value="safer"><Search className="w-4 h-4 mr-1.5" />SAFER</TabsTrigger>
        </TabsList>
        <TabsContent value="authority">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><OperatingAuthorityTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="ifta">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><IFTAReportingTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="violations">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><ViolationsTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="mvr">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><MVRReportsTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="nrc">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><NRCReportTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="safer">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><SAFERLookupTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
