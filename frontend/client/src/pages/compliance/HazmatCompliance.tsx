/**
 * HAZMAT COMPLIANCE — Consolidated (Task 5.3.2)
 * Merges: HazmatCertifications.tsx, HazmatEndorsement.tsx,
 *         HazmatRegistration.tsx, HazmatRouteCompliance.tsx
 * Tabs: Certifications | Endorsement | Registration | Route Compliance
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Award, Database, Navigation } from "lucide-react";

const CertificationsTab = lazy(() => import("../HazmatCertifications"));
const EndorsementTab = lazy(() => import("../HazmatEndorsement"));
const RegistrationTab = lazy(() => import("../HazmatRegistration"));
const RouteComplianceTab = lazy(() => import("../HazmatRouteCompliance"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function HazmatCompliance() {
  const [activeTab, setActiveTab] = useState("certifications");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Hazmat Compliance
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Certifications, endorsements, PHMSA registration, and route compliance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="certifications"><Shield className="w-4 h-4 mr-1.5" />Certifications</TabsTrigger>
          <TabsTrigger value="endorsement"><Award className="w-4 h-4 mr-1.5" />Endorsement</TabsTrigger>
          <TabsTrigger value="registration"><Database className="w-4 h-4 mr-1.5" />Registration</TabsTrigger>
          <TabsTrigger value="route"><Navigation className="w-4 h-4 mr-1.5" />Route Compliance</TabsTrigger>
        </TabsList>
        <TabsContent value="certifications">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><CertificationsTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="endorsement">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><EndorsementTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="registration">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><RegistrationTab /></div></Suspense>
        </TabsContent>
        <TabsContent value="route">
          <Suspense fallback={<TabLoader />}><div className="[&>div]:!p-0"><RouteComplianceTab /></div></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
