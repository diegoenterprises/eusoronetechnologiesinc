/**
 * ERG GUIDE PAGE (Emergency Response Guidebook)
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Search, Shield, Flame, Wind, Droplets,
  Skull, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ERGGuide() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const searchQuery = (trpc as any).esang.searchERG.useQuery(
    { query: searchTerm },
    { enabled: searchTerm.length >= 2 }
  );

  const guideQuery = (trpc as any).esang.getERGGuide.useQuery(
    { guideNumber: selectedGuide! },
    { enabled: !!selectedGuide }
  );

  const recentQuery = (trpc as any).esang.getRecentERGLookups.useQuery({ limit: 10 });

  const guide = guideQuery.data;

  const getHazardIcon = (hazardClass: string) => {
    switch (hazardClass) {
      case "flammable": return <Flame className="w-5 h-5 text-orange-400" />;
      case "toxic": return <Skull className="w-5 h-5 text-purple-400" />;
      case "corrosive": return <Droplets className="w-5 h-5 text-yellow-400" />;
      case "oxidizer": return <Wind className="w-5 h-5 text-cyan-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            ERG 2024 Guide
          </h1>
          <p className="text-slate-400 text-sm mt-1">Emergency Response Guidebook for Hazardous Materials</p>
        </div>
        <Badge className="bg-orange-500/20 text-orange-400 border-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Hazmat Reference
        </Badge>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search by UN number, name, or guide number..."
              className="pl-12 py-6 text-lg bg-slate-700/30 border-slate-600/50 rounded-xl focus:border-cyan-500/50"
            />
          </div>
          
          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="mt-4 max-w-2xl mx-auto">
              {searchQuery.isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (searchQuery.data as any)?.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No results found</p>
              ) : (
                <div className="space-y-2">
                  {(searchQuery.data as any)?.map((result: any) => (
                    <div 
                      key={result.id} 
                      className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => setSelectedGuide(result.guideNumber)}
                    >
                      <div className="flex items-center gap-3">
                        {getHazardIcon(result.hazardClass)}
                        <div>
                          <p className="text-white font-medium">{result.name}</p>
                          <p className="text-sm text-slate-400">UN{result.unNumber} • Guide {result.guideNumber}</p>
                        </div>
                      </div>
                      <Badge className={cn("border-0", result.hazardClass === "flammable" ? "bg-orange-500/20 text-orange-400" : result.hazardClass === "toxic" ? "bg-purple-500/20 text-purple-400" : "bg-red-500/20 text-red-400")}>
                        {result.hazardClass}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guide Details */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Guide Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedGuide ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">Search for a material</p>
                <p className="text-slate-500 text-sm mt-1">Guide details will appear here</p>
              </div>
            ) : guideQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : guide ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-orange-400 text-sm font-medium">Guide {guide.guideNumber}</p>
                      <p className="text-white text-xl font-bold">{guide.name}</p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500/20">
                      <AlertTriangle className="w-8 h-8 text-orange-400" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {guide.hazardClasses?.map((hc: string, idx: number) => (
                      <Badge key={idx} className="bg-red-500/20 text-red-400 border-0">{hc}</Badge>
                    ))}
                  </div>
                </div>

                {/* Potential Hazards */}
                <div>
                  <p className="text-red-400 font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    POTENTIAL HAZARDS
                  </p>
                  <div className="space-y-3">
                    {guide.potentialHazards?.map((hazard: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-white font-medium">{hazard.category}</p>
                        <ul className="mt-2 space-y-1">
                          {hazard.items?.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className="text-red-400 mt-1">-</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Public Safety */}
                <div>
                  <p className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PUBLIC SAFETY
                  </p>
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <ul className="space-y-2">
                      {guide.publicSafety?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">-</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Emergency Response */}
                <div>
                  <p className="text-green-400 font-bold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    EMERGENCY RESPONSE
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-green-400 font-medium mb-2">Fire</p>
                      <ul className="space-y-1">
                        {guide.emergencyResponse?.fire?.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-blue-400 font-medium mb-2">Spill/Leak</p>
                      <ul className="space-y-1">
                        {guide.emergencyResponse?.spill?.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-300">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">Guide not found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Lookups */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Lookups</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (recentQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No recent lookups</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(recentQuery.data as any)?.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedGuide(item.guideNumber)}
                  >
                    <div className="flex items-center gap-2">
                      {getHazardIcon(item.hazardClass)}
                      <div>
                        <p className="text-white font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">Guide {item.guideNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
