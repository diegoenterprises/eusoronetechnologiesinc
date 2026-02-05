/**
 * ERG LOOKUP PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Search, AlertTriangle, Shield, Flame, Droplets,
  Wind, Skull, Phone, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ERGLookup() {
  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState<any>(null);

  const lookupMutation = (trpc as any).esang.ergLookup.useMutation({
    onSuccess: (data: any) => { setResult(data); toast.success("Guide found"); },
    onError: (error: any) => { setResult(null); toast.error("Not found", { description: error.message }); },
  });

  const handleSearch = () => {
    if (searchValue) {
      lookupMutation.mutate({ unNumber: searchValue });
    }
  };

  const getHazardIcon = (hazard: string) => {
    switch (hazard.toLowerCase()) {
      case "fire": return <Flame className="w-5 h-5 text-orange-400" />;
      case "toxic": return <Skull className="w-5 h-5 text-purple-400" />;
      case "water_reactive": return <Droplets className="w-5 h-5 text-blue-400" />;
      case "vapor": return <Wind className="w-5 h-5 text-cyan-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">ERG 2024 Lookup</h1>
          <p className="text-slate-400 text-sm mt-1">Emergency Response Guidebook</p>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={searchValue} onChange={(e: any) => setSearchValue(e.target.value)} placeholder="Enter UN number (e.g., 1203)..." className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg" onKeyDown={(e: any) => e.key === "Enter" && handleSearch()} />
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleSearch} disabled={lookupMutation.isPending}>
              <Search className="w-4 h-4 mr-2" />Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {lookupMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {result && (
        <>
          <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl">UN{result.unNumber}</p>
                    <p className="text-lg text-slate-300">{result.name}</p>
                  </div>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-0 text-lg px-4 py-2">Guide {result.guideNumber}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Class</p><p className="text-white font-medium">{result.hazardClass}</p></div>
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Division</p><p className="text-white font-medium">{result.division || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Packing Group</p><p className="text-white font-medium">{result.packingGroup || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Placard</p><p className="text-white font-medium">{result.placard}</p></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Potential Hazards</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.hazards?.map((hazard: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-red-500/10 flex items-start gap-3">
                    {getHazardIcon(hazard.type)}
                    <div>
                      <p className="text-white font-medium">{hazard.title}</p>
                      <p className="text-sm text-slate-400">{hazard.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" />Public Safety</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Isolation Distance (Small Spill)</p>
                  <p className="text-white font-medium">{result.isolationSmall}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Isolation Distance (Large Spill)</p>
                  <p className="text-white font-medium">{result.isolationLarge}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Protective Actions</p>
                  <p className="text-white text-sm">{result.protectiveActions}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Flame className="w-5 h-5 text-orange-400" />Fire Response</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.fireResponse?.map((item: string, i: number) => (
                  <div key={i} className="p-2 rounded-lg bg-orange-500/10 text-sm text-slate-300">{item}</div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-400" />Spill Response</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.spillResponse?.map((item: string, i: number) => (
                  <div key={i} className="p-2 rounded-lg bg-blue-500/10 text-sm text-slate-300">{item}</div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl md:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-green-400" />Emergency Contacts</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-500">CHEMTREC</p>
                  <p className="text-white font-bold">1-800-424-9300</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-500">NRC</p>
                  <p className="text-white font-bold">1-800-424-8802</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-500">CANUTEC</p>
                  <p className="text-white font-bold">1-888-226-8832</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-xs text-slate-500">SETIQ</p>
                  <p className="text-white font-bold">01-800-00-214-00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!lookupMutation.isPending && !result && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Enter a UN number to lookup emergency response information</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
