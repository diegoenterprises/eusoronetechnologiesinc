/**
 * RELEASE NOTES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Rocket, Sparkles, Bug, Wrench, ChevronDown,
  ChevronUp, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReleaseNotes() {
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

  const releasesQuery = trpc.releases.list.useQuery({ limit: 20 });
  const latestQuery = trpc.releases.getLatest.useQuery();

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "feature": return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case "bugfix": return <Bug className="w-4 h-4 text-red-400" />;
      case "improvement": return <Wrench className="w-4 h-4 text-yellow-400" />;
      default: return <Rocket className="w-4 h-4 text-purple-400" />;
    }
  };

  const getChangeBadge = (type: string) => {
    switch (type) {
      case "feature": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Feature</Badge>;
      case "bugfix": return <Badge className="bg-red-500/20 text-red-400 border-0">Bug Fix</Badge>;
      case "improvement": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Improvement</Badge>;
      default: return <Badge className="bg-purple-500/20 text-purple-400 border-0">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Release Notes
        </h1>
        <p className="text-slate-400 text-sm mt-1">Stay updated with the latest changes</p>
      </div>

      {/* Latest Release */}
      {latestQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Rocket className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-xl font-bold">Version {latestQuery.data?.version}</p>
                  <Badge className="bg-green-500/20 text-green-400 border-0">Latest</Badge>
                </div>
                <p className="text-slate-400 flex items-center gap-1"><Calendar className="w-4 h-4" />{latestQuery.data?.date}</p>
              </div>
            </div>
            <p className="text-slate-300">{latestQuery.data?.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* All Releases */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">All Releases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {releasesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : releasesQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No releases found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {releasesQuery.data?.map((release: any) => (
                <div key={release.id} className="p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/50">
                        <Rocket className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Version {release.version}</p>
                        <p className="text-xs text-slate-500">{release.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{release.featuresCount} features</Badge>
                        <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">{release.bugfixesCount} fixes</Badge>
                      </div>
                      {expandedRelease === release.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                  {expandedRelease === release.id && (
                    <div className="mt-4 pl-12 space-y-3">
                      {release.changes?.map((change: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          {getChangeIcon(change.type)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white">{change.title}</p>
                              {getChangeBadge(change.type)}
                            </div>
                            {change.description && <p className="text-sm text-slate-400">{change.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
