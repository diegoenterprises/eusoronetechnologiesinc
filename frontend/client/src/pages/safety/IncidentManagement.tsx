/**
 * INCIDENT MANAGEMENT — Consolidated
 * Merges: AccidentReport.tsx, IncidentReport.tsx, IncidentReportForm.tsx, SafetyIncidents.tsx → IncidentManagement.tsx
 * Tabs: All Incidents | Accident Reports | Quick Report | HazMat Wizard
 */

import React, { useState, lazy, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, FileText, Send, Shield,
} from "lucide-react";

const SafetyIncidentsTab = lazy(() => import("../SafetyIncidents"));
const AccidentReportTab = lazy(() => import("../AccidentReport"));
const IncidentReportTab = lazy(() => import("../IncidentReport"));
const IncidentReportFormTab = lazy(() => import("../IncidentReportForm"));

function TabLoader() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function IncidentManagement() {
  const [activeTab, setActiveTab] = useState("incidents");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Incident Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track, report, and investigate all safety incidents</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="incidents"><AlertTriangle className="w-4 h-4 mr-1.5" />All Incidents</TabsTrigger>
          <TabsTrigger value="accidents"><FileText className="w-4 h-4 mr-1.5" />Accident Reports</TabsTrigger>
          <TabsTrigger value="report"><Send className="w-4 h-4 mr-1.5" />Quick Report</TabsTrigger>
          <TabsTrigger value="hazmat"><Shield className="w-4 h-4 mr-1.5" />HazMat Report</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0">
              <SafetyIncidentsTab />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="accidents">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0">
              <AccidentReportTab />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="report">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0">
              <IncidentReportTab />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="hazmat">
          <Suspense fallback={<TabLoader />}>
            <div className="[&>div]:!p-0 [&>div]:!max-w-none">
              <IncidentReportFormTab />
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
