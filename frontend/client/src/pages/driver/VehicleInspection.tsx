/**
 * VEHICLE INSPECTION — Consolidated (aka PreTripInspection)
 * Merges: PreTripChecklist.tsx, DVIR.tsx, DVIRManagement.tsx, PreTripInspection.tsx → VehicleInspection.tsx
 * Tabs: Pre-Trip Checklist | DVIR | DVIR Management | Inspection History
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, FileCheck, Settings, History } from "lucide-react";

const PreTripChecklistTab = lazy(() => import("../PreTripChecklist"));
const DVIRTab = lazy(() => import("../DVIR"));
const DVIRManagementTab = lazy(() => import("../DVIRManagement"));
const PreTripInspectionTab = lazy(() => import("../PreTripInspection"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function VehicleInspection() {
  const [activeTab, setActiveTab] = useState("checklist");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Vehicle Inspection
        </h1>
        <p className="text-slate-400 text-sm mt-1">Pre-trip checklists, DVIR reporting, and inspection management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checklist"><ClipboardCheck className="w-4 h-4 mr-1.5" />Pre-Trip Checklist</TabsTrigger>
          <TabsTrigger value="dvir"><FileCheck className="w-4 h-4 mr-1.5" />DVIR</TabsTrigger>
          <TabsTrigger value="management"><Settings className="w-4 h-4 mr-1.5" />DVIR Management</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-1.5" />Inspection History</TabsTrigger>
        </TabsList>
        <TabsContent value="checklist">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><PreTripChecklistTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="dvir">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><DVIRTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="management">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><DVIRManagementTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="history">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><PreTripInspectionTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
