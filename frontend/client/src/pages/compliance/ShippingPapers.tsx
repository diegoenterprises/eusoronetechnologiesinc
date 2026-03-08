/**
 * SHIPPING PAPERS — Consolidated
 * Merges: BOLGeneration.tsx, BOLManagement.tsx → ShippingPapers.tsx
 * Tabs: Generate BOL | Manage BOLs
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FilePlus, FileText } from "lucide-react";

const BOLGenerationTab = lazy(() => import("../BOLGeneration"));
const BOLManagementTab = lazy(() => import("../BOLManagement"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function ShippingPapers() {
  const [activeTab, setActiveTab] = useState("manage");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Shipping Papers
        </h1>
        <p className="text-slate-400 text-sm mt-1">Bill of Lading generation and management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manage"><FileText className="w-4 h-4 mr-1.5" />Manage BOLs</TabsTrigger>
          <TabsTrigger value="generate"><FilePlus className="w-4 h-4 mr-1.5" />Generate BOL</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><BOLManagementTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="generate">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><BOLGenerationTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
