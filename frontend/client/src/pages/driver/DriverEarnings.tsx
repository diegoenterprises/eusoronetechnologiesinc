/**
 * DRIVER EARNINGS — Consolidated
 * Merges: DriverEarnings.tsx, TripPay.tsx → driver/DriverEarnings.tsx
 * Tabs: Earnings Summary | Trip Pay
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const EarningsSummaryTab = lazy(() => import("../DriverEarnings"));
const TripPayTab = lazy(() => import("../TripPay"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function DriverEarningsHub() {
  const [activeTab, setActiveTab] = useState("summary");
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Driver Earnings
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Earnings summary, per-trip pay breakdown, and payment details
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary"><DollarSign className="w-4 h-4 mr-1.5" />Earnings Summary</TabsTrigger>
          <TabsTrigger value="trip-pay"><Truck className="w-4 h-4 mr-1.5" />Trip Pay</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><EarningsSummaryTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="trip-pay">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TripPayTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
