/**
 * DVIR MANAGEMENT PAGE
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
  ClipboardCheck, Truck, CheckCircle, AlertTriangle,
  Clock, User, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DVIRManagement() {
  const [filter, setFilter] = useState("all");

  const dvirsQuery = (trpc as any).fleet.getDVIRs.useQuery({ filter });
  const statsQuery = (trpc as any).fleet.getDVIRStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Passed</Badge>;
      case "defects": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Defects</Badge>;
      case "out_of_service": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Out of Service</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">DVIR Management</h1>
          <p className="text-slate-400 text-sm mt-1">Driver Vehicle Inspection Reports</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New DVIR
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><ClipboardCheck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.passed || 0}</p>}<p className="text-xs text-slate-400">Passed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><AlertTriangle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.defects || 0}</p>}<p className="text-xs text-slate-400">Defects</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.outOfService || 0}</p>}<p className="text-xs text-slate-400">OOS</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="passed">Passed</SelectItem>
          <SelectItem value="defects">Defects</SelectItem>
          <SelectItem value="out_of_service">Out of Service</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-cyan-400" />Inspection Reports</CardTitle></CardHeader>
        <CardContent className="p-0">
          {dvirsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (dvirsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><ClipboardCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No DVIRs found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(dvirsQuery.data as any)?.map((dvir: any) => (
                <div key={dvir.id} className={cn("p-4 flex items-center justify-between", dvir.status === "out_of_service" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", dvir.status === "passed" ? "bg-green-500/20" : dvir.status === "defects" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <ClipboardCheck className={cn("w-5 h-5", dvir.status === "passed" ? "text-green-400" : dvir.status === "defects" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{dvir.type} Inspection</p>
                        {getStatusBadge(dvir.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{dvir.vehicle}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{dvir.driver}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dvir.date} @ {dvir.time}</span>
                        {dvir.defectCount > 0 && <span className="text-yellow-400">{dvir.defectCount} defects</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">View</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
