/**
 * EMERGENCY RESPONSE — Consolidated
 * Merges: SpillResponse.tsx, FireResponse.tsx, EvacuationDistance.tsx → EmergencyResponse.tsx
 * Tabs: Spill Response | Fire Response | Evacuation Distances
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, Flame, MapPin } from "lucide-react";

const SpillResponseTab = lazy(() => import("../SpillResponse"));
const FireResponseTab = lazy(() => import("../FireResponse"));
const EvacuationDistanceTab = lazy(() => import("../EvacuationDistance"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function EmergencyResponse() {
  const [activeTab, setActiveTab] = useState("spill");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Emergency Response
        </h1>
        <p className="text-slate-400 text-sm mt-1">HazMat spill, fire, and evacuation protocols per 49 CFR &amp; ERG 2024</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="spill"><Droplets className="w-4 h-4 mr-1.5" />Spill Response</TabsTrigger>
          <TabsTrigger value="fire"><Flame className="w-4 h-4 mr-1.5" />Fire Response</TabsTrigger>
          <TabsTrigger value="evacuation"><MapPin className="w-4 h-4 mr-1.5" />Evacuation Distances</TabsTrigger>
        </TabsList>
        <TabsContent value="spill">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><SpillResponseTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="fire">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FireResponseTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="evacuation">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><EvacuationDistanceTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
