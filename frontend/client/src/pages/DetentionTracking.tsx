/**
 * DETENTION TRACKING PAGE
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
  Clock, DollarSign, AlertTriangle, Package, MapPin,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DetentionTracking() {
  const [status, setStatus] = useState("all");

  const detentionsQuery = (trpc as any).billing.getDetentions.useQuery({ status });
  const statsQuery = (trpc as any).billing.getDetentionStats.useQuery();

  const claimMutation = (trpc as any).billing.claimDetention.useMutation({
    onSuccess: () => { toast.success("Detention claimed"); detentionsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-red-500/20 text-red-400 border-0"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending Claim</Badge>;
      case "claimed": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Claimed</Badge>;
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Detention Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Track and claim detention time</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><Clock className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.active || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><AlertTriangle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.pendingAmount?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.collected?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Collected</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Clock className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.avgHours}h</p>}<p className="text-xs text-slate-400">Avg Time</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="claimed">Claimed</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" />Detention Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          {detentionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (detentionsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No detention events</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(detentionsQuery.data as any)?.map((detention: any) => (
                <div key={detention.id} className={cn("p-4 flex items-center justify-between", detention.status === "active" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", detention.status === "active" ? "bg-red-500/20" : detention.status === "paid" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                      <Clock className={cn("w-5 h-5", detention.status === "active" ? "text-red-400" : detention.status === "paid" ? "text-green-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">Load #{detention.loadNumber}</p>
                        {getStatusBadge(detention.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-3 h-3" /><span>{detention.location}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>{detention.type}</span>
                        <span>Started: {detention.startTime}</span>
                        {detention.endTime && <span>Ended: {detention.endTime}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-cyan-400">{detention.hours}h</p>
                      <p className="text-green-400 font-medium">${detention.amount}</p>
                    </div>
                    {detention.status === "pending" && (
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={() => claimMutation.mutate({ detentionId: detention.id })}>
                        Claim
                      </Button>
                    )}
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
