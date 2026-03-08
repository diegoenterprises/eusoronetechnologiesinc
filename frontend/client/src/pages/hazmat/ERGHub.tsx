/**
 * ERG HUB — Consolidated Emergency Response Guidebook (3→1)
 * ═══════════════════════════════════════════════════════════
 * Merges: Erg.tsx (full ERG + AI), ERGGuide.tsx (guide viewer), ERGLookup.tsx (UN lookup)
 * Tabs: Full ERG | Guide Reference | Quick Lookup
 */

import React, { lazy, Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Shield } from "lucide-react";

const ErgFull = lazy(() => import("../Erg"));
const ERGGuide = lazy(() => import("../ERGGuide"));
const ERGLookup = lazy(() => import("../ERGLookup"));

function TabSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

export default function ERGHub() {
  const [tab, setTab] = useState("full");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          Emergency Response Guidebook
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ERG 2024 — UN Lookup, Guide Reference, ESANG AI Integration
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-slate-800/60 border border-slate-700/50">
          <TabsTrigger value="full" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20">
            <Shield className="w-4 h-4" /> Full ERG
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20">
            <BookOpen className="w-4 h-4" /> Guide Reference
          </TabsTrigger>
          <TabsTrigger value="lookup" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20">
            <Search className="w-4 h-4" /> Quick Lookup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="full" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <ErgFull />
          </Suspense>
        </TabsContent>

        <TabsContent value="guide" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <ERGGuide />
          </Suspense>
        </TabsContent>

        <TabsContent value="lookup" className="mt-4">
          <Suspense fallback={<TabSkeleton />}>
            <ERGLookup />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
