/**
 * OPPORTUNITIES PAGE - CATALYST PROFILE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, MapPin, DollarSign, Clock, Star,
  Zap, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Opportunities() {
  const [category, setCategory] = useState("all");

  const opportunitiesQuery = (trpc as any).catalysts.getOpportunities.useQuery({ category });
  const statsQuery = (trpc as any).catalysts.getOpportunityStats.useQuery();

  const applyMutation = (trpc as any).catalysts.applyToOpportunity.useMutation({
    onSuccess: () => { toast.success("Application submitted"); opportunitiesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent": return <Badge className="bg-red-500 text-white border-0">Urgent</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High Priority</Badge>;
      case "normal": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Normal</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{urgency}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Opportunities</h1>
          <p className="text-slate-400 text-sm mt-1">Recommended loads based on your profile</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><TrendingUp className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Available</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><Zap className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.urgent || 0}</p>}<p className="text-xs text-slate-400">Urgent</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.totalValue?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Total Value</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Star className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.premium || 0}</p>}<p className="text-xs text-slate-400">Premium</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="hazmat">HazMat</SelectItem>
          <SelectItem value="oversized">Oversized</SelectItem>
          <SelectItem value="refrigerated">Refrigerated</SelectItem>
          <SelectItem value="flatbed">Flatbed</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" />Opportunities</CardTitle></CardHeader>
        <CardContent className="p-0">
          {opportunitiesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
          ) : !opportunitiesQuery.data || (Array.isArray(opportunitiesQuery.data) && opportunitiesQuery.data.length === 0) ? (
            <div className="text-center py-16"><TrendingUp className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No opportunities found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(opportunitiesQuery.data) ? opportunitiesQuery.data : []).map((opp: any) => (
                <div key={opp.id} className={cn("p-4", opp.urgency === "urgent" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{opp.title}</p>
                        {getUrgencyBadge(opp.urgency)}
                        {opp.premium && <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Star className="w-3 h-3 mr-1" />Premium</Badge>}
                      </div>
                      <p className="text-sm text-slate-400">{opp.description}</p>
                    </div>
                    <p className="text-green-400 font-bold text-xl">${opp.rate?.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Route</p>
                      <p className="text-white text-sm flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.origin} → {opp.destination}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="text-white text-sm">{opp.category}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Deadline</p>
                      <p className="text-white text-sm flex items-center gap-1"><Clock className="w-3 h-3" />{opp.deadline}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500">Applicants</p>
                      <p className="text-white text-sm">{opp.applicants} applied</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Posted: {opp.postedDate}</span>
                      <span>by {opp.shipper}</span>
                    </div>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => applyMutation.mutate({ opportunityId: opp.id })}>
                      <CheckCircle className="w-4 h-4 mr-1" />Apply
                    </Button>
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
