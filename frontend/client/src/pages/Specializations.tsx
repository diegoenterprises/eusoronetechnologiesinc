/**
 * SPECIALIZATIONS PAGE - CATALYST PROFILE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Zap, CheckCircle, Star, Award, Plus, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Specializations() {
  const specializationsQuery = (trpc as any).catalysts.getSpecializations.useQuery();
  const statsQuery = (trpc as any).catalysts.getSpecializationStats.useQuery();

  const stats = statsQuery.data;

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "expert": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><Star className="w-3 h-3 mr-1" />Expert</Badge>;
      case "advanced": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Advanced</Badge>;
      case "intermediate": return <Badge className="bg-green-500/20 text-green-400 border-0">Intermediate</Badge>;
      case "beginner": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Beginner</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{level}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Specializations</h1>
          <p className="text-slate-400 text-sm mt-1">Your expertise areas and certifications</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Specialization
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Zap className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Star className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.expert || 0}</p>}<p className="text-xs text-slate-400">Expert</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.certified || 0}</p>}<p className="text-xs text-slate-400">Certified</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Award className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.matchRate}%</p>}<p className="text-xs text-slate-400">Match Rate</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400" />Your Specializations</CardTitle></CardHeader>
        <CardContent>
          {specializationsQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : !specializationsQuery.data || (Array.isArray(specializationsQuery.data) && specializationsQuery.data.length === 0) ? (
            <div className="text-center py-16"><Zap className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No specializations added yet</p></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(Array.isArray(specializationsQuery.data) ? specializationsQuery.data : []).map((spec: any) => (
                <div key={spec.id} className={cn("p-4 rounded-xl border", spec.level === "expert" ? "bg-purple-500/5 border-purple-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", spec.level === "expert" ? "bg-purple-500/20" : "bg-cyan-500/20")}>
                        <Zap className={cn("w-5 h-5", spec.level === "expert" ? "text-purple-400" : "text-cyan-400")} />
                      </div>
                      <div>
                        <p className="text-white font-bold">{spec.name}</p>
                        <p className="text-xs text-slate-500">{spec.category}</p>
                      </div>
                    </div>
                    {getLevelBadge(spec.level)}
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{spec.description}</p>
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Experience</span>
                      <span className="text-xs text-cyan-400">{spec.experience}%</span>
                    </div>
                    <Progress value={spec.experience} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{spec.loadsCompleted} loads completed</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />{spec.successRate}% success</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
