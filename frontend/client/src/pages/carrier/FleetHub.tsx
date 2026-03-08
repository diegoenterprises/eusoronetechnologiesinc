/**
 * FLEET HUB — Consolidated (aka FleetCommandCenter)
 * Merges: FleetTracking.tsx, FleetOverview.tsx, FleetManagement.tsx, FleetCommandCenter.tsx → FleetHub.tsx
 * Tabs: Live Tracking | Fleet Overview | Fleet Management | Command Center
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation, BarChart3, Settings, LayoutDashboard } from "lucide-react";

const FleetTrackingTab = lazy(() => import("../FleetTracking"));
const FleetOverviewTab = lazy(() => import("../FleetOverview"));
const FleetManagementTab = lazy(() => import("../FleetManagement"));
const FleetCommandCenterTab = lazy(() => import("../FleetCommandCenter"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function FleetHub() {
  const [activeTab, setActiveTab] = useState("tracking");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Fleet Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time tracking, fleet overview, and vehicle management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tracking"><Navigation className="w-4 h-4 mr-1.5" />Live Tracking</TabsTrigger>
          <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1.5" />Fleet Overview</TabsTrigger>
          <TabsTrigger value="management"><Settings className="w-4 h-4 mr-1.5" />Fleet Management</TabsTrigger>
          <TabsTrigger value="command"><LayoutDashboard className="w-4 h-4 mr-1.5" />Command Center</TabsTrigger>
        </TabsList>
        <TabsContent value="tracking">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FleetTrackingTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="overview">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FleetOverviewTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="management">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FleetManagementTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="command">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FleetCommandCenterTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
