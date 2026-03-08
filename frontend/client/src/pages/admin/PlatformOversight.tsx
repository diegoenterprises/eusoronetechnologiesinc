/**
 * PLATFORM OVERSIGHT — Consolidated
 * Merges: PlatformClaimsOversight.tsx, PlatformLoadsOversight.tsx, PlatformSupportOversight.tsx → PlatformOversight.tsx
 * Tabs: Loads | Claims & Disputes | Support Tickets
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, HelpCircle } from "lucide-react";

const PlatformLoadsTab = lazy(() => import("../PlatformLoadsOversight"));
const PlatformClaimsTab = lazy(() => import("../PlatformClaimsOversight"));
const PlatformSupportTab = lazy(() => import("../PlatformSupportOversight"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function PlatformOversight() {
  const [activeTab, setActiveTab] = useState("loads");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Platform Oversight
        </h1>
        <p className="text-slate-400 text-sm mt-1">Super Admin view of all loads, claims, and support tickets</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="loads"><Package className="w-4 h-4 mr-1.5" />Loads</TabsTrigger>
          <TabsTrigger value="claims"><AlertTriangle className="w-4 h-4 mr-1.5" />Claims & Disputes</TabsTrigger>
          <TabsTrigger value="support"><HelpCircle className="w-4 h-4 mr-1.5" />Support Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="loads">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><PlatformLoadsTab /></div>
          </Suspense>
        </TabsContent>

        <TabsContent value="claims">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><PlatformClaimsTab /></div>
          </Suspense>
        </TabsContent>

        <TabsContent value="support">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0"><PlatformSupportTab /></div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
