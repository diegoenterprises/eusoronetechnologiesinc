/**
 * SYSTEM HEALTH — Consolidated
 * Merges: DatabaseHealth.tsx, SystemStatus.tsx, PlatformHealth.tsx → SystemHealth.tsx
 * Tabs: Platform Health | Database | System Status
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Database, Server } from "lucide-react";

const PlatformHealthTab = lazy(() => import("../PlatformHealth"));
const DatabaseHealthTab = lazy(() => import("../DatabaseHealth"));
const SystemStatusTab = lazy(() => import("../SystemStatus"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function SystemHealth() {
  const [activeTab, setActiveTab] = useState("platform");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          System Health
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform monitoring, database health, and service status</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="platform"><Activity className="w-4 h-4 mr-1.5" />Platform Health</TabsTrigger>
          <TabsTrigger value="database"><Database className="w-4 h-4 mr-1.5" />Database</TabsTrigger>
          <TabsTrigger value="status"><Server className="w-4 h-4 mr-1.5" />System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="platform">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><PlatformHealthTab /></div>
          </Suspense>
        </TabsContent>

        <TabsContent value="database">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><DatabaseHealthTab /></div>
          </Suspense>
        </TabsContent>

        <TabsContent value="status">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><SystemStatusTab /></div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
