/**
 * TERMINAL HUB — Consolidated (aka TerminalCommandCenter)
 * Merges: TerminalDashboard.tsx, TerminalOperations.tsx, TerminalScheduling.tsx,
 *         TerminalInventory.tsx, TerminalSCADA.tsx, TerminalAppointments.tsx → TerminalHub.tsx
 * Tabs: Dashboard | Operations | Scheduling | Inventory | SCADA | Appointments
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Activity, Calendar, Package, Gauge, Clock } from "lucide-react";

const TerminalDashboardTab = lazy(() => import("../TerminalDashboard"));
const TerminalOperationsTab = lazy(() => import("../TerminalOperations"));
const TerminalSchedulingTab = lazy(() => import("../TerminalScheduling"));
const TerminalInventoryTab = lazy(() => import("../TerminalInventory"));
const TerminalSCADATab = lazy(() => import("../TerminalSCADA"));
const TerminalAppointmentsTab = lazy(() => import("../TerminalAppointments"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function TerminalHub() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Terminal Command Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Dashboard, operations, scheduling, inventory, SCADA, and appointments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="operations"><Activity className="w-4 h-4 mr-1.5" />Operations</TabsTrigger>
          <TabsTrigger value="scheduling"><Calendar className="w-4 h-4 mr-1.5" />Scheduling</TabsTrigger>
          <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-1.5" />Inventory</TabsTrigger>
          <TabsTrigger value="scada"><Gauge className="w-4 h-4 mr-1.5" />SCADA</TabsTrigger>
          <TabsTrigger value="appointments"><Clock className="w-4 h-4 mr-1.5" />Appointments</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalDashboardTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="operations">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalOperationsTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="scheduling">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalSchedulingTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="inventory">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalInventoryTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="scada">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalSCADATab /></div></Suspense>
        </TabsContent>
        <TabsContent value="appointments">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalAppointmentsTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
