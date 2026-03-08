/**
 * DRIVER QUALIFICATION — Consolidated
 * Merges: CDLVerification.tsx, DrugAlcoholTesting.tsx, DrugTestingManagement.tsx, BackgroundChecks.tsx → DriverQualification.tsx
 * Tabs: CDL Verification | Drug & Alcohol | Testing Management | Background Checks
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, TestTube, ClipboardList, ShieldCheck } from "lucide-react";

const CDLVerificationTab = lazy(() => import("../CDLVerification"));
const DrugAlcoholTestingTab = lazy(() => import("../DrugAlcoholTesting"));
const DrugTestingMgmtTab = lazy(() => import("../DrugTestingManagement"));
const BackgroundChecksTab = lazy(() => import("../BackgroundChecks"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function DriverQualification() {
  const [activeTab, setActiveTab] = useState("cdl");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Driver Qualification
        </h1>
        <p className="text-slate-400 text-sm mt-1">CDL verification, drug & alcohol testing, and background checks</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cdl"><CreditCard className="w-4 h-4 mr-1.5" />CDL Verification</TabsTrigger>
          <TabsTrigger value="drug-alcohol"><TestTube className="w-4 h-4 mr-1.5" />Drug & Alcohol</TabsTrigger>
          <TabsTrigger value="testing-mgmt"><ClipboardList className="w-4 h-4 mr-1.5" />Testing Mgmt</TabsTrigger>
          <TabsTrigger value="background"><ShieldCheck className="w-4 h-4 mr-1.5" />Background Checks</TabsTrigger>
        </TabsList>
        <TabsContent value="cdl">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><CDLVerificationTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="drug-alcohol">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><DrugAlcoholTestingTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="testing-mgmt">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><DrugTestingMgmtTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="background">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><BackgroundChecksTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
