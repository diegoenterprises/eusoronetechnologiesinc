/**
 * CARRIER VETTING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, CheckCircle, AlertTriangle, Search, Truck,
  FileText, Clock, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierVetting() {
  const [search, setSearch] = useState("");

  const carriersQuery = (trpc as any).brokers.getPendingVetting.useQuery({ search });
  const statsQuery = (trpc as any).brokers.getVettingStats.useQuery();

  const approveMutation = (trpc as any).brokers.approveCarrier.useMutation({
    onSuccess: () => { toast.success("Carrier approved"); carriersQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = (trpc as any).brokers.rejectCarrier.useMutation({
    onSuccess: () => { toast.success("Carrier rejected"); carriersQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getCheckStatus = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "fail": return <XCircle className="w-4 h-4 text-red-400" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Carrier Vetting</h1>
          <p className="text-slate-400 text-sm mt-1">Verify and approve carriers</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>}<p className="text-xs text-slate-400">Approved</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><XCircle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>}<p className="text-xs text-slate-400">Rejected</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Shield className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search carriers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Pending Vetting</CardTitle></CardHeader>
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
          ) : (carriersQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" /><p className="text-slate-400">No pending carriers</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(carriersQuery.data as any)?.map((carrier: any) => (
                <div key={carrier.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold text-lg">{carrier.name}</p>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>
                      </div>
                      <p className="text-sm text-slate-400">MC# {carrier.mcNumber} | DOT# {carrier.dotNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg" onClick={() => rejectMutation.mutate({ carrierId: carrier.id })}>
                        <XCircle className="w-4 h-4 mr-1" />Reject
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={() => approveMutation.mutate({ carrierId: carrier.id })}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">Vetting Progress</span>
                      <span className="text-sm text-white">{carrier.checksCompleted}/{carrier.totalChecks} checks</span>
                    </div>
                    <Progress value={(carrier.checksCompleted / carrier.totalChecks) * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {carrier.checks?.map((check: any) => (
                      <div key={check.name} className={cn("p-2 rounded-lg flex items-center gap-2", check.status === "pass" ? "bg-green-500/10" : check.status === "fail" ? "bg-red-500/10" : "bg-slate-700/30")}>
                        {getCheckStatus(check.status)}
                        <span className="text-xs text-slate-300">{check.name}</span>
                      </div>
                    ))}
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
