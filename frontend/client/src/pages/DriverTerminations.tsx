/**
 * DRIVER TERMINATIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  UserMinus, Search, Calendar, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverTerminations() {
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("all");

  const terminationsQuery = (trpc as any).drivers.getTerminations.useQuery({ search, reason });
  const statsQuery = (trpc as any).drivers.getTerminationStats.useQuery();

  const stats = statsQuery.data;

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "voluntary": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Voluntary</Badge>;
      case "performance": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Performance</Badge>;
      case "policy": return <Badge className="bg-red-500/20 text-red-400 border-0">Policy Violation</Badge>;
      case "safety": return <Badge className="bg-red-500 text-white border-0">Safety</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{reason}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Driver Terminations</h1>
          <p className="text-slate-400 text-sm mt-1">Termination records</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><UserMinus className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><UserMinus className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.voluntary || 0}</p>}<p className="text-xs text-slate-400">Voluntary</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><UserMinus className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.involuntary || 0}</p>}<p className="text-xs text-slate-400">Involuntary</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Calendar className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.thisMonth || 0}</p>}<p className="text-xs text-slate-400">This Month</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search terminations..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="voluntary">Voluntary</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="policy">Policy Violation</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><UserMinus className="w-5 h-5 text-cyan-400" />Termination Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          {terminationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (terminationsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><UserMinus className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No terminations found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(terminationsQuery.data as any)?.map((term: any) => (
                <div key={term.id} className={cn("p-4 flex items-center justify-between", term.reason === "safety" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{term.name?.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{term.name}</p>
                        {getReasonBadge(term.reason)}
                        {term.rehireEligible && <Badge className="bg-green-500/20 text-green-400 border-0">Rehire Eligible</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Terminated: {term.terminationDate}</span>
                        <span>Tenure: {term.tenure}</span>
                        <span>Last Position: {term.position}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><FileText className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
