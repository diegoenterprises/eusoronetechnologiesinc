/**
 * DOCK HUB — Consolidated (aka DockManagement)
 * Merges: DockAssignment.tsx, DockManagement.tsx, LoadingBays.tsx, GateOperations.tsx → DockHub.tsx
 * Tabs: Dock Management | Dock Assignment | Loading Bays | Gate Operations
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, MapPin, Warehouse, DoorOpen } from "lucide-react";

const DockManagementTab = lazy(() => import("../DockManagement"));
const DockAssignmentTab = lazy(() => import("../DockAssignment"));
const LoadingBaysTab = lazy(() => import("../LoadingBays"));
const GateOperationsTab = lazy(() => import("../GateOperations"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function DockHub() {
  const [activeTab, setActiveTab] = useState("management");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Dock Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">Dock management, bay assignments, loading bays, and gate operations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="management"><LayoutGrid className="w-4 h-4 mr-1.5" />Dock Management</TabsTrigger>
          <TabsTrigger value="assignment"><MapPin className="w-4 h-4 mr-1.5" />Dock Assignment</TabsTrigger>
          <TabsTrigger value="bays"><Warehouse className="w-4 h-4 mr-1.5" />Loading Bays</TabsTrigger>
          <TabsTrigger value="gate"><DoorOpen className="w-4 h-4 mr-1.5" />Gate Operations</TabsTrigger>
        </TabsList>
        <TabsContent value="management">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><DockManagementTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="assignment">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><DockAssignmentTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="bays">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><LoadingBaysTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="gate">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><GateOperationsTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
