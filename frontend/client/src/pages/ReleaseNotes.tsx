/**
 * RELEASE NOTES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Bug, Wrench, AlertTriangle,
  Clock, Tag, ChevronDown, ChevronUp
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";

export default function ReleaseNotes() {
  const [filter, setFilter] = useState("all");
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

  const releasesQuery = (trpc as any).system.getReleaseNotes.useQuery({ filter, limit: 20 });
  const latestQuery = (trpc as any).system.getLatestVersion.useQuery();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature": return <EsangIcon className="w-4 h-4 text-cyan-400" />;
      case "bugfix": return <Bug className="w-4 h-4 text-red-400" />;
      case "improvement": return <Wrench className="w-4 h-4 text-purple-400" />;
      case "security": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "feature": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0"><EsangIcon className="w-3 h-3 mr-1" />Feature</Badge>;
      case "bugfix": return <Badge className="bg-red-500/20 text-red-400 border-0"><Bug className="w-3 h-3 mr-1" />Bug Fix</Badge>;
      case "improvement": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><Wrench className="w-3 h-3 mr-1" />Improvement</Badge>;
      case "security": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Security</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Release Notes
          </h1>
          <p className="text-slate-400 text-sm mt-1">Stay updated with the latest changes</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Updates</SelectItem>
            <SelectItem value="feature">Features</SelectItem>
            <SelectItem value="bugfix">Bug Fixes</SelectItem>
            <SelectItem value="improvement">Improvements</SelectItem>
            <SelectItem value="security">Security</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Latest Version */}
      {latestQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Tag className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Version</p>
                <p className="text-white text-2xl font-bold">{(latestQuery.data as any)?.version}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-slate-400 text-sm">Released</p>
                <p className="text-white">{(latestQuery.data as any)?.releasedAt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Release List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {releasesQuery.isLoading ? (
            <div className="p-4 space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (releasesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No release notes found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(releasesQuery.data as any)?.map((release: any) => (
                <div key={release.id} className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}>
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-white/[0.04]">
                        <Tag className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold text-lg">{release.version}</p>
                          {release.isLatest && <Badge className="bg-green-500/20 text-green-400 border-0">Latest</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{release.releasedAt}</span>
                          <span>{release.changes?.length || 0} changes</span>
                        </div>
                      </div>
                    </div>
                    {expandedRelease === release.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>

                  {expandedRelease === release.id && (
                    <div className="mt-4 ml-12 space-y-3">
                      {release.summary && <p className="text-slate-400 text-sm mb-4">{release.summary}</p>}
                      {release.changes?.map((change: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30">
                          {getTypeIcon(change.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white text-sm">{change.title}</p>
                              {getTypeBadge(change.type)}
                            </div>
                            {change.description && <p className="text-xs text-slate-500">{change.description}</p>}
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
