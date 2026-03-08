/**
 * FACILITY HUB — Consolidated (aka FacilityProfile)
 * Merges: Facility.tsx, FacilityProfile.tsx, MyTerminals.tsx, TerminalStaff.tsx, TerminalPartners.tsx → FacilityHub.tsx
 * Tabs: Terminal Profile | Facility Details | My Terminals | Staff | Partners
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Factory, MapPin, Users, Handshake } from "lucide-react";

const FacilityTab = lazy(() => import("../Facility"));
const FacilityProfileTab = lazy(() => import("../FacilityProfile"));
const MyTerminalsTab = lazy(() => import("../MyTerminals"));
const TerminalStaffTab = lazy(() => import("../TerminalStaff"));
const TerminalPartnersTab = lazy(() => import("../TerminalPartners"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function FacilityHub() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Facility Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">Terminal profiles, facility details, staff, and partnerships</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile"><Building2 className="w-4 h-4 mr-1.5" />Terminal Profile</TabsTrigger>
          <TabsTrigger value="facility"><Factory className="w-4 h-4 mr-1.5" />Facility Details</TabsTrigger>
          <TabsTrigger value="terminals"><MapPin className="w-4 h-4 mr-1.5" />My Terminals</TabsTrigger>
          <TabsTrigger value="staff"><Users className="w-4 h-4 mr-1.5" />Staff</TabsTrigger>
          <TabsTrigger value="partners"><Handshake className="w-4 h-4 mr-1.5" />Partners</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FacilityTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="facility">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><FacilityProfileTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="terminals">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><MyTerminalsTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="staff">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalStaffTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="partners">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><TerminalPartnersTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
