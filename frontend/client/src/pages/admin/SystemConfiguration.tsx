/**
 * SYSTEM CONFIGURATION — Consolidated (Task 5.1.3)
 * Merges: SystemConfiguration.tsx, FeatureFlags.tsx → admin/SystemConfiguration.tsx
 * Tabs: Platform Config | Feature Flags
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Flag } from "lucide-react";

const PlatformConfigTab = lazy(() => import("../SystemConfiguration"));
const FeatureFlagsTab = lazy(() => import("../FeatureFlags"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-6">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
    </div>
  );
}

export default function SystemConfigurationHub() {
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          System Configuration
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform settings, feature flags, and system preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config"><Settings className="w-4 h-4 mr-1.5" />Platform Config</TabsTrigger>
          <TabsTrigger value="flags"><Flag className="w-4 h-4 mr-1.5" />Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><PlatformConfigTab /></div>
          </Suspense>
        </TabsContent>

        <TabsContent value="flags">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><FeatureFlagsTab /></div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
